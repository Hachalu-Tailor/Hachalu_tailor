from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import OpenApiParameter, extend_schema

from accounts.permissions import IsAdminOrReceptionist, IsReseptionist
from .serializers import (
    CreateOrderResponseSerializer,
    CreateOrderSerializer,
    CustomerPaymentSerializer,
    OrderExpirationResponseSerializer,
    OrderProcessingSerializer,
    OrderSerializer,
    OrderUpdateSerializer,
)
from .services import (
    approve_order,
    create_order,
    expire_orders,
    list_orders,
    receive_order_for_processing,
    record_payment_info,
    record_payment_info_by_customer,
    reject_order,
    update_order,
)


class OrderCreateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Orders"],
        request=CreateOrderSerializer,
        responses={201: CreateOrderResponseSerializer, 400: dict},
        description=(
            "Create a new order with customer details and measurements. "
            "This starts the order in INITIATED and notifies staff."
        ),
    )
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        customer_data = validated["customer"]
        measurement_data = validated["measurements"]
        order = create_order(
            customer_name=customer_data["full_name"],
            customer_phone=customer_data["phone_number"],
            suit_type=validated["suit_type"],
            material=validated["material"],
            quantity=validated["quantity"],
            measurements=measurement_data,
            requester=request.user if request.user.is_authenticated else None,
        )
        return Response(
            {
                "order_id": str(order.id),
                "order_code": order.order_code,
                "status": order.status,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]

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
        responses={200: OrderSerializer, 401: dict, 403: dict},
        description=(
            "List orders with optional filters. Results are paginated. "
            "Accessible to admins and receptionists."
        ),
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
        if page is not None:
            serializer = OrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = OrderSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderProcessingView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]

    @extend_schema(
        tags=["Orders"],
        request=OrderProcessingSerializer,
        responses={200: OrderSerializer, 400: dict, 401: dict, 403: dict},
        description=(
            "Process an order: receive (set price/date + allow payment), "
            "record payment (staff only), approve, or reject."
        ),
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
    permission_classes = [IsAuthenticated, IsReseptionist]

    @extend_schema(
        tags=["Orders"],
        request=OrderUpdateSerializer,
        responses={200: OrderSerializer, 400: dict, 401: dict, 403: dict},
        description=(
            "Update order fields (receptionists only). "
            "Creates staff notifications after update."
        ),
    )
    def patch(self, request, id):
        serializer = OrderUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = update_order(
            order_id=id, updates=serializer.validated_data, requester=request.user
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class OrderExpirationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]

    @extend_schema(
        tags=["Orders"],
        responses={200: OrderExpirationResponseSerializer, 401: dict, 403: dict},
        description="Expire overdue orders and notify staff.",
    )
    def post(self, request):
        expired = expire_orders(requester=request.user)
        return Response(
            {"expired_count": len(expired)},
            status=status.HTTP_200_OK,
        )


class OrderCustomerPaymentView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Orders"],
        request=CustomerPaymentSerializer,
        responses={200: OrderSerializer, 400: dict},
        description=(
            "Customer submits payment info for an order. "
            "Payment is accepted only after staff enables payment."
        ),
    )
    def post(self, request, id):
        serializer = CustomerPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order = record_payment_info_by_customer(
                order_code=serializer.validated_data["order_code"],
                customer_phone=serializer.validated_data["customer_phone"],
                payment_reference=serializer.validated_data["payment_reference"],
                payment_amount=serializer.validated_data.get("payment_amount"),
                payment_received_at=serializer.validated_data.get(
                    "payment_received_at"
                ),
                payment_notes=serializer.validated_data.get("payment_notes"),
            )
        except DjangoValidationError as exc:
            raise ValidationError(str(exc))
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
