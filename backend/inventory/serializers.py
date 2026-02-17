from rest_framework import serializers
from .models import Material, Stock


class StockSerializer(serializers.ModelSerializer):
    """
    Serializer for the Stock model. 
    Note: is_available is read_only because the model's save() method handles it.
    """
    class Meta:
        model = Stock
        fields = ['id', 'quantity_meters', 'is_available']
        read_only_fields = ['is_available']


class MaterialSerializer(serializers.ModelSerializer):
    """
    Serializer for the Material model.
    Nests the Stock information via the 'inventory' related_name.
    """
    # This allows us to see stock data when querying the material
    inventory = StockSerializer(read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'name', 'color', 'texture', 'image_url', 'description', 'category', 'inventory']
