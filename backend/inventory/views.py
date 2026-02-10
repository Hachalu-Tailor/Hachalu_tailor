from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

# services and models
from .services import (
    list_materials, 
    create_material_with_stock, 
    update_material, 
    add_stock, 
    set_stock_quantity
)
from .serializers import MaterialSerializer
from .models import Material

# custom permissions
from ..accounts.permissions import IsAdmin, IsReseptionist

class MaterialListCreateView(APIView):
    """
    Handles listing all materials and adding a new material with initial stock.
    """
    permission_classes = [IsReseptionist, IsAdmin]

    def get(self, request):
        materials = list_materials()
        serializer = MaterialSerializer(materials, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Data expected: { "material": {...}, "quantity_meters": 10.5 }
        material_data = request.data.get('material')
        quantity = request.data.get('quantity_meters')
        
        material = create_material_with_stock(
            material_data=material_data,
            quantity_meters=quantity,
            requester=request.user
        )
        
        serializer = MaterialSerializer(material)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MaterialDetailView(APIView):
    """
    Handles updating material metadata (name, color, etc.)
    """
    permission_classes = [IsReseptionist, IsAdmin]

    def patch(self, request, pk):
        material = get_object_or_404(Material, pk=pk)
        updated_material = update_material(
            material=material,
            updates=request.data,
            requester=request.user
        )
        serializer = MaterialSerializer(updated_material)
        return Response(serializer.data)


class StockAdjustmentView(APIView):
    """
    Handles updating stock counts (adding to or setting exact values).
    """
    permission_classes = [IsReseptionist, IsAdmin]

    def post(self, request, pk):
        material = get_object_or_404(Material, pk=pk)
        quantity = request.data.get('quantity_meters')
        action_type = request.data.get('action_type') # "add" or "set"

        if action_type == "add":
            stock = add_stock(material=material, quantity_meters=quantity, requester=request.user)
        elif action_type == "set":
            stock = set_stock_quantity(material=material, quantity_meters=quantity, requester=request.user)
        else:
            return Response({"error": "Invalid action_type. Use 'add' or 'set'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message": "Stock updated successfully",
            "current_quantity": stock.quantity_meters
        })