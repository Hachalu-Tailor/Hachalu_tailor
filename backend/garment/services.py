from datetime import date as dt_date

from django.db import transaction
from django.db.models import Q

from accounts.models import AuditLog
from orders.models import Order


def list_orders_in_progress(filter_by_customer=None, filter_by_suit_type=None):
    """
    List all orders that are currently in progress.

    Inputs:
        filter_by_customer (str, optional): The customer name or phone number to filter by.
        filter_by_suit_type (str, optional): The suit type name to filter by.

    Behavior:
        Retrieves all orders with status 'IN_PROGRESS' from the database.
        Allows filtering by customer name/phone and suit type.

    Returns:
        Order: A list of Order objects that are currently in progress.

    """
    queryset = Order.objects.select_related("customer", "suit_type", "material").filter(
        status="IN_PROGRESS"
    )

    if filter_by_customer:
        queryset = queryset.filter(
            Q(customer__full_name__icontains=filter_by_customer)
            | Q(customer__phone_number__icontains=filter_by_customer)
        )

    if filter_by_suit_type:
        queryset = queryset.filter(suit_type__name__iexact=filter_by_suit_type)

    return list(queryset)


def retrive_order_in_progress_by_code(code):
    """
    Retrieve a specific order that is currently in progress by its unique code.

    Inputs:
        code (str): The unique code of the order to retrieve.

    Behavior:
        Fetches the order with the given code and status 'IN_PROGRESS' from the database.

    Returns:
        Order: The Order object that matches the given code and is currently in progress.

    """
    order = (
        Order.objects.select_related("customer", "suit_type", "material")
        .filter(order_code=code, status="IN_PROGRESS")
        .first()
    )

    return order


@transaction.atomic()
def mark_order_as_completed(code, requester):
    """
    Mark an order as completed based on its unique code.

    Inputs:
        code (str): The unique code of the order to mark as completed.

    Behavior:
        Updates the status of the order with the given code to 'COMPLETED' in the database.

    Returns:
        status (str): A message indicating the result of the operation.

    """
    order = Order.objects.select_related("customer", "material").filter(order_code=code).first()

    if not order:
        AuditLog.objects.create(
            actor=requester,
            action="ORDER_MARKED_COMPLETED_FAILED",
            target_id=None,
            identifier_used=code,
            payload={
                "description": f"Attempted to mark order as completed, but order with code {code} was not found."
            },
        )

        return {"code": 404, "message": "Order not found."}

    if order.status == "COMPLETED":
        return {"code": 400, "message": "Order is already marked as completed."}

    if order.status != "IN_PROGRESS":
        return {
            "code": 400,
            "message": "Only orders in progress can be marked as completed.",
        }

    order.status = "COMPLETED"
    order.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="ORDER_MARKED_COMPLETED",
        target_id=order.id,
        identifier_used=order.order_code,
        payload={
            "material_id": str(order.order_code),
            "description": [
                str(order.material),
                str(order.customer),
                order.created_at.isoformat() if order.created_at else None,
            ],
        },
    )

    return {"code": 200, "message": "Order marked as completed."}


@transaction.atomic()
def mark_order_as_shipped(code, requester):
    """
    Mark an order as shipped based on its unique code.

    Inputs:
        code (str): The unique code of the order to mark as shipped.

    Behavior:
        Updates the status of the order with the given code to 'SHIPPED' in the database.

    Returns:
        status (str): A message indicating the result of the operation.

    """
    order = Order.objects.select_related("customer", "material").filter(order_code=code).first()

    if not order:
        AuditLog.objects.create(
            actor=requester,
            action="ORDER_MARKED_SHIPPED_FAILED",
            target_id=None,
            identifier_used=code,
            payload={
                "description": f"Attempted to mark order as shipped, but order with code {code} was not found."
            },
        )

        return {"code": 404, "message": "Order not found."}

    if order.status == "SHIPPED":
        return {"code": 400, "message": "Order is already marked as shipped."}

    if order.status != "COMPLETED":
        AuditLog.objects.create(
            actor=requester,
            action="ORDER_MARKED_SHIPPED_FAILED",
            target_id=order.id,
            identifier_used=order.order_code,
            payload={
                "description": f"Attempted to mark order as shipped, but order with code {code} is not completed. Current status: {order.status}."
            },
        )

        return {
            "code": 400,
            "message": "Only completed orders can be marked as shipped.",
        }

    order.status = "SHIPPED"
    order.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="ORDER_MARKED_SHIPPED",
        target_id=order.id,
        identifier_used=order.order_code,
        payload={
            "material_id": str(order.order_code),
            "description": [
                str(order.material),
                str(order.customer),
                order.created_at.isoformat() if order.created_at else None,
            ],
        },
    )

    return {"code": 200, "message": "Order marked as shipped."}


def list_shiped_orders(
    filter_by_customer=None, filter_by_suit_type=None, filter_by_date_range=None
):
    """
    Retrieve all orders that have been marked as shipped.

    Inputs:
        filter_by_customer (str, optional): The customer name or phone number to filter by.
        filter_by_suit_type (str, optional): The suit type name to filter by.
        filter_by_date_range (tuple, optional): A tuple of two dates (start_date, end_date) to filter by date range.

    Behavior:
        Fetches all orders with status 'SHIPPED' from the database.

    Returns:
        list: A list of Order objects that are currently marked as shipped.

    """
    queryset = Order.objects.select_related("customer", "suit_type", "material").filter(
        status="SHIPPED"
    )

    if filter_by_customer:
        queryset = queryset.filter(
            Q(customer__full_name__icontains=filter_by_customer)
            | Q(customer__phone_number__icontains=filter_by_customer)
        )

    if filter_by_suit_type:
        queryset = queryset.filter(suit_type__name__iexact=filter_by_suit_type)

    if filter_by_date_range:
        start_date = None
        end_date = None

        if (
            isinstance(filter_by_date_range, (tuple, list))
            and len(filter_by_date_range) == 2
        ):
            start_date, end_date = filter_by_date_range
        elif isinstance(filter_by_date_range, str) and "," in filter_by_date_range:
            raw_start, raw_end = [chunk.strip() for chunk in filter_by_date_range.split(",", 1)]
            try:
                start_date = dt_date.fromisoformat(raw_start)
                end_date = dt_date.fromisoformat(raw_end)
            except ValueError:
                start_date, end_date = None, None

        if isinstance(start_date, dt_date) and isinstance(end_date, dt_date):
            queryset = queryset.filter(updated_at__date__range=(start_date, end_date))

    return list(queryset)


def retrive_shiped_order_by_code(code):
    """
    Retrieve a specific order that is currently marked as shipped by its unique code.

    Inputs:
        code (str): The unique code of the order to retrieve.

    Behavior:
        Fetches the order with the given code and status 'SHIPPED' from the database

    Returns:
        Order: The Order object that matches the given code and is currently marked as shipped.
    """
    order = (
        Order.objects.select_related("customer", "suit_type", "material")
        .filter(order_code=code, status="SHIPPED")
        .first()
    )

    return order
