from rest_framework import serializers
from .models import AuditLog, User, Customer


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the internal staff (Admin and Receptionist).
    Includes logic for secure password handling.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone_number",
            "role",
            "is_active",
            "password",
        ]
        # password is write-only for security
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Using create_user ensures the password is properly hashed
        return User.objects.create_user(**validated_data)


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for capturing customer information during
    the order initiation process.
    """

    class Meta:
        model = Customer
        fields = ["id", "full_name", "phone_number"]


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for audit log entries, used in admin views to
    display action history.
    """

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "actor",
            "action",
            "target_id",
            "identifier_used",
            "created_at",
            "payload",
        ]
