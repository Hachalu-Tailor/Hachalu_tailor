from rest_framework import serializers
from .models import SuitType, Order, Measurement


class SuitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuitType
        fields = ["id", "name", "lapel_count"]


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ["chest", "shoulder", "waist", "hips", "arm_length", "height"]


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_phone = serializers.CharField(
        source="customer.phone_number", read_only=True
    )
    suit_type_name = serializers.CharField(source="suit_type.name", read_only=True)
    material_name = serializers.CharField(source="material.name", read_only=True)
    image_url = serializers.CharField(source="material.image_url", read_only=True)
    measurements = MeasurementSerializer(source="measurement", read_only=True)
    selected_color = serializers.CharField(source="selected_color.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "quantity",
            "total_price",
            "due_date",
            "payment_reference",
            "payment_amount",
            "payment_received_at",
            "payment_notes",
            "payment_allowed",
            "expected_price",
            "created_at",
            "updated_at",
            "customer_name",
            "customer_phone",
            "suit_type",
            "selected_color",
            "suit_type_name",
            "material",
            "material_name",
            "image_url",
            "measurements",
        ]


class CreateOrderResponseSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    order_code = serializers.CharField()
    status = serializers.CharField()


class CreateOrderSerializer(serializers.ModelSerializer):
    # Nested fields for the data the user "inserts"
    customer_name = serializers.CharField(source="customer.full_name", write_only=True)
    customer_phone = serializers.CharField(
        source="customer.phone_number", write_only=True
    )
    measurements = MeasurementSerializer(write_only=True)

    # Read-only fields to show the user after creation
    order_id = serializers.UUIDField(source="id", read_only=True)
    order_code = serializers.CharField(read_only=True)
    selected_color = serializers.CharField(
        write_only=True,
        help_text="Name of the color the customer choose"
    )  # for choosing # sent from the frontend
    selected_color_name = serializers.CharField(source="selected_color.name", read_only=True)  # for returning
    
    class Meta:
        model = Order
        fields = [
            "order_id",
            "order_code",
            "customer_name",
            "selected_color",
            "selected_color_name",
            "customer_phone",
            "suit_type",
            "material",
            "quantity",
            "measurements",
        ]
        # These fields are set by the receptionist later according to your logic
        extra_kwargs = {
            "total_price": {"required": False},
            "due_date": {"required": False},
        }


class OrderProcessingSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=["receive", "record_payment", "approve", "reject"]
    )
    total_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    expected_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    due_date = serializers.DateField(required=False)
    payment_reference = serializers.CharField(required=False, allow_blank=True)
    payment_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    payment_received_at = serializers.DateTimeField(required=False)
    payment_notes = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True)


class CustomerPaymentSerializer(serializers.Serializer):
    order_code = serializers.CharField()
    customer_phone = serializers.CharField()
    payment_reference = serializers.CharField()
    payment_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    payment_received_at = serializers.DateTimeField(required=False)
    payment_notes = serializers.CharField(required=False, allow_blank=True)


class OrderExpirationResponseSerializer(serializers.Serializer):
    expired_count = serializers.IntegerField()


class OrderUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[choice[0] for choice in Order.STATUS_CHOICES], required=False
    )
    suit_type = serializers.IntegerField(required=False)
    material = serializers.IntegerField(required=False)
    quantity = serializers.IntegerField(required=False)
    total_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    due_date = serializers.DateField(required=False)
    payment_reference = serializers.CharField(required=False, allow_blank=True)
    payment_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    payment_received_at = serializers.DateTimeField(required=False)
    payment_notes = serializers.CharField(required=False, allow_blank=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[choice[0] for choice in Order.STATUS_CHOICES if choice[0] in ["IN_STORE", "CLOSED"]]
    )
