from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import OpenApiParameter, extend_schema

from accounts.permissions import IsAdmin
from .serializers import (
    CreateOrderResponseSerializer,
    CreateOrderSerializer,
    OrderExpirationResponseSerializer,
    OrderProcessingSerializer,
    OrderSerializer,
    OrderUpdateSerializer,
)
from .services import (
    approve_order,
    expire_orders,
    list_orders,
    receive_order_for_processing,
    record_payment_info,
    reject_order,
    update_order,
)


class OrderCreateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Orders"],
        request=CreateOrderSerializer,
        responses={201: CreateOrderResponseSerializer},
        description="Create a new order with customer details and measurements.",
    )
    def post(self, request):
        serializer = CreateOrderSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            {
                "order_id": str(order.id),
                "status": order.status,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Orders"],
        parameters=[
            OpenApiParameter(
                name="active_only",
                required=False,
                description="Filter active orders (true/false).",
                type=bool,
            ),
            OpenApiParameter(
                name="processed_only",
                required=False,
                description="Filter processed orders (true/false).",
                type=bool,
            ),
            OpenApiParameter(
                name="customer",
                required=False,
                description="Filter by customer id, name, or phone.",
                type=str,
            ),
        ],
        responses={200: OrderSerializer},
        description="List orders with optional filters. Results are paginated.",
    )
    def get(self, request):
        active_only = request.query_params.get("active_only")
        processed_only = request.query_params.get("processed_only")
        customer = request.query_params.get("customer")

        def _parse_bool(value):
            if value is None:
                return None
            return str(value).lower() in {"true", "1", "yes"}

        queryset = list_orders(
            requester=request.user,
            active_only=_parse_bool(active_only),
            processed_only=_parse_bool(processed_only),
            customer=customer,
        )

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = OrderSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class OrderProcessingView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Orders"],
        request=OrderProcessingSerializer,
        responses={200: OrderSerializer},
        description=("Process an order: receive, record payment, approve, or reject."),
    )
    def post(self, request, id):
        serializer = OrderProcessingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]

        try:
            if action == "receive":
                order = receive_order_for_processing(
                    order_id=id,
                    total_price=serializer.validated_data.get("total_price"),
                    due_date=serializer.validated_data.get("due_date"),
                    requester=request.user,
                )
            elif action == "record_payment":
                order = record_payment_info(
                    order_id=id,
                    payment_reference=serializer.validated_data.get(
                        "payment_reference"
                    ),
                    payment_amount=serializer.validated_data.get("payment_amount"),
                    payment_received_at=serializer.validated_data.get(
                        "payment_received_at"
                    ),
                    payment_notes=serializer.validated_data.get("payment_notes"),
                    requester=request.user,
                )
            elif action == "approve":
                order = approve_order(order_id=id, requester=request.user)
            elif action == "reject":
                order = reject_order(
                    order_id=id,
                    reason=serializer.validated_data.get("reason"),
                    requester=request.user,
                )
            else:
                raise ValidationError("Unsupported processing action.")
        except ValidationError as exc:
            raise ValidationError(str(exc))

        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class OrderUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Orders"],
        request=OrderUpdateSerializer,
        responses={200: OrderSerializer},
        description="Update order fields and notify receptionists.",
    )
    def patch(self, request, id):
        serializer = OrderUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = update_order(
            order_id=id, updates=serializer.validated_data, requester=request.user
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class OrderExpirationView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["Orders"],
        responses={200: OrderExpirationResponseSerializer},
        description="Expire overdue orders and notify receptionists.",
    )
    def post(self, request):
        expired = expire_orders(requester=request.user)
        return Response(
            {"expired_count": len(expired)},
            status=status.HTTP_200_OK,
        )
