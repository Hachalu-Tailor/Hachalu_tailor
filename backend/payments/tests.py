from uuid import uuid4

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from inventory.models import Material
from orders.models import Customer, Measurement, Order, SuitType
from .models import Transaction
from .services import create_payment, verify_payment


class PaymentApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="555",
            role=User.ADMIN,
        )
        self.reviewer = User.objects.create_user(
            email="reviewer@example.com",
            password="secret123",
            full_name="Reviewer User",
            phone_number="444",
            role=User.RECEPTIONIST,
        )
        self.other_reviewer = User.objects.create_user(
            email="other@example.com",
            password="secret123",
            full_name="Other Reviewer",
            phone_number="333",
            role=User.RECEPTIONIST,
        )
        self.suit_type = SuitType.objects.create(name="Classic", lapel_count=2)
        self.material = Material.objects.create(
            name="Wool", color="Black", texture="Soft"
        )

    def _create_order(self, *, reviewed_by=None, allow_payment=False):
        customer = Customer.objects.create(
            full_name="Jane Doe",
            phone_number=f"{uuid4().hex[:12]}",
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
            suit_type=self.suit_type,
            material=self.material,
            measurement=measurement,
            order_code=f"HP-{uuid4().hex[:8].upper()}",
            status="AWAITING_PAYMENT" if allow_payment else "INITIATED",
            payment_allowed=allow_payment,
            reviewed_by=reviewed_by,
            quantity=1,
            total_price="120.00",
            due_date=timezone.localdate(),
        )
        return order

    def test_payment_create_requires_allowance(self):
        order = self._create_order(allow_payment=False)
        payload = {
            "order_code": order.order_code,
            "amount": "120.00",
            "full_name": order.customer.full_name,
            "phone_number": order.customer.phone_number,
            "bank_ref_number": "REF123",
            "receipt_pdf_url": "https://example.com/receipt.pdf",
        }
        response = self.client.post("/api/payments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_create_rejects_duplicate(self):
        order = self._create_order(allow_payment=True, reviewed_by=self.reviewer)
        payload = {
            "order_code": order.order_code,
            "amount": "120.00",
            "full_name": order.customer.full_name,
            "phone_number": order.customer.phone_number,
            "bank_ref_number": "REF123",
            "receipt_pdf_url": "https://example.com/receipt.pdf",
        }
        response = self.client.post("/api/payments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post("/api/payments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_create_requires_receipt(self):
        order = self._create_order(allow_payment=True, reviewed_by=self.reviewer)
        payload = {
            "order_code": order.order_code,
            "amount": "120.00",
            "full_name": order.customer.full_name,
            "phone_number": order.customer.phone_number,
            "bank_ref_number": "REF123",
        }
        response = self.client.post("/api/payments/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_verify_reviewer_only(self):
        order = self._create_order(allow_payment=True, reviewed_by=self.reviewer)
        transaction = Transaction.objects.create(
            order_id=order,
            payment_amount="120.00",
            bank_ref_number="REF123",
            receipt_pdf_url="https://example.com/receipt.pdf",
        )

        self.client.force_authenticate(user=self.other_reviewer)
        response = self.client.post(
            f"/api/payments/{transaction.id}/verify/",
            {"is_verified": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/payments/{transaction.id}/verify/",
            {"is_verified": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, "IN_PROGRESS")


class PaymentServiceTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="555",
            role=User.ADMIN,
        )
        self.reviewer = User.objects.create_user(
            email="reviewer@example.com",
            password="secret123",
            full_name="Reviewer User",
            phone_number="444",
            role=User.RECEPTIONIST,
        )
        self.suit_type = SuitType.objects.create(name="Classic", lapel_count=2)
        self.material = Material.objects.create(
            name="Wool", color="Black", texture="Soft"
        )

    def _create_order(self):
        customer = Customer.objects.create(
            full_name="Jane Doe",
            phone_number=f"{uuid4().hex[:12]}",
        )
        measurement = Measurement.objects.create(
            chest=40,
            shoulder=18,
            waist=32,
            hips=38,
            arm_length=25,
            height=170,
        )
        return Order.objects.create(
            customer=customer,
            suit_type=self.suit_type,
            material=self.material,
            measurement=measurement,
            order_code=f"HP-{uuid4().hex[:8].upper()}",
            status="AWAITING_PAYMENT",
            payment_allowed=True,
            reviewed_by=self.reviewer,
            quantity=1,
            total_price="120.00",
            due_date=timezone.localdate(),
        )

    def test_create_payment_rejects_mismatched_phone(self):
        order = self._create_order()
        with self.assertRaises(Exception):
            create_payment(
                order_code=order.order_code,
                amount="120.00",
                full_name=order.customer.full_name,
                phone_number="999",
                bank_ref_number="REF123",
                receipt_pdf_url="https://example.com/receipt.pdf",
            )

    def test_verify_payment_requires_reviewer_or_admin(self):
        order = self._create_order()
        transaction = Transaction.objects.create(
            order_id=order,
            payment_amount="120.00",
            bank_ref_number="REF123",
            receipt_pdf_url="https://example.com/receipt.pdf",
        )
        other_reviewer = User.objects.create_user(
            email="other@example.com",
            password="secret123",
            full_name="Other Reviewer",
            phone_number="333",
            role=User.RECEPTIONIST,
        )
        with self.assertRaises(Exception):
            verify_payment(transaction_id=transaction.id, reviewer=other_reviewer)
