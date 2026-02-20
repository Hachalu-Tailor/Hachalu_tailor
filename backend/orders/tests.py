from datetime import timedelta
from uuid import uuid4

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from inventory.models import Material
from .models import Customer, Measurement, Order, SuitType


class OrderApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="555",
            role=User.ADMIN,
        )
        self.suit_type = SuitType.objects.create(name="Classic", lapel_count=2)
        self.material = Material.objects.create(
            name="Wool", color="Black", texture="Soft"
        )

    def _create_order(self, **kwargs):
        default_phone = f"{uuid4().hex[:12]}"
        customer = Customer.objects.create(
            full_name=kwargs.get("customer_name", "John Doe"),
            phone_number=kwargs.get("customer_phone", default_phone),
        )
        measurement = Measurement.objects.create(
            chest=40,
            shoulder=18,
            waist=32,
            hips=38,
            arm_length=25,
            height=170,
        )
        order = Order.objects.create(
            customer=customer,
            suit_type=kwargs.get("suit_type", self.suit_type),
            material=kwargs.get("material", self.material),
            measurement=measurement,
            order_code=uuid4().hex[:10].upper(),
            status=kwargs.get("status", "INITIATED"),
            quantity=kwargs.get("quantity", 1),
            total_price=kwargs.get("total_price", "0.00"),
            due_date=kwargs.get("due_date", timezone.localdate()),
        )
        return order

    def test_create_order(self):
        payload = {
            "customer_name": "Jane Doe",
            "customer_phone": "9991112222",
            "suit_type": self.suit_type.id,
            "material": self.material.id,
            "quantity": 2,
            "measurements": {
                "chest": 40,
                "shoulder": 18,
                "waist": 32,
                "hips": 38,
                "arm_length": 25,
                "height": 170,
            },
        }

        response = self.client.post("/api/orders/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("order_id", response.data)
        self.assertIn("order_code", response.data)
        self.assertEqual(response.data["status"], "INITIATED")
        self.assertTrue(response.data["order_code"].startswith("HP-"))
        self.assertEqual(len(response.data["order_code"]), 11)
        self.assertTrue(Order.objects.filter(id=response.data["order_id"]).exists())

    def test_order_list_requires_admin(self):
        response = self.client.get("/api/orders/list/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        receptionist = User.objects.create_user(
            email="receptionist@example.com",
            password="secret123",
            full_name="Receptionist User",
            phone_number="444",
            role=User.RECEPTIONIST,
        )
        self.client.force_authenticate(user=receptionist)
        response = self.client.get("/api/orders/list/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_order_list_filters(self):
        active_order = self._create_order(status="INITIATED")
        processed_order = self._create_order(status="IN_PROGRESS")

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/orders/list/?processed_only=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"]
            if isinstance(response.data, dict)
            else response.data
        )
        ids = {item["id"] for item in results}
        self.assertIn(str(processed_order.id), ids)
        self.assertNotIn(str(active_order.id), ids)

    def test_order_processing_flow(self):
        order = self._create_order()

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/orders/{order.id}/process/",
            {"action": "receive", "total_price": "120.00", "due_date": "2030-01-01"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "AWAITING_PAYMENT")
        self.assertTrue(response.data.get("payment_allowed"))

        payment_payload = {
            "order_code": order.order_code,
            "amount": "120.00",
            "full_name": order.customer.full_name,
            "phone_number": order.customer.phone_number,
            "bank_ref_number": "REF123",
            "receipt_pdf_url": "https://example.com/receipt.pdf",
        }
        response = self.client.post("/api/payments/", payment_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["is_verified"], False)

        response = self.client.post(
            f"/api/orders/{order.id}/process/",
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "IN_PROGRESS")

    def test_order_update(self):
        order = self._create_order(quantity=1)

        receptionist = User.objects.create_user(
            email="receptionist@example.com",
            password="secret123",
            full_name="Receptionist User",
            phone_number="444",
            role=User.RECEPTIONIST,
        )
        self.client.force_authenticate(user=receptionist)
        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {"quantity": 3, "status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity"], 3)
        self.assertEqual(response.data["status"], "COMPLETED")

    def test_order_detail_by_code_public(self):
        order = self._create_order(status="INITIATED")

        response = self.client.get(f"/api/orders/code/{order.order_code}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_code"], order.order_code)

    def test_order_update_requires_auth(self):
        order = self._create_order(quantity=1)
        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {"quantity": 3},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_customer_payment_requires_allowance(self):
        order = self._create_order(status="INITIATED")

        response = self.client.post(
            "/api/payments/",
            {
                "order_code": order.order_code,
                "amount": "20.00",
                "full_name": order.customer.full_name,
                "phone_number": order.customer.phone_number,
                "bank_ref_number": "REF999",
                "receipt_pdf_url": "https://example.com/receipt.pdf",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_expiration(self):
        past_due = timezone.localdate() - timedelta(days=1)
        order = self._create_order(status="INITIATED", due_date=past_due)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/orders/expire/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["expired_count"], 1)
        order.refresh_from_db()
        self.assertEqual(order.status, "EXPIRED")
