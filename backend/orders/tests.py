from datetime import timedelta

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import AuditLog, Notification, User
from inventory.models import Material
from orders.models import Order, SuitType
from orders.serializers import CreateOrderSerializer, OrderStatusUpdateSerializer
from orders.services import (
    approve_order,
    create_order,
    list_orders,
    receive_order_for_processing,
    record_payment_info,
)


class OrderBaseTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="1111111111",
            role=User.ADMIN,
        )
        self.receptionist = User.objects.create_user(
            email="receptionist@example.com",
            password="secret123",
            full_name="Receptionist User",
            phone_number="2222222222",
            role=User.RECEPTIONIST,
        )
        self.suit_type = SuitType.objects.create(name="Classic", lapel_count=2)
        self.material = Material.objects.create(name="Wool", color="Black")

    def _measurement_payload(self):
        return {
            "chest": 40,
            "shoulder": 18,
            "waist": 32,
            "hips": 38,
            "arm_length": 25,
            "height": 170,
        }


class OrderSerializerTests(OrderBaseTestCase):
    def test_create_order_serializer_valid(self):
        serializer = CreateOrderSerializer(
            data={
                "customer_name": "Jane Doe",
                "customer_phone": "9000000000",
                "suit_type": self.suit_type.id,
                "material": self.material.id,
                "quantity": 1,
                "measurements": self._measurement_payload(),
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_order_status_update_serializer_allows_only_instore_or_closed(self):
        serializer = OrderStatusUpdateSerializer(data={"status": "IN_STORE"})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        invalid = OrderStatusUpdateSerializer(data={"status": "COMPLETED"})
        self.assertFalse(invalid.is_valid())


class OrderServiceFlowTests(OrderBaseTestCase):
    def test_create_receive_record_and_approve_order_flow(self):
        order = create_order(
            customer_name="Jane Doe",
            customer_phone="9000000000",
            suit_type=self.suit_type,
            material=self.material,
            quantity=2,
            measurements=self._measurement_payload(),
            requester=self.receptionist,
        )
        self.assertEqual(order.status, "INITIATED")
        self.assertTrue(order.order_code.startswith("HP-"))
        self.assertTrue(AuditLog.objects.filter(action="ORDER_CREATED").exists())
        self.assertTrue(Notification.objects.filter(notification_type="ORDER_CREATED").exists())

        order = receive_order_for_processing(
            order_id=order.id,
            total_price="120.00",
            expected_price="80.00",
            due_date=timezone.localdate() + timedelta(days=10),
            requester=self.receptionist,
        )
        self.assertEqual(order.status, "AWAITING_PAYMENT")
        self.assertTrue(order.payment_allowed)

        order = record_payment_info(
            order_id=order.id,
            payment_reference="BANK123",
            payment_amount="120.00",
            requester=self.receptionist,
        )
        self.assertEqual(order.status, "PENDING_APPROVAL")
        self.assertEqual(order.payment_reference, "BANK123")

        order = approve_order(order_id=order.id, requester=self.admin)
        self.assertEqual(order.status, "IN_PROGRESS")

    def test_list_orders_filters_active_and_processed(self):
        in_progress = create_order(
            customer_name="A",
            customer_phone="9000000001",
            suit_type=self.suit_type,
            material=self.material,
            quantity=1,
            measurements=self._measurement_payload(),
            requester=self.admin,
        )
        in_progress.status = "IN_PROGRESS"
        in_progress.save(update_fields=["status", "updated_at"])

        closed = create_order(
            customer_name="B",
            customer_phone="9000000002",
            suit_type=self.suit_type,
            material=self.material,
            quantity=1,
            measurements=self._measurement_payload(),
            requester=self.admin,
        )
        closed.status = "CLOSED"
        closed.save(update_fields=["status", "updated_at"])

        active = list_orders(requester=self.admin, active_only=True)
        processed = list_orders(requester=self.admin, processed_only=True)

        self.assertIn(in_progress.id, [obj.id for obj in active])
        self.assertIn(closed.id, [obj.id for obj in processed])

    def test_receive_order_rejects_non_initiated(self):
        order = create_order(
            customer_name="Jane Doe",
            customer_phone="9000000003",
            suit_type=self.suit_type,
            material=self.material,
            quantity=1,
            measurements=self._measurement_payload(),
            requester=self.admin,
        )
        order.status = "IN_PROGRESS"
        order.save(update_fields=["status", "updated_at"])

        with self.assertRaises(ValidationError):
            receive_order_for_processing(
                order_id=order.id,
                total_price="10.00",
                expected_price="5.00",
                due_date=timezone.localdate() + timedelta(days=1),
                requester=self.receptionist,
            )


class OrderEndpointFlowTests(OrderBaseTestCase):
    def test_create_order_endpoint_and_fetch_by_code(self):
        payload = {
            "customer_name": "Jane Doe",
            "customer_phone": "9000000004",
            "suit_type": self.suit_type.id,
            "material": self.material.id,
            "quantity": 2,
            "measurements": self._measurement_payload(),
        }

        response = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_code = response.data["order_code"]

        detail = self.client.get(f"/api/orders/code/{order_code}/")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data["order_code"], order_code)

    def test_processing_and_expire_endpoints(self):
        order = create_order(
            customer_name="Jane Doe",
            customer_phone="9000000005",
            suit_type=self.suit_type,
            material=self.material,
            quantity=1,
            measurements=self._measurement_payload(),
            requester=self.admin,
        )

        self.client.force_authenticate(self.receptionist)
        receive = self.client.post(
            f"/api/orders/{order.id}/process",
            {
                "action": "receive",
                "total_price": "150.00",
                "expected_price": "90.00",
                "due_date": str(timezone.localdate() + timedelta(days=2)),
            },
            format="json",
        )
        self.assertEqual(receive.status_code, status.HTTP_200_OK)
        self.assertEqual(receive.data["status"], "AWAITING_PAYMENT")

        order.refresh_from_db()
        order.due_date = timezone.localdate() - timedelta(days=1)
        order.status = "INITIATED"
        order.save(update_fields=["due_date", "status", "updated_at"])

        expire = self.client.post("/api/orders/expire/")
        self.assertEqual(expire.status_code, status.HTTP_200_OK)
        self.assertEqual(expire.data["expired_count"], 1)
