"""Permission checks for admin-only access."""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access to users who are ADMINs"""

    def has_permission(self, request, view):
        """Return True when `request.user` has HR or MANAGER role."""
        return (
            bool(getattr(request.user, "is_authenticated", False))
            and request.user.role == "ADMIN"
        )


class IsReseptionist(BasePermission):
    """Allow access to users who are RECEPTIONISTS."""

    def has_permission(self, request, view):
        return (
            bool(getattr(request.user, "is_authenticated", False))
            and request.user.role == "RECEPTIONIST"
        )


class IsAdminOrReceptionist(BasePermission):
    """Allow access to users who are ADMINs or RECEPTIONISTS."""

    def has_permission(self, request, view):
        return bool(
            getattr(request.user, "is_authenticated", False)
        ) and request.user.role in {"ADMIN", "RECEPTIONIST"}


class IsGarmentAdmin(BasePermission):
    """Allow access to users who are GARMENT_ADMINs."""

    def has_permission(self, request, view):
        return (
            bool(getattr(request.user, "is_authenticated", False))
            and request.user.role == "GARMENT_ADMIN"
        )
