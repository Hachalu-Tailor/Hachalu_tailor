from datetime import timedelta

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
        customer = Customer.objects.create(
            full_name=kwargs.get("customer_name", "John Doe"),
            phone_number=kwargs.get("customer_phone", "1234567890"),
        )
        order = Order.objects.create(
            customer=customer,
            suit_type=kwargs.get("suit_type", self.suit_type),
            material=kwargs.get("material", self.material),
            status=kwargs.get("status", "INITIATED"),
            quantity=kwargs.get("quantity", 1),
            total_price=kwargs.get("total_price", "0.00"),
            due_date=kwargs.get("due_date", timezone.localdate()),
        )
        Measurement.objects.create(
            order=order,
            chest=40,
            shoulder=18,
            waist=32,
            hips=38,
            arm_length=25,
            height=170,
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
        self.assertEqual(response.data["status"], "INITIATED")
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
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_list_filters(self):
        active_order = self._create_order(status="INITIATED")
        processed_order = self._create_order(status="IN_PROGRESS")

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/orders/list/?processed_only=true")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item["id"] for item in response.data["results"]}
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

        response = self.client.post(
            f"/api/orders/{order.id}/process/",
            {
                "action": "record_payment",
                "payment_reference": "REF123",
                "payment_amount": "120.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "PENDING_APPROVAL")

        response = self.client.post(
            f"/api/orders/{order.id}/process/",
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "IN_PROGRESS")

    def test_order_update(self):
        order = self._create_order(quantity=1)

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"/api/orders/{order.id}/",
            {"quantity": 3, "status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity"], 3)
        self.assertEqual(response.data["status"], "COMPLETED")

    def test_order_expiration(self):
        past_due = timezone.localdate() - timedelta(days=1)
        order = self._create_order(status="INITIATED", due_date=past_due)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post("/api/orders/expire/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["expired_count"], 1)
        order.refresh_from_db()
        self.assertEqual(order.status, "EXPIRED")
