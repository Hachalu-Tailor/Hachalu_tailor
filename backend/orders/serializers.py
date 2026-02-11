from rest_framework import serializers
from .models import SuitType, Order, Measurement
from .services import create_order


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
    measurements = MeasurementSerializer(source="measurement", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "quantity",
            "total_price",
            "due_date",
            "payment_reference",
            "payment_amount",
            "payment_received_at",
            "payment_notes",
            "created_at",
            "updated_at",
            "customer_name",
            "customer_phone",
            "suit_type",
            "suit_type_name",
            "material",
            "material_name",
            "measurements",
        ]


class CreateOrderSerializer(serializers.ModelSerializer):
    # Nested fields for the data the user "inserts"
    customer_name = serializers.CharField(source="customer.full_name", write_only=True)
    customer_phone = serializers.CharField(
        source="customer.phone_number", write_only=True
    )
    measurements = MeasurementSerializer(write_only=True)

    # Read-only fields to show the user after creation
    order_id = serializers.UUIDField(source="id", read_only=True)

    class Meta:
        model = Order
        fields = [
            "order_id",
            "customer_name",
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

    def create(self, validated_data):
        """
        Custom create method to handle nested Customer and Measurement creation.
        """
        customer_data = validated_data.pop("customer")
        measurement_data = validated_data.pop("measurements")

        request = self.context.get("request")
        requester = getattr(request, "user", None) if request else None

        return create_order(
            customer_name=customer_data["full_name"],
            customer_phone=customer_data["phone_number"],
            suit_type=validated_data["suit_type"],
            material=validated_data["material"],
            quantity=validated_data["quantity"],
            measurements=measurement_data,
            requester=requester,
        )


class OrderProcessingSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=["receive", "record_payment", "approve", "reject"]
    )
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
    reason = serializers.CharField(required=False, allow_blank=True)


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
