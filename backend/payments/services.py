import logging
from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from accounts.models import AuditLog, Notification, User
from orders.models import Order
from .models import Transaction

logger = logging.getLogger(__name__)


def _normalize_amount(value) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValidationError("amount must be a number.")
    if amount <= 0:
        raise ValidationError("amount must be greater than zero.")
    return amount


def _notify_reviewer(order: Order, message: str) -> None:
    if not order.reviewed_by:
        return
    Notification.objects.create(
        user=order.reviewed_by,
        title="Payment Submitted",
        message=message,
        notification_type="PAYMENT_SUBMITTED",
        payload={"order_id": str(order.id), "order_code": order.order_code},
    )


@transaction.atomic
def create_payment(
    *,
    order_code,
    amount,
    full_name,
    phone_number,
    bank_ref_number,
    receipt_pdf_url,
) -> Transaction:
    try:
        order = Order.objects.select_related("customer", "reviewed_by").get(
            order_code=order_code
        )
    except Order.DoesNotExist:
        raise ValidationError("order not found.")

    if order.status != "AWAITING_PAYMENT" or not order.payment_allowed:
        raise ValidationError("Order is not allowed to receive payment yet.")

    if not phone_number or str(phone_number).strip() != order.customer.phone_number:
        raise ValidationError("phone_number does not match order.")

    if not full_name or str(full_name).strip() != order.customer.full_name:
        raise ValidationError("full_name does not match order.")

    if Transaction.objects.filter(order_id=order).exists():
        raise ValidationError("Payment already exists for this order.")

    normalized_amount = _normalize_amount(amount)

    transaction_obj = Transaction.objects.create(
        order_id=order,
        customer_full_name=str(full_name).strip(),
        customer_phone_number=str(phone_number).strip(),
        payment_amount=normalized_amount,
        bank_ref_number=str(bank_ref_number).strip(),
        receipt_pdf_url=str(receipt_pdf_url).strip(),
    )

    order.payment_reference = transaction_obj.bank_ref_number
    order.payment_amount = normalized_amount
    order.payment_received_at = timezone.now()
    order.status = "PENDING_APPROVAL"
    order.save(
        update_fields=[
            "payment_reference",
            "payment_amount",
            "payment_received_at",
            "status",
            "updated_at",
        ]
    )

    AuditLog.objects.create(
        actor=None,
        action="PAYMENT_CREATED",
        target_id=str(transaction_obj.id),
        identifier_used=transaction_obj.bank_ref_number,
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "amount": str(transaction_obj.payment_amount),
        },
    )

    _notify_reviewer(order, "Customer submitted payment. Review and verify.")

    return transaction_obj


@transaction.atomic
def verify_payment(*, transaction_id, reviewer) -> Transaction:
    try:
        transaction_obj = Transaction.objects.select_related("order_id").get(
            id=transaction_id
        )
    except Transaction.DoesNotExist:
        raise ValidationError("payment not found.")

    if transaction_obj.is_verified:
        return transaction_obj

    transaction_obj.is_verified = True
    transaction_obj.save(update_fields=["is_verified"])

    order = transaction_obj.order_id
    order.status = "IN_PROGRESS"
    order.payment_allowed = False
    order.save(update_fields=["status", "payment_allowed", "updated_at"])

    AuditLog.objects.create(
        actor=reviewer if isinstance(reviewer, User) else None,
        action="PAYMENT_VERIFIED",
        target_id=str(transaction_obj.id),
        identifier_used=transaction_obj.bank_ref_number,
        payload={
            "order_id": str(order.id),
            "payment_id": str(transaction_obj.id),
        },
    )

    return transaction_obj
