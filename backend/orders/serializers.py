from rest_framework import serializers
from .models import SuitType, Customer, Order, Measurement
from inventory.serializers import MaterialSerializer


class SuitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuitType
        fields = ['id', 'name', 'lapel_count']


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ['chest', 'shoulder', 'waist', 'hips', 'arm_length', 'height']


class CreateOrderSerializer(serializers.ModelSerializer):
    # Nested fields for the data the user "inserts"
    customer_name = serializers.CharField(source='customer.full_name', write_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', write_only=True)
    measurements = MeasurementSerializer(write_only=True)
    
    # Read-only fields to show the user after creation
    order_id = serializers.UUIDField(source='id', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'customer_name', 'customer_phone', 
            'suit_type', 'material', 'quantity', 
            'measurements'
        ]
        # These fields are set by the receptionist later according to your logic
        extra_kwargs = {
            'total_price': {'required': False},
            'due_date': {'required': False},
        }

    def create(self, validated_data):
        """
        Custom create method to handle nested Customer and Measurement creation.
        """
        customer_data = validated_data.pop('customer')
        measurement_data = validated_data.pop('measurements')

        # 1. Handle Customer (Get or Create based on phone number)
        customer, _ = Customer.objects.get_or_create(
            phone_number=customer_data['phone_number'],
            defaults={'full_name': customer_data['full_name']}
        )

        # 2. Create Order
        # Note: default price/date are placeholders until the receptionist update
        order = Order.objects.create(
            customer=customer,
            status='INITIATED',
            total_price=0,  # To be updated by receptionist
            due_date="2000-01-01", # Placeholder
            **validated_data
        )

        # 3. Create Measurements linked to the order
        Measurement.objects.create(order=order, **measurement_data)

        return order