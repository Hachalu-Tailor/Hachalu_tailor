from django.db import transaction
from accounts.models import AuditLog
from orders.models import Order
from rest_framework import status


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
    orders = list(Order.objects.filter(status="IN_PROGRESS"))

    if filter_by_customer:
        orders = [
            order
            for order in orders
            if filter_by_customer.lower() in order.customer.full_name.lower()
            or filter_by_customer in order.customer.phone_number
        ]

    if filter_by_suit_type:
        orders = [
            order
            for order in orders
            if order.suit_type.name.lower() == filter_by_suit_type.lower()
        ]

    return orders


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
    order = Order.objects.filter(order_code=code, status="IN_PROGRESS").first()

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
    order = Order.objects.filter(order_code=code).first()

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

        return {status(code=404, message="Order not found.")}

    if order.status == "COMPLETED":
        return {status(code=400, message="Order is already marked as completed.")}

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
            "description": [order.material, order.customer, order.created_at],
        },
    )

    return {status(code=200, message="Order marked as completed.")}


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
    order = Order.objects.filter(order_code=code).first()

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

        return {status(code=404, message="Order not found.")}

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
            status(code=400, message="Only completed orders can be marked as shipped.")
        }

    if order.status == "SHIPPED":
        AuditLog.objects.create(
            actor=requester,
            action="ORDER_MARKED_SHIPPED_FAILED",
            target_id=order.id,
            identifier_used=order.order_code,
            payload={
                "description": f"Attempted to mark order as shipped, but order with code {code} is already marked as shipped."
            },
        )

        return {status(code=400, message="Order is already marked as shipped.")}

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
            "description": [order.material, order.customer, order.created_at],
        },
    )

    return {status(code=200, message="Order marked as shipped.")}


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
    shipped_orders = list(Order.objects.filter(status="SHIPPED"))
    if filter_by_customer:
        shipped_orders = [
            order
            for order in shipped_orders
            if filter_by_customer.lower() in order.customer.full_name.lower()
            or filter_by_customer in order.customer.phone_number
        ]

    if filter_by_suit_type:
        shipped_orders = [
            order
            for order in shipped_orders
            if order.suit_type.name.lower() == filter_by_suit_type.lower()
        ]

    if filter_by_date_range:
        shipped_orders = [
            order
            for order in shipped_orders
            if filter_by_date_range[0]
            <= order.updated_at.date()
            <= filter_by_date_range[1]
        ]

    return shipped_orders

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
    order = Order.objects.filter(order_code=code, status="SHIPPED").first()

    return order