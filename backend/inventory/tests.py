from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from accounts.models import User
from rest_framework.exceptions import ValidationError
from .services import _normalize_quantity, update_material
from .models import Material, Stock


class InventoryApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="555",
            role=User.ADMIN,
        )
        self.receptionist = User.objects.create_user(
            email="receptionist@example.com",
            password="secret123",
            full_name="Receptionist User",
            phone_number="444",
            role=User.RECEPTIONIST,
        )

    def test_material_list_requires_auth(self):
        response = self.client.get("/api/invetory/materials/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_material_create_validates_payload(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            "/api/invetory/materials/",
            {"material": {"color": "Black"}, "quantity_meters": 2},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_material_create_and_stock(self):
        self.client.force_authenticate(user=self.receptionist)
        response = self.client.post(
            "/api/invetory/materials/",
            {
                "material": {
                    "name": "Wool",
                    "color": "Black",
                    "texture": "Soft",
                },
                "quantity_meters": "5.5",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        material = Material.objects.get(name="Wool")
        self.assertEqual(material.inventory.quantity_meters, 5.5)

    def test_stock_adjust_invalid_action(self):
        material = Material.objects.create(name="Cotton", color="Blue")
        Stock.objects.create(material=material, quantity_meters=1)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/invetory/materials/{material.id}/stock/",
            {"action_type": "bad", "quantity_meters": 2},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stock_add_negative_rejected(self):
        material = Material.objects.create(name="Linen", color="White")
        Stock.objects.create(material=material, quantity_meters=1)

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/invetory/materials/{material.id}/stock/",
            {"action_type": "add", "quantity_meters": -2},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class InventoryServiceTests(APITestCase):
    def test_normalize_quantity_rejects_negative(self):
        with self.assertRaises(ValidationError):
            _normalize_quantity(-1)

    def test_update_material_rejects_unexpected_fields(self):
        material = Material.objects.create(name="Silk", color="Red")
        admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="555",
            role=User.ADMIN,
        )
        with self.assertRaises(ValidationError):
            update_material(
                material=material,
                updates={"bad_field": "oops"},
                requester=admin,
            )
