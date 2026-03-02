from rest_framework import serializers
from .models import Material, Stock, Color


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name']


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
    colors = ColorSerializer(many=True, read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'name', 'texture', 'image_url', 'description', 'category', 'colors', 'inventory']
