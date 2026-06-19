from rest_framework import serializers
from .models import Material, Stock, Color


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['id', 'name']


class ColorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["name"]


class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['id', 'quantity_meters', 'is_available']
        read_only_fields = ['is_available']


class MaterialSerializer(serializers.ModelSerializer):
    inventory = StockSerializer(read_only=True)
    colors = ColorSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            'id', 
            'name', 
            'texture',
            'brand', 
            'image_url', 
            'description',
            'category',
            'colors',
            'material_image',     
            'suit_sample_image',
            'inventory',
        ]

    def get_image_url(self, obj):
        if obj.image_url and obj.image_url.startswith('data:'):
            return None
        return obj.image_url
