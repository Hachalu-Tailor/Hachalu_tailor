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


def get_order_by_code(*, order_code) -> Order:
    if not order_code:
        raise ValidationError("order_code is required.")
    return _resolve_order_by_code(str(order_code).strip())


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
            "order_code": order.order_code,
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
            "order_code": order.order_code,
            "payment_reference": order.payment_reference,
            "payment_amount": str(order.payment_amount),
            "payment_received_at": order.payment_received_at.isoformat(),
        },
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
        payload={"order_id": str(order.id), "order_code": order.order_code},
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
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "reason": reason,
        },
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
