from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase, APIRequestFactory

from .models import AuditLog
from .permissions import IsAdmin, IsReseptionist
from .services import (
    change_password,
    create_user,
    delete_user,
    get_user,
    list_users,
    reset_password,
    update_user,
)

User = get_user_model()


class UserManagerTests(TestCase):
    def test_create_user_requires_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="secret")

    def test_create_user_normalizes_email_and_hashes_password(self):
        user = User.objects.create_user(
            email="Test@Example.COM",
            password="secret123",
            full_name="Test User",
            phone_number="123",
            role=User.RECEPTIONIST,
        )

        self.assertEqual(user.email, "Test@example.com")
        self.assertTrue(user.check_password("secret123"))

    def test_create_superuser_requires_flags(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="secret123",
                is_staff=False,
                is_superuser=True,
                full_name="Admin",
                phone_number="999",
            )

        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="admin2@example.com",
                password="secret123",
                is_staff=True,
                is_superuser=False,
                full_name="Admin",
                phone_number="999",
            )


class UserModelTests(TestCase):
    def test_user_str_includes_name_email_role(self):
        user = User.objects.create_user(
            email="staff@example.com",
            password="secret123",
            full_name="Staff User",
            phone_number="123",
            role=User.RECEPTIONIST,
        )

        self.assertIn("Staff User", str(user))
        self.assertIn("staff@example.com", str(user))
        self.assertIn(User.RECEPTIONIST, str(user))


class ServiceTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="secret123",
            full_name="Admin User",
            phone_number="555",
            role=User.ADMIN,
        )

    def test_create_user_creates_audit_log_and_temp_password(self):
        user, temp_password = create_user(
            email="staff@example.com",
            full_name="Staff User",
            phone_number="111",
            role=User.RECEPTIONIST,
            requester=self.admin,
        )

        self.assertTrue(user.check_password(temp_password))
        self.assertEqual(AuditLog.objects.filter(action="USER_CREATED").count(), 1)

    def test_update_user_only_updates_provided_fields(self):
        user = User.objects.create_user(
            email="staff@example.com",
            password="secret123",
            full_name="Staff User",
            phone_number="111",
            role=User.RECEPTIONIST,
        )

        updated = update_user(
            user_id=user.id,
            requester=self.admin,
            full_name="New Name",
        )

        self.assertEqual(updated.full_name, "New Name")
        self.assertEqual(updated.email, "staff@example.com")
        self.assertEqual(AuditLog.objects.filter(action="USER_UPDATED").count(), 1)

    def test_update_user_missing_user_raises(self):
        with self.assertRaises(ValueError):
            update_user(
                user_id="00000000-0000-0000-0000-000000000000", requester=self.admin
            )

    def test_delete_user_removes_user_and_logs(self):
        user = User.objects.create_user(
            email="staff@example.com",
            password="secret123",
            full_name="Staff User",
            phone_number="111",
            role=User.RECEPTIONIST,
        )

        delete_user(user_id=user.id, requester=self.admin)

        self.assertFalse(User.objects.filter(id=user.id).exists())
        self.assertEqual(AuditLog.objects.filter(action="USER_DELETED").count(), 1)

    def test_delete_user_missing_user_raises(self):
        with self.assertRaises(ValueError):
            delete_user(
                user_id="00000000-0000-0000-0000-000000000000", requester=self.admin
            )

    def test_reset_password_changes_password_and_logs(self):
        user = User.objects.create_user(
            email="staff@example.com",
            password="secret123",
            full_name="Staff User",
            phone_number="111",
            role=User.RECEPTIONIST,
        )

        new_password = reset_password(user_id=user.id, requester=self.admin)

        user.refresh_from_db()
        self.assertTrue(user.check_password(new_password))
        self.assertEqual(AuditLog.objects.filter(action="PASSWORD_RESET").count(), 1)

    def test_reset_password_missing_user_raises(self):
        with self.assertRaises(ValueError):
            reset_password(
                user_id="00000000-0000-0000-0000-000000000000", requester=self.admin
            )

    def test_change_password_validates_old_password(self):
        user = User.objects.create_user(
            email="staff@example.com",
            password="secret123",
            full_name="Staff User",
            phone_number="111",
            role=User.RECEPTIONIST,
        )

        with self.assertRaises(ValueError):
            change_password(
                user_id=user.id,
                requester=self.admin,
                old_password="wrong",
                new_password="newpass123",
            )

        change_password(
            user_id=user.id,
            requester=self.admin,
            old_password="secret123",
            new_password="newpass123",
        )

        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass123"))
        self.assertEqual(AuditLog.objects.filter(action="PASSWORD_CHANGED").count(), 1)

    def test_change_password_missing_user_raises(self):
        with self.assertRaises(ValueError):
            change_password(
                user_id="00000000-0000-0000-0000-000000000000",
                requester=self.admin,
                old_password="secret123",
                new_password="newpass123",
            )

    def test_get_user_missing_raises(self):
        with self.assertRaises(ValueError):
            get_user(user_id="00000000-0000-0000-0000-000000000000")

    def test_list_users_filters_active_and_search(self):
        active = User.objects.create_user(
            email="active@example.com",
            password="secret123",
            full_name="Active User",
            phone_number="111",
            role=User.RECEPTIONIST,
        )
        inactive = User.objects.create_user(
            email="inactive@example.com",
            password="secret123",
            full_name="Inactive User",
            phone_number="222",
            role=User.RECEPTIONIST,
            is_active=False,
        )

        active_only = list_users(requester=self.admin)
        self.assertIn(active, list(active_only))
        self.assertNotIn(inactive, list(active_only))

        search_results = list_users(
            requester=self.admin, active_only=False, search_query="inactive"
        )
        self.assertIn(inactive, list(search_results))


class PermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_is_admin_permission(self):
        permission = IsAdmin()
        admin_user = SimpleNamespace(role="ADMIN")
        receptionist_user = SimpleNamespace(role="RECEPTIONIST")

        request = self.factory.get("/")
        request.user = admin_user
        self.assertTrue(permission.has_permission(request, None))

        request.user = receptionist_user
        self.assertFalse(permission.has_permission(request, None))

    def test_is_receptionist_permission(self):
        permission = IsReseptionist()
        admin_user = SimpleNamespace(role="ADMIN")
        receptionist_user = SimpleNamespace(role="RECEPTIONIST")

        request = self.factory.get("/")
        request.user = receptionist_user
        self.assertTrue(permission.has_permission(request, None))

        request.user = admin_user
        self.assertFalse(permission.has_permission(request, None))


class StaffApiTests(APITestCase):
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

    def test_login_returns_tokens(self):
        response = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "admin@example.com", "password": "secret123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            "/api/accounts/auth/login/",
            {"email": "admin@example.com", "password": "wrong"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_list_requires_auth_and_admin(self):
        response = self.client.get("/api/accounts/admin/staff/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.receptionist)
        response = self.client.get("/api/accounts/admin/staff/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_list_returns_active_users_only(self):
        inactive = User.objects.create_user(
            email="inactive@example.com",
            password="secret123",
            full_name="Inactive User",
            phone_number="333",
            role=User.RECEPTIONIST,
            is_active=False,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/accounts/admin/staff/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {user["id"] for user in response.data}
        self.assertNotIn(str(self.admin.id), returned_ids)
        self.assertIn(str(self.receptionist.id), returned_ids)
        self.assertNotIn(str(inactive.id), returned_ids)

    def test_staff_create_success(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "email": "newstaff@example.com",
            "full_name": "New Staff",
            "phone_number": "123",
            "role": "RECEPTIONIST",
        }

        response = self.client.post(
            "/api/accounts/admin/staff/", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("temporary_password", response.data)
        self.assertTrue(User.objects.filter(email="newstaff@example.com").exists())
        self.assertEqual(AuditLog.objects.filter(action="USER_CREATED").count(), 1)

    def test_staff_create_missing_email_returns_error(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "full_name": "New Staff",
            "phone_number": "123",
            "role": "RECEPTIONIST",
        }

        response = self.client.post(
            "/api/accounts/admin/staff/", payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_delete_success(self):
        staff = User.objects.create_user(
            email="delete@example.com",
            password="secret123",
            full_name="Delete User",
            phone_number="123",
            role=User.RECEPTIONIST,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/accounts/admin/staff/{staff.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=staff.id).exists())
        self.assertEqual(AuditLog.objects.filter(action="USER_DELETED").count(), 1)

    def test_staff_delete_missing_user_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            "/api/accounts/admin/staff/00000000-0000-0000-0000-000000000000/"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AuditLogApiTests(APITestCase):
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
        self.log_admin_create = AuditLog.objects.create(
            actor=self.admin,
            action="USER_CREATED",
            target_id="123",
            identifier_used="admin@example.com",
            payload={"note": "created user"},
        )
        self.log_receptionist = AuditLog.objects.create(
            actor=self.receptionist,
            action="USER_UPDATED",
            target_id="456",
            identifier_used="receptionist@example.com",
            payload={"note": "updated user"},
        )

    def test_audit_log_list_requires_auth_and_admin(self):
        response = self.client.get("/api/accounts/admin/audit-logs/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.receptionist)
        response = self.client.get("/api/accounts/admin/audit-logs/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_audit_log_list_filters(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            "/api/accounts/admin/audit-logs/?search=created"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {entry["id"] for entry in response.data}
        self.assertIn(self.log_admin_create.id, returned_ids)
        self.assertNotIn(self.log_receptionist.id, returned_ids)

        response = self.client.get(
            f"/api/accounts/admin/audit-logs/?actor={self.receptionist.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {entry["id"] for entry in response.data}
        self.assertIn(self.log_receptionist.id, returned_ids)
        self.assertNotIn(self.log_admin_create.id, returned_ids)

        response = self.client.get(
            "/api/accounts/admin/audit-logs/?action=USER_CREATED"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {entry["id"] for entry in response.data}
        self.assertIn(self.log_admin_create.id, returned_ids)
        self.assertNotIn(self.log_receptionist.id, returned_ids)

    def test_audit_log_detail_returns_log(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(
            f"/api/accounts/admin/audit-logs/{self.log_admin_create.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.log_admin_create.id)

    def test_audit_log_detail_missing_returns_404(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/accounts/admin/audit-logs/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
