"""Permission checks for admin-only access."""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access to users who are ADMINs"""

    def has_permission(self, request, view):
        """Return True when `request.user` has HR or MANAGER role."""
        return request.user.role == "ADMIN"

class IsReseptionist(BasePermission):
    """Allow access to users who are RESEPTIONISTS."""

    def has_permission(self, request, view):
        return request.user.role == "RESEPTIONIST"