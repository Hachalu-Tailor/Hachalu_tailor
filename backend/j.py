import json
import logging
from datetime import date
from decimal import Decimal, InvalidOperation
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError
import uuid
import secrets

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone

from accounts.models import AuditLog, User, Notification
from inventory.models import Material
from .models import Customer, Order, Measurement, SuitType

logger = logging.getLogger(__name__)

MEASUREMENT_FIELDS = ("chest", "shoulder", "waist", "hips", "arm_length", "height")
PLACEHOLDER_DUE_DATE = date(2000, 1, 1)
ACTIVE_STATUSES = {"INITIATED", "AWAITING_PAYMENT", "PENDING_APPROVAL", "IN_PROGRESS"}
PROCESSED_STATUSES = {"IN_PROGRESS", "COMPLETED", "CLOSED"}


def _normalize_actor(actor):
    return actor if isinstance(actor, User) else None


def _normalize_quantity(quantity) -> int:
    if quantity is None:
        raise ValidationError("quantity is required.")
    try:
        value = int(quantity)
    except (TypeError, ValueError):
        raise ValidationError("quantity must be an integer.")
    if value <= 0:
        raise ValidationError("quantity must be greater than zero.")
    return value


def _normalize_measurements(measurements: dict) -> dict:
    if not measurements:
        raise ValidationError("measurements is required.")
    cleaned = {}
    for field in MEASUREMENT_FIELDS:
        if field not in measurements:
            raise ValidationError(f"{field} is required in measurements.")
        try:
            value = Decimal(str(measurements[field]))
        except (InvalidOperation, TypeError):
            raise ValidationError(f"{field} must be a number.")
        if value <= 0:
            raise ValidationError(f"{field} must be greater than zero.")
        cleaned[field] = float(value)
    return cleaned


def _normalize_decimal(value, field_name: str) -> Decimal:
    if value is None:
        raise ValidationError(f"{field_name} is required.")
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValidationError(f"{field_name} must be a number.")
    if amount < 0:
        raise ValidationError(f"{field_name} cannot be negative.")
    return amount


def _normalize_date(value, field_name: str) -> date:
    if value is None:
        raise ValidationError(f"{field_name} is required.")
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        raise ValidationError(f"{field_name} must be ISO date (YYYY-MM-DD).")


def _normalize_datetime(value, field_name: str):
    if value is None:
        return timezone.now()
    if isinstance(value, timezone.datetime):
        return value
    try:
        return timezone.datetime.fromisoformat(str(value))
    except ValueError:
        raise ValidationError(
            f"{field_name} must be ISO datetime (YYYY-MM-DDTHH:MM:SS)."
        )


def _resolve_suit_type(suit_type):
    if isinstance(suit_type, SuitType):
        return suit_type
    try:
        return SuitType.objects.get(id=suit_type)
    except SuitType.DoesNotExist:
        raise ValidationError("suit_type not found.")


def _resolve_material(material):
    if isinstance(material, Material):
        return material
    try:
        return Material.objects.get(id=material)
    except Material.DoesNotExist:
        raise ValidationError("material not found.")


def _resolve_order(order_id):
    try:
        return Order.objects.select_related(
            "customer",
            "suit_type",
            "material",
            "measurement",
            "reviewed_by",
        ).get(id=order_id)
    except Order.DoesNotExist:
        raise ValidationError("order not found.")


def _resolve_order_by_code(order_code):
    try:
        return Order.objects.select_related(
            "customer",
            "suit_type",
            "material",
            "measurement",
            "reviewed_by",
        ).get(order_code=order_code)
    except Order.DoesNotExist:
        raise ValidationError("order not found.")


def _generate_order_code() -> str:
    for _ in range(5):
        candidate = f"HP-{secrets.randbelow(10**8):08d}"
        if not Order.objects.filter(order_code=candidate).exists():
            return candidate
    raise ValidationError("Failed to generate unique order code.")


def _notify_users(
    order: Order,
    users,
    *,
    requester=None,
    title="Order Update",
    message="Order requires review.",
    notification_type="ORDER_UPDATE",
) -> None:
    user_list = list(users)
    user_ids = [user.id for user in user_list]
    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="STAFF_NOTIFIED",
        target_id=str(order.id),
        identifier_used=str(order.id),
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "user_ids": [str(user_id) for user_id in user_ids],
            "message": message,
        },
    )
    if user_list:
        Notification.objects.bulk_create(
            [
                Notification(
                    user=user,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    payload={"order_id": str(order.id)},
                )
                for user in user_list
            ]
        )


def _staff_users():
    return User.objects.filter(role__in={User.ADMIN, User.RECEPTIONIST})


# def _build_processing_payload(order: Order, measurement: Measurement) -> dict:
#     return {
#         "order_id": str(order.id),
#         "status": order.status,
#         "quantity": order.quantity,
#         "customer": {
#             "id": order.customer.id,
#             "full_name": order.customer.full_name,
#             "phone_number": order.customer.phone_number,
#         },
#         "suit_type": {
#             "id": order.suit_type.id,
#             "name": order.suit_type.name,
#             "lapel_count": order.suit_type.lapel_count,
#         },
#         "material": {
#             "id": order.material.id,
#             "name": order.material.name,
#             "color": order.material.color,
#         },
#         "measurements": {
#             "chest": measurement.chest,
#             "shoulder": measurement.shoulder,
#             "waist": measurement.waist,
#             "hips": measurement.hips,
#             "arm_length": measurement.arm_length,
#             "height": measurement.height,
#         },
#         "payment": {
#             "reference": order.payment_reference,
#             "amount": str(order.payment_amount) if order.payment_amount else None,
#             "received_at": (
#                 order.payment_received_at.isoformat()
#                 if order.payment_received_at
#                 else None
#             ),
#         },
#     }


# def _send_to_processing_service(payload: dict) -> bool:
#     service_url = getattr(settings, "ORDER_PROCESSING_SERVICE_URL", None)
#     if not service_url:
#         logger.warning("ORDER_PROCESSING_SERVICE_URL is not configured; skipping send")
#         return False

#     data = json.dumps(payload).encode("utf-8")
#     request = urllib_request.Request(
#         service_url,
#         data=data,
#         headers={"Content-Type": "application/json"},
#         method="POST",
#     )
#     try:
#         with urllib_request.urlopen(request, timeout=10) as response:
#             if response.status >= 400:
#                 raise ValidationError("order processing service rejected the order.")
#     except (HTTPError, URLError, ValidationError) as exc:
#         raise ValidationError("Failed to send order to processing service.") from exc
#     return True


@transaction.atomic
def create_order(
    *,
    customer_name: str,
    customer_phone: str,
    suit_type,
    material,
    quantity,
    measurements: dict,
    requester=None,
) -> Order:
    if not customer_name or not str(customer_name).strip():
        raise ValidationError("customer_name is required.")
    if not customer_phone or not str(customer_phone).strip():
        raise ValidationError("customer_phone is required.")

    suit_type_obj = _resolve_suit_type(suit_type)
    material_obj = _resolve_material(material)
    normalized_quantity = _normalize_quantity(quantity)
    normalized_measurements = _normalize_measurements(measurements)

    customer, created = Customer.objects.get_or_create(
        phone_number=customer_phone,
        defaults={"full_name": customer_name.strip()},
    )
    if not created and customer.full_name != customer_name.strip():
        customer.full_name = customer_name.strip()
        customer.save(update_fields=["full_name"])

    measurement = Measurement.objects.create(**normalized_measurements)

    order = Order.objects.create(
        customer=customer,
        suit_type=suit_type_obj,
        material=material_obj,
        measurement=measurement,
        order_code=_generate_order_code(),
        status="INITIATED",
        quantity=normalized_quantity,
        total_price=Decimal("0.00"),
        due_date=PLACEHOLDER_DUE_DATE,
    )

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_CREATED",
        target_id=str(order.id),
        identifier_used=customer.phone_number,
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "customer_id": customer.id,
            "customer_phone": customer.phone_number,
        },
    )

    _notify_users(
        order,
        _staff_users(),
        requester=requester,
        title="New Order",
        message="New order requires review.",
        notification_type="ORDER_CREATED",
    )

    return order


@transaction.atomic
def receive_order_for_processing(
    *, order_id, total_price, due_date, requester=None
) -> Order:
    order = _resolve_order(order_id)
    if order.status != "INITIATED":
        raise ValidationError("Only initiated orders can be processed.")

    order.total_price = _normalize_decimal(total_price, "total_price")
    order.due_date = _normalize_date(due_date, "due_date")
    order.status = "AWAITING_PAYMENT"
    order.payment_allowed = True
    if requester is not None:
        order.reviewed_by = requester
    order.save(
        update_fields=[
            "total_price",
            "due_date",
            "status",
            "payment_allowed",
            "updated_at",
            "reviewed_by",
        ]
    )

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_RECEIVED_FOR_PROCESSING",
        target_id=str(order.id),
        identifier_used=str(order.id),
        payload={
            "order_id": str(order.id),
            "total_price": str(order.total_price),
            "due_date": order.due_date.isoformat(),
        },
    )

    return order


@transaction.atomic
def record_payment_info(
    *,
    order_id,
    payment_reference,
    payment_amount,
    payment_received_at=None,
    payment_notes=None,
    requester=None,
) -> Order:
    order = _resolve_order(order_id)
    if order.status not in {"AWAITING_PAYMENT", "PENDING_APPROVAL"}:
        raise ValidationError("Order is not awaiting payment.")

    if not payment_reference or not str(payment_reference).strip():
        raise ValidationError("payment_reference is required.")

    order.payment_reference = str(payment_reference).strip()
    order.payment_amount = _normalize_decimal(payment_amount, "payment_amount")
    order.payment_received_at = _normalize_datetime(
        payment_received_at, "payment_received_at"
    )
    if payment_notes is not None:
        order.payment_notes = str(payment_notes).strip()
    order.status = "PENDING_APPROVAL"
    order.save(
        update_fields=[
            "payment_reference",
            "payment_amount",
            "payment_received_at",
            "payment_notes",
            "status",
            "updated_at",
        ]
    )

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_PAYMENT_RECORDED",
        target_id=str(order.id),
        identifier_used=order.payment_reference,
        payload={
            "order_id": str(order.id),
            "payment_reference": order.payment_reference,
            "payment_amount": str(order.payment_amount),
            "payment_received_at": order.payment_received_at.isoformat(),
        },
    )

    return order


@transaction.atomic
def record_payment_info_by_customer(
    *,
    order_code,
    customer_phone,
    payment_reference,
    payment_amount=None,
    payment_received_at=None,
    payment_notes=None,
) -> Order:
    order = _resolve_order_by_code(order_code)
    if order.status != "AWAITING_PAYMENT" or not order.payment_allowed:
        raise ValidationError("Order is not allowed to receive payment yet.")

    if not customer_phone or str(customer_phone).strip() != order.customer.phone_number:
        raise ValidationError("customer_phone does not match order.")

    if not payment_reference or not str(payment_reference).strip():
        raise ValidationError("payment_reference is required.")

    order.payment_reference = str(payment_reference).strip()
    if payment_amount is not None:
        order.payment_amount = _normalize_decimal(payment_amount, "payment_amount")
    order.payment_received_at = _normalize_datetime(
        payment_received_at, "payment_received_at"
    )
    if payment_notes is not None:
        order.payment_notes = str(payment_notes).strip()
    order.status = "PENDING_APPROVAL"
    order.save(
        update_fields=[
            "payment_reference",
            "payment_amount",
            "payment_received_at",
            "payment_notes",
            "status",
            "updated_at",
        ]
    )

    AuditLog.objects.create(
        actor=None,
        action="ORDER_PAYMENT_SUBMITTED",
        target_id=str(order.id),
        identifier_used=order.payment_reference,
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "customer_phone": order.customer.phone_number,
            "payment_reference": order.payment_reference,
            "payment_amount": (
                str(order.payment_amount) if order.payment_amount else None
            ),
        },
    )

    if order.reviewed_by is not None:
        _notify_users(
            order,
            [order.reviewed_by],
            title="Payment Submitted",
            message="Customer submitted payment. Review and approve.",
            notification_type="PAYMENT_SUBMITTED",
        )
    else:
        _notify_users(
            order,
            _staff_users(),
            title="Payment Submitted",
            message="Customer submitted payment. Review and approve.",
            notification_type="PAYMENT_SUBMITTED",
        )

    return order


@transaction.atomic
def approve_order(*, order_id, requester=None) -> Order:
    order = _resolve_order(order_id)
    if order.status != "PENDING_APPROVAL":
        raise ValidationError("Order is not pending approval.")

    order.status = "IN_PROGRESS"
    order.save(update_fields=["status", "updated_at"])

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_APPROVED",
        target_id=str(order.id),
        identifier_used=str(order.id),
        payload={"order_id": str(order.id)},
    )

    return order


@transaction.atomic
def reject_order(*, order_id, reason=None, requester=None) -> Order:
    order = _resolve_order(order_id)
    if order.status not in {"PENDING_APPROVAL", "AWAITING_PAYMENT", "INITIATED"}:
        raise ValidationError("Order cannot be rejected in its current status.")

    order.status = "REJECTED"
    order.save(update_fields=["status", "updated_at"])

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_REJECTED",
        target_id=str(order.id),
        identifier_used=str(order.id),
        payload={"order_id": str(order.id), "reason": reason},
    )

    _notify_users(
        order,
        _staff_users(),
        requester=requester,
        title="Order Rejected",
        message="Order was rejected. Review the details.",
        notification_type="ORDER_REJECTED",
    )
    return order


def list_orders(
    *, requester=None, active_only=None, processed_only=None, customer=None
):
    queryset = Order.objects.select_related(
        "customer",
        "suit_type",
        "material",
        "measurement",
        "reviewed_by",
    ).all()

    if active_only is not None:
        if active_only:
            queryset = queryset.filter(status__in=ACTIVE_STATUSES)
        else:
            queryset = queryset.exclude(status__in=ACTIVE_STATUSES)

    if processed_only is not None:
        if processed_only:
            queryset = queryset.filter(status__in=PROCESSED_STATUSES)
        else:
            queryset = queryset.exclude(status__in=PROCESSED_STATUSES)

    if customer:
        queryset = queryset.filter(
            models.Q(customer__id=customer)
            | models.Q(customer__phone_number__icontains=customer)
            | models.Q(customer__full_name__icontains=customer)
        )

    queryset = queryset.order_by("created_at")

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_LISTED",
        target_id=None,
        identifier_used=str(requester.id) if requester else "system",
        payload={
            "active_only": active_only,
            "processed_only": processed_only,
            "customer": customer,
        },
    )

    return queryset


@transaction.atomic
def update_order(*, order_id, updates: dict, requester=None) -> Order:
    if not updates:
        raise ValidationError("updates is required.")

    order = _resolve_order(order_id)
    allowed_fields = {
        "status",
        "suit_type",
        "material",
        "quantity",
        "total_price",
        "due_date",
        "payment_reference",
        "payment_amount",
        "payment_received_at",
        "payment_notes",
    }
    unexpected = set(updates.keys()) - allowed_fields
    if unexpected:
        raise ValidationError(f"Unexpected fields: {', '.join(sorted(unexpected))}.")

    if "suit_type" in updates:
        order.suit_type = _resolve_suit_type(updates["suit_type"])
    if "material" in updates:
        order.material = _resolve_material(updates["material"])
    if "quantity" in updates:
        order.quantity = _normalize_quantity(updates["quantity"])
    if "total_price" in updates:
        order.total_price = _normalize_decimal(updates["total_price"], "total_price")
    if "due_date" in updates:
        order.due_date = _normalize_date(updates["due_date"], "due_date")
    if "payment_reference" in updates:
        order.payment_reference = str(updates["payment_reference"]).strip()
    if "payment_amount" in updates:
        order.payment_amount = _normalize_decimal(
            updates["payment_amount"], "payment_amount"
        )
    if "payment_received_at" in updates:
        order.payment_received_at = _normalize_datetime(
            updates["payment_received_at"], "payment_received_at"
        )
    if "payment_notes" in updates:
        order.payment_notes = str(updates["payment_notes"]).strip()
    if "status" in updates:
        order.status = updates["status"]

    order.save()

    AuditLog.objects.create(
        actor=_normalize_actor(requester),
        action="ORDER_UPDATED",
        target_id=str(order.id),
        identifier_used=str(order.id),
        payload={"order_id": str(order.id), "updates": updates},
    )

    _notify_users(
        order,
        _staff_users(),
        requester=requester,
        title="Order Updated",
        message="Order was updated. Review the changes.",
        notification_type="ORDER_UPDATED",
    )
    return order


@transaction.atomic
def expire_orders(*, requester=None):
    today = timezone.localdate()
    candidates = Order.objects.filter(
        status__in=ACTIVE_STATUSES, due_date__lt=today
    ).exclude(due_date=PLACEHOLDER_DUE_DATE)

    expired_orders = list(candidates)
    for order in expired_orders:
        order.status = "EXPIRED"
        order.save(update_fields=["status", "updated_at"])
        AuditLog.objects.create(
            actor=_normalize_actor(requester),
            action="ORDER_EXPIRED",
            target_id=str(order.id),
            identifier_used=str(order.id),
            payload={"order_id": str(order.id), "due_date": order.due_date.isoformat()},
        )
        _notify_users(
            order,
            _staff_users(),
            requester=requester,
            title="Order Expired",
            message="Order expired. Review the status.",
            notification_type="ORDER_EXPIRED",
        )

    return expired_orders


============================================================
from rest_framework import serializers
from .models import SuitType, Order, Measurement


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
            "order_code",
            "status",
            "quantity",
            "total_price",
            "due_date",
            "payment_reference",
            "payment_amount",
            "payment_received_at",
            "payment_notes",
            "payment_allowed",
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


class CreateOrderResponseSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    order_code = serializers.CharField()
    status = serializers.CharField()


class CreateOrderSerializer(serializers.ModelSerializer):
    # Nested fields for the data the user "inserts"
    customer_name = serializers.CharField(source="customer.full_name", write_only=True)
    customer_phone = serializers.CharField(
        source="customer.phone_number", write_only=True
    )
    measurements = MeasurementSerializer(write_only=True)

    # Read-only fields to show the user after creation
    order_id = serializers.UUIDField(source="id", read_only=True)
    order_code = serializers.CharField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "order_id",
            "order_code",
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


class CustomerPaymentSerializer(serializers.Serializer):
    order_code = serializers.CharField()
    customer_phone = serializers.CharField()
    payment_reference = serializers.CharField()
    payment_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    payment_received_at = serializers.DateTimeField(required=False)
    payment_notes = serializers.CharField(required=False, allow_blank=True)


class OrderExpirationResponseSerializer(serializers.Serializer):
    expired_count = serializers.IntegerField()


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

=======================================================
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
