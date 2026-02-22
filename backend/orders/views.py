from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError

from .models import SuitType
from accounts.permissions import IsAdminOrReceptionist, IsReseptionist, IsAdmin
from .serializers import (
    CreateOrderResponseSerializer,
    SuitTypeSerializer,
    CreateOrderSerializer,
    OrderExpirationResponseSerializer,
    OrderProcessingSerializer,
    OrderSerializer,
    OrderUpdateSerializer,
)
from .services import (
    approve_order,
    create_order,
    expire_orders,
    get_order_by_code,
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
        responses={201: CreateOrderResponseSerializer, 400: dict},
        examples=[
            OpenApiExample(
                "Create order request",
                value={
                    "customer_name": "Jane Doe",
                    "customer_phone": "9991112222",
                    "suit_type": 1,
                    "material": 1,
                    "quantity": 2,
                    "measurements": {
                        "chest": 40,
                        "shoulder": 18,
                        "waist": 32,
                        "hips": 38,
                        "arm_length": 25,
                        "height": 170,
                    },
                },
                request_only=True,
            ),
            OpenApiExample(
                "Create order response",
                value={
                    "order_id": "<uuid>",
                    "order_code": "HP-00000001",
                    "status": "INITIATED",
                },
                response_only=True,
            ),
        ],
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
        examples=[
            OpenApiExample(
                "Order list",
                value=[
                    {"id": "<uuid>", "order_code": "HP-00000001", "status": "INITIATED"}
                ],
                response_only=True,
            )
        ],
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


class OrderDetailByCodeView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Orders"],
        parameters=[
            OpenApiParameter(
                name="code",
                required=True,
                description="Order code assigned at creation (e.g., HP-00000001).",
                type=str,
                location=OpenApiParameter.PATH,
            )
        ],
        responses={200: OrderSerializer, 400: dict},
        examples=[
            OpenApiExample(
                "Order detail by code",
                value={"order_code": "HP-00000001", "status": "INITIATED"},
                response_only=True,
            )
        ],
        description="Get order details by order code (public).",
    )
    def get(self, request, code):
        try:
            order = get_order_by_code(order_code=code)
        except DjangoValidationError as exc:
            raise ValidationError(str(exc))
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)


class OrderProcessingView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]

    @extend_schema(
        tags=["Orders"],
        request=OrderProcessingSerializer,
        responses={200: OrderSerializer, 400: dict, 401: dict, 403: dict},
        examples=[
            OpenApiExample(
                "Receive order",
                value={
                    "action": "receive",
                    "total_price": "120.00",
                    "due_date": "2030-01-01",
                    "expected_price": "60.0",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Approve order",
                value={"action": "approve"},
                request_only=True,
            ),
        ],
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
                    expected_price=serializer.validated_data.get("expected_price"),
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
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]

    @extend_schema(
        tags=["Orders"],
        request=OrderUpdateSerializer,
        responses={200: OrderSerializer, 400: dict, 401: dict, 403: dict},
        examples=[
            OpenApiExample(
                "Update order",
                value={"status": "COMPLETED"},
                request_only=True,
            )
        ],
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
        examples=[
            OpenApiExample(
                "Expire response",
                value={"expired_count": 1},
                response_only=True,
            )
        ],
        description="Expire overdue orders and notify staff.",
    )
    def post(self, request):
        expired = expire_orders(requester=request.user)
        return Response(
            {"expired_count": len(expired)},
            status=status.HTTP_200_OK,
        )


class SuitTypeCreateView(APIView):
    permission_classes = [IsAuthenticated | IsAdmin]

    @extend_schema(
        tags=["Suit Types"],
        request=SuitTypeSerializer,
        responses={201: SuitTypeSerializer, 400: dict},
        description="Create a new suit type (admin only).",
    )
    def post(self, request):
        serializer = SuitTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        suit_type = serializer.save()

        return Response(
            SuitTypeSerializer(suit_type).data, status=status.HTTP_201_CREATED
        )


class SuitTypeListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Suit Types"],
        responses={200: SuitTypeSerializer},
        description="List all available suit types.",
    )
    def get(self, request):
        suit_types = SuitType.objects.all()
        serializer = SuitTypeSerializer(suit_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
