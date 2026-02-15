from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """
    Serialzes Transaction data
    """

    order_id = serializers.UUIDField(source="order_id.id", read_only=True)
    order_code = serializers.CharField(source="order_id.order_code", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "order_id",
            "order_code",
            "payment_amount",
            "bank_ref_number",
            "receipt_pdf_url",
            "is_verified",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def update(self, instance, validated_data):
        # Check if is_verified is being changed to True
        was_verified = instance.is_verified
        is_verified = validated_data.get("is_verified", was_verified)

        instance = super().update(instance, validated_data)

        # Business Logic: Update Order status if verified
        if not was_verified and is_verified:
            order = instance.order_id
            order.status = "IN_PROGRESS"
            order.save()

        return instance


class PaymentCreateSerializer(serializers.Serializer):
    order_code = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    bank_ref_number = serializers.CharField()
    receipt_pdf_url = serializers.URLField()


class PaymentVerifySerializer(serializers.Serializer):
    is_verified = serializers.BooleanField()
