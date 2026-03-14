from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from inventory.models import Material
from orders.models import Order, SuitType
from orders.services import create_order, receive_order_for_processing
from garment.services import (
    list_orders_in_progress,
    mark_order_as_completed,
    mark_order_as_shipped,
    retrive_order_in_progress_by_code,
    retrive_shiped_order_by_code,
)


class GarmentFlowTests(APITestCase):
    def setUp(self):
        self.garment_admin = User.objects.create_user(
            email="garment@example.com",
            password="secret123",
            full_name="Garment Admin",
            phone_number="9200000001",
            role=User.GARMENT_ADMIN,
        )
        self.receptionist = User.objects.create_user(
            email="reception@example.com",
            password="secret123",
            full_name="Reception",
            phone_number="9200000002",
            role=User.RECEPTIONIST,
        )
        self.suit_type = SuitType.objects.create(name="Tuxedo", lapel_count=2)
        self.material = Material.objects.create(name="Silk", color="Gray")

    def _measurements(self):
        return {
            "chest": 42,
            "shoulder": 19,
            "waist": 34,
            "hips": 40,
            "arm_length": 25,
            "height": 172,
        }

    def _in_progress_order(self, phone="9200000010"):
        order = create_order(
            customer_name="Garment Customer",
            customer_phone=phone,
            suit_type=self.suit_type,
            material=self.material,
            quantity=1,
            measurements=self._measurements(),
            requester=self.receptionist,
        )
        order = receive_order_for_processing(
            order_id=order.id,
            total_price="200.00",
            expected_price="140.00",
            due_date=timezone.localdate() + timedelta(days=6),
            requester=self.receptionist,
        )
        order.status = "IN_PROGRESS"
        order.save(update_fields=["status", "updated_at"])
        return order

    def test_garment_service_flow_in_progress_to_shipped(self):
        order = self._in_progress_order(phone="9200000011")

        items = list_orders_in_progress(filter_by_customer="Garment")
        self.assertIn(order.id, [obj.id for obj in items])

        found = retrive_order_in_progress_by_code(order.order_code)
        self.assertIsNotNone(found)

        completed_result = mark_order_as_completed(order.order_code, self.garment_admin)
        self.assertEqual(completed_result["code"], 200)
        order.refresh_from_db()
        self.assertEqual(order.status, "COMPLETED")

        shipped_result = mark_order_as_shipped(order.order_code, self.garment_admin)
        self.assertEqual(shipped_result["code"], 200)
        order.refresh_from_db()
        self.assertEqual(order.status, "SHIPPED")

        shipped_order = retrive_shiped_order_by_code(order.order_code)
        self.assertIsNotNone(shipped_order)

    def test_garment_endpoints_list_detail_and_process(self):
        order = self._in_progress_order(phone="9200000012")
        self.client.force_authenticate(self.garment_admin)

        in_progress_list = self.client.get(
            "/api/garment/orders/in-progress/?customer=Garment"
        )
        self.assertEqual(in_progress_list.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any(
                item["order_code"] == order.order_code for item in in_progress_list.data
            )
        )

        in_progress_detail = self.client.get(
            f"/api/garment/orders/in-progress/detail/?code={order.order_code}"
        )
        self.assertEqual(in_progress_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(in_progress_detail.data["order_code"], order.order_code)

        completed = self.client.post(
            f"/api/garment/orders/{order.order_code}/process/",
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(completed.status_code, status.HTTP_200_OK)
        self.assertEqual(completed.data["status"], "COMPLETED")

        shipped = self.client.post(
            f"/api/garment/orders/{order.order_code}/process/",
            {"status": "SHIPPED"},
            format="json",
        )
        self.assertEqual(shipped.status_code, status.HTTP_200_OK)
        self.assertEqual(shipped.data["status"], "SHIPPED")

        shipped_list = self.client.get("/api/garment/orders/shipped/")
        self.assertEqual(shipped_list.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any(item["order_code"] == order.order_code for item in shipped_list.data)
        )

        shipped_detail = self.client.get(
            f"/api/garment/orders/shipped/detail/?code={order.order_code}"
        )
        self.assertEqual(shipped_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(shipped_detail.data["status"], "SHIPPED")

    def test_garment_process_requires_garment_admin(self):
        order = self._in_progress_order(phone="9200000013")
        self.client.force_authenticate(self.receptionist)

        response = self.client.post(
            f"/api/garment/orders/{order.order_code}/process/",
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_garment_service_rejects_invalid_state_transitions(self):
        order = self._in_progress_order(phone="9200000014")

        ship_before_complete = mark_order_as_shipped(
            order.order_code, self.garment_admin
        )
        self.assertEqual(ship_before_complete["code"], 400)

        mark_order_as_completed(order.order_code, self.garment_admin)
        already_completed = mark_order_as_completed(
            order.order_code, self.garment_admin
        )
        self.assertEqual(already_completed["code"], 400)

        mark_order_as_shipped(order.order_code, self.garment_admin)
        already_shipped = mark_order_as_shipped(order.order_code, self.garment_admin)
        self.assertEqual(already_shipped["code"], 400)

    def test_garment_process_endpoint_not_found_and_invalid_status(self):
        self.client.force_authenticate(self.garment_admin)

        not_found = self.client.post(
            "/api/garment/orders/HP-DOESNTEXIST/process/",
            {"status": "COMPLETED"},
            format="json",
        )
        self.assertEqual(not_found.status_code, status.HTTP_404_NOT_FOUND)

        order = self._in_progress_order(phone="9200000015")
        invalid_status = self.client.post(
            f"/api/garment/orders/{order.order_code}/process/",
            {"status": "CLOSED"},
            format="json",
        )
        self.assertEqual(invalid_status.status_code, status.HTTP_400_BAD_REQUEST)

    def test_shipped_orders_date_range_filter_string_and_invalid_string(self):
        order = self._in_progress_order(phone="9200000016")
        mark_order_as_completed(order.order_code, self.garment_admin)
        mark_order_as_shipped(order.order_code, self.garment_admin)

        self.client.force_authenticate(self.garment_admin)
        today = str(timezone.localdate())
        valid = self.client.get(
            f"/api/garment/orders/shipped/?date_range={today},{today}"
        )
        self.assertEqual(valid.status_code, status.HTTP_200_OK)
        self.assertTrue(
            any(item["order_code"] == order.order_code for item in valid.data)
        )

        invalid = self.client.get("/api/garment/orders/shipped/?date_range=bad-range")
        self.assertEqual(invalid.status_code, status.HTTP_200_OK)
