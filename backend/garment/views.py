# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services import (
    list_orders_in_progress,
    retrive_order_in_progress_by_code,
    mark_order_as_shipped,
    mark_order_as_completed,
    list_shiped_orders,
    retrive_shiped_order_by_code,
)
from orders.serializers import OrderSerializer, OrderStatusUpdateSerializer
from accounts.permissions import IsGarmentAdmin, IsAdminOrReceptionist
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema
from rest_framework import status
from django.db import transaction


class OrderProcessingView(APIView):
    permission_classes = [IsAuthenticated, IsGarmentAdmin]

    @extend_schema(
        tags=["Orders"],
        request=OrderStatusUpdateSerializer,
        responses={200: OrderSerializer, 400: dict, 401: dict, 403: dict},
        examples=[
            OpenApiExample(
                "Close order",
                value={"status": "CLOSED"},
                request_only=True,
            )
        ],
        description=(
            "Update order status to closed (receptionists only). "
            "Creates staff notifications after update."
        ),
    )
    @transaction.atomic()
    def post(self, request, id):
        order = retrive_order_in_progress_by_code(code=id)
        if not order:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            status_value = serializer.validated_data["status"]
            if status_value == "SHIPPED":
                mark_order_as_shipped(code=id, requester=request.user)
            elif status_value == "COMPLETED":
                mark_order_as_completed(code=id, requester=request.user)
            else:
                return Response(
                    {"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST
                )

            updated_order = retrive_order_in_progress_by_code(code=id)
            return Response(
                OrderSerializer(updated_order).data, status=status.HTTP_200_OK
            )

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ShippedOrdersListView(APIView):
    permission_classes = [IsAuthenticated, (IsGarmentAdmin | IsAdminOrReceptionist)]

    @extend_schema(
        tags=["Orders"],
        parameters=[
            OpenApiParameter(
                name="customer",
                required=False,
                description="Filter orders by customer.",
                type=bool,
            ),
            OpenApiParameter(
                name="processed_only",
                required=False,
                description="Filter orders by date range.",
                type=bool,
            ),
            OpenApiParameter(
                name="customer",
                required=False,
                description="Filter by suit type.",
                type=str,
            ),
        ],
        responses={200: OrderSerializer, 401: dict, 403: dict},
        examples=[
            OpenApiExample(
                "Order list",
                value=[
                    {"id": "<uuid>", "order_code": "HP-00000001", "status": "SHIPPED"}
                ],
                response_only=True,
            )
        ],
        description=(
            "List shipped orders with optional filters. Results are paginated. "
            "Accessible to garment admins, admins and receptionists."
        ),
    )
    def get(self, request):
        date_range = request.query_params.get("date_range")
        suit_type = request.query_params.get("suit_type")
        customer = request.query_params.get("customer")

        shipped_orders = list_shiped_orders(
            filter_by_customer=customer,
            filter_by_suit_type=suit_type,
            filter_by_date_range=date_range,
        )

        serializer = OrderSerializer(shipped_orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ShippdOrdersDetailView(APIView):
    permission_classes = [IsAuthenticated, (IsAdminOrReceptionist | IsGarmentAdmin)]

    @extend_schema(
        tags=["Orders"],
        parameters=[
            OpenApiParameter(
                name="code",
                required=True,
                description="The unique code of the order to retrieve.",
                type=str,
            )
        ],
        responses={200: OrderSerializer, 400: dict, 401: dict, 403: dict, 404: dict},
        examples=[
            OpenApiExample(
                "Order detail",
                value={
                    "id": "<uuid>",
                    "order_code": "HP-00000001",
                    "status": "SHIPPED",
                },
                response_only=True,
            )
        ],
        description=(
            "Retrieve details of a shipped order by its unique code. "
            "Accessible to garment admins, admins and receptionists."
        ),
    )
    def get(self, request):
        shiiped_order = retrive_shiped_order_by_code(
            code=request.query_params.get("code")
        )
        if not shiiped_order:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = OrderSerializer(shiiped_order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ListOrdersInProgressView(APIView):
    permission_classes = [IsAuthenticated, (IsGarmentAdmin | IsAdminOrReceptionist)]

    @extend_schema(
        tags=["Orders"],
        responses={200: OrderSerializer, 401: dict, 403: dict},
        examples=[
            OpenApiExample(
                "Orders in progress",
                value=[
                    {
                        "id": "<uuid>",
                        "order_code": "HP-00000001",
                        "status": "IN_PROGRESS",
                    }
                ],
                response_only=True,
            )
        ],
        description=(
            "List all orders that are currently in progress. "
            "Accessible to garment admins, admins and receptionists."
        ),
    )
    def get(self, request):
        customer = request.query_params.get("customer")
        suit_type = request.query_params.get("suit_type")
        orders_in_progress = list_orders_in_progress(
            filter_by_customer=customer, filter_by_suit_type=suit_type
        )

        serializer = OrderSerializer(orders_in_progress, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
