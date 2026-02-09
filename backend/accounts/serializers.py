from rest_framework import serializers
from .models import User, Customer


"""
    Serializer for the internal staff (Admin and Receptionist).
    Includes logic for secure password handling.
"""


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'role']
        # password is write-only for security
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Using create_user ensures the password is properly hashed
        return User.objects.create_user(**validated_data)


"""
    Serializer for capturing customer information during 
    the order initiation process.
"""


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'full_name', 'phone_number']