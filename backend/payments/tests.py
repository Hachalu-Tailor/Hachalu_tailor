from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from inventory.models import Material
from orders.models import Order, SuitType
from orders.services import create_order, receive_order_for_processing
from payments.models import Transaction
from payments.serializers import PaymentCreateSerializer
from payments.services import create_payment, verify_payment


class PaymentBaseTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@pay.com",
            password="secret123",
            full_name="Admin",
            phone_number="9100000001",
            role=User.ADMIN,
        )
        self.receptionist = User.objects.create_user(
            email="reception@pay.com",
            password="secret123",
            full_name="Reception",
            phone_number="9100000002",
            role=User.RECEPTIONIST,
        )
        self.other_receptionist = User.objects.create_user(
            email="other@pay.com",
            password="secret123",
            full_name="Other",
            phone_number="9100000003",
            role=User.RECEPTIONIST,
        )
        self.suit_type = SuitType.objects.create(name="Slim", lapel_count=1)
        self.material = Material.objects.create(name="Cotton", color="Blue")

    def _measurements(self):
        return {
            "chest": 41,
            "shoulder": 19,
            "waist": 33,
            "hips": 39,
            "arm_length": 24,
            "height": 171,
        }

    def _awaiting_payment_order(self, phone="9100000010"):
        order = create_order(
            customer_name="Pay Customer",
            customer_phone=phone,
            suit_type=self.suit_type,
            material=self.material,
            quantity=1,
            measurements=self._measurements(),
            requester=self.receptionist,
        )
        return receive_order_for_processing(
            order_id=order.id,
            total_price="120.00",
            expected_price="80.00",
            due_date=timezone.localdate() + timedelta(days=7),
            requester=self.receptionist,
        )


class PaymentSerializerTests(PaymentBaseTestCase):
    def test_payment_create_serializer_requires_one_receipt_field(self):
        invalid = PaymentCreateSerializer(
            data={"order_code": "HP-00000001", "amount": "20", "bank_ref_number": "B-1"}
        )
        self.assertFalse(invalid.is_valid())

        valid = PaymentCreateSerializer(
            data={
                "order_code": "HP-00000001",
                "amount": "20",
                "bank_ref_number": "B-1",
                "receipt_pdf_url": "https://example.com/r.pdf",
            }
        )
        self.assertTrue(valid.is_valid(), valid.errors)

    def test_payment_create_serializer_allows_decimal_shape(self):
        serializer = PaymentCreateSerializer(
            data={
                "order_code": "HP-00000001",
                "amount": "-1",
                "bank_ref_number": "B-NEG",
                "receipt_pdf_url": "https://example.com/r.pdf",
            }
        )
        self.assertTrue(serializer.is_valid())


class PaymentServiceTests(PaymentBaseTestCase):
    def test_create_and_verify_payment_flow(self):
        order = self._awaiting_payment_order(phone="9100000011")

        transaction_obj = create_payment(
            order_code=order.order_code,
            amount="120.00",
            bank_ref_number="BANK-100",
            receipt_pdf_url="https://example.com/payment.pdf",
        )
        self.assertEqual(transaction_obj.order_id.id, order.id)

        order.refresh_from_db()
        self.assertEqual(order.status, "PENDING_APPROVAL")

        verified = verify_payment(
            transaction_id=transaction_obj.id, reviewer=self.receptionist
        )
        self.assertTrue(verified.is_verified)

        order.refresh_from_db()
        self.assertEqual(order.status, "IN_PROGRESS")
        self.assertFalse(order.payment_allowed)

    def test_verify_payment_rejects_non_reviewer_non_admin(self):
        order = self._awaiting_payment_order(phone="9100000012")
        transaction_obj = create_payment(
            order_code=order.order_code,
            amount="130.00",
            bank_ref_number="BANK-101",
            receipt_pdf_url="https://example.com/payment2.pdf",
        )

        with self.assertRaises(ValidationError):
            verify_payment(
                transaction_id=transaction_obj.id, reviewer=self.other_receptionist
            )

    def test_create_payment_rejects_duplicate_for_same_order(self):
        order = self._awaiting_payment_order(phone="9100000015")
        create_payment(
            order_code=order.order_code,
            amount="130.00",
            bank_ref_number="BANK-102",
            receipt_pdf_url="https://example.com/payment4.pdf",
        )

        with self.assertRaises(ValidationError):
            create_payment(
                order_code=order.order_code,
                amount="130.00",
                bank_ref_number="BANK-103",
                receipt_pdf_url="https://example.com/payment5.pdf",
            )

    def test_create_payment_rejects_negative_amount(self):
        order = self._awaiting_payment_order(phone="9100000018")
        with self.assertRaises(ValidationError):
            create_payment(
                order_code=order.order_code,
                amount="-1",
                bank_ref_number="BANK-104",
                receipt_pdf_url="https://example.com/payment6.pdf",
            )


class PaymentEndpointTests(PaymentBaseTestCase):
    def test_payment_endpoints_create_verify_list_and_detail(self):
        order = self._awaiting_payment_order(phone="9100000013")

        create_resp = self.client.post(
            "/api/payments/",
            {
                "order_code": order.order_code,
                "amount": "140.00",
                "bank_ref_number": "BANK-200",
                "receipt_pdf_url": "https://example.com/payment3.pdf",
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        tx_id = create_resp.data["id"]

        self.client.force_authenticate(self.receptionist)
        verify_resp = self.client.post(
            f"/api/payments/{tx_id}/verify/",
            {"is_verified": True},
            format="json",
        )
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)

        list_resp = self.client.get("/api/payments/list/?is_verified=true")
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(list_resp.data), 1)

        detail_id = self.client.get(f"/api/payments/{tx_id}/")
        self.assertEqual(detail_id.status_code, status.HTTP_200_OK)

        detail_code = self.client.get("/api/payments/code/BANK-200/")
        self.assertEqual(detail_code.status_code, status.HTTP_200_OK)

        detail_order = self.client.get(f"/api/payments/order/{order.order_code}/")
        self.assertEqual(detail_order.status_code, status.HTTP_200_OK)

    def test_payment_verify_requires_authentication(self):
        order = self._awaiting_payment_order(phone="9100000014")
        tx = Transaction.objects.create(
            order_id=order,
            payment_amount="100.00",
            bank_ref_number="BANK-300",
            receipt_pdf_url="https://example.com/receipt.pdf",
        )

        response = self.client.post(
            f"/api/payments/{tx.id}/verify/", {"is_verified": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_payment_create_endpoint_requires_receipt_field(self):
        order = self._awaiting_payment_order(phone="9100000016")
        response = self.client.post(
            "/api/payments/",
            {
                "order_code": order.order_code,
                "amount": "140.00",
                "bank_ref_number": "BANK-201",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_payment_verify_endpoint_requires_true_flag(self):
        order = self._awaiting_payment_order(phone="9100000017")
        tx = Transaction.objects.create(
            order_id=order,
            payment_amount="100.00",
            bank_ref_number="BANK-301",
            receipt_pdf_url="https://example.com/receipt2.pdf",
        )

        self.client.force_authenticate(self.receptionist)
        response = self.client.post(
            f"/api/payments/{tx.id}/verify/",
            {"is_verified": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
