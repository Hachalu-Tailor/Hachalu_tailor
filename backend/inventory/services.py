from decimal import Decimal, InvalidOperation
from rest_framework.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from accounts.models import AuditLog
from .models import Material, Stock


ALLOWED_MATERIAL_FIELDS = {"name", "color", "texture", "image_url"}


def _normalize_quantity(quantity_meters) -> Decimal:
    """Validate and normalize a stock quantity input.

    Inputs:
        quantity_meters: Any value intended to represent meters of stock.

    Behavior:
        Coerces the input to Decimal and rejects missing, non-numeric, or
        negative values.

    Returns:
        Decimal: The normalized non-negative quantity.
    """
    if quantity_meters is None:
        raise ValidationError("quantity_meters is required.")
    try:
        quantity = Decimal(str(quantity_meters))
    except (InvalidOperation, TypeError):
        raise ValidationError("quantity_meters must be a number.")
    if quantity < 0:
        raise ValidationError("quantity_meters cannot be negative.")
    return quantity


def _validate_material_data(material_data: dict) -> dict:
    """Validate and clean material fields.

    Inputs:
        material_data: Dict of material fields to create or update.

    Behavior:
        Ensures required fields are present, trims string values, and rejects
        unexpected fields.

    Returns:
        dict: Cleaned material data safe for model creation.
    """
    if not material_data:
        raise ValidationError("material_data is required.")
    unexpected = set(material_data.keys()) - ALLOWED_MATERIAL_FIELDS
    if unexpected:
        raise ValidationError(f"Unexpected fields: {', '.join(sorted(unexpected))}.")

    cleaned = dict(material_data)
    for field in ("name", "color"):
        value = cleaned.get(field, "")
        if not isinstance(value, str) or not value.strip():
            raise ValidationError(f"{field} is required.")
        cleaned[field] = value.strip()

    for field in ("texture", "image_url"):
        value = cleaned.get(field)
        if isinstance(value, str):
            cleaned[field] = value.strip()
    return cleaned


def list_materials():
    """List all materials with their related stock records.

    Inputs:
        None.

    Behavior:
        Returns a queryset optimized with related inventory preloading.

    Returns:
        QuerySet[Material]: All materials with related stock.
    """
    return Material.objects.select_related("inventory").all()


def get_material(material_id: int) -> Material:
    """Fetch a single material by ID.

    Inputs:
        material_id: The primary key of the material.

    Behavior:
        Retrieves the material and its related stock in a single query.

    Returns:
        Material: The matching material instance.
    """
    return Material.objects.select_related("inventory").get(id=material_id)


@transaction.atomic
def create_material_with_stock(
    *, material_data: dict, quantity_meters: Decimal, requester
) -> Material:
    """Create material and initial stock in one atomic task.

    Inputs:
        material_data: Dict of material fields (name, color, texture, image_url).
        quantity_meters: Initial stock quantity in meters.
        requester: User performing the action (for audit logging).

    Behavior:
        Validates inputs, creates Material and Stock in a transaction, and
        records an audit log entry.

    Returns:
        Material: The newly created material instance.
    """
    cleaned_data = _validate_material_data(material_data)
    quantity = _normalize_quantity(quantity_meters)
    material = Material.objects.create(**cleaned_data)
    Stock.objects.create(material=material, quantity_meters=quantity)

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="MATERIAL_CREATED",
        target_id=material.id,
        identifier_used=material.name,
        payload={
            "material_id": str(material.id),
            "name": material.name,
            "description": material.texture,
        },
    )
    return material


def update_material(*, material: Material, updates: dict, requester) -> Material:
    """Update a material with validated fields.

    Inputs:
        material: Material instance to update.
        updates: Dict of fields to change (name, color, texture, image_url).
        requester: User performing the action (for audit logging).

    Behavior:
        Validates input fields, applies updates, saves the model, and records
        an audit log entry.

    Returns:
        Material: The updated material instance.
    """
    if not updates:
        raise ValidationError("updates is required.")
    unexpected = set(updates.keys()) - ALLOWED_MATERIAL_FIELDS
    if unexpected:
        raise ValidationError(f"Unexpected fields: {', '.join(sorted(unexpected))}.")
    for field, value in updates.items():
        if field in {"name", "color"}:
            if not isinstance(value, str) or not value.strip():
                raise ValidationError(f"{field} cannot be blank.")
            value = value.strip()
        if field in {"texture", "image_url"} and isinstance(value, str):
            value = value.strip()
        setattr(material, field, value)
    material.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="MATERIAL_UPDATED",
        target_id=material.id,
        identifier_used=material.name,
        payload={
            "material_id": str(material.id),
            "name": material.name,
            "color": material.color,
            "texture": material.texture,
            "image_url": material.image_url,
        },
    )
    return material


def delete_material(*, material: Material, requester) -> None:
    """Delete a material and record the audit event.

    Inputs:
        material: Material instance to delete.
        requester: User performing the action (for audit logging).

    Behavior:
        Deletes the material and records an audit log entry.

    Returns:
        None.
    """
    material.delete()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="MATERIAL_DELETED",
        target_id=material.id,
        identifier_used=material.name,
        payload={
            "material_id": str(material.id),
            "name": material.name,
            "color": material.color,
            "texture": material.texture,
        },
    )


@transaction.atomic
def add_stock(*, material: Material, quantity_meters: Decimal, requester) -> Stock:
    """Increase stock quantity for a material; creates stock if missing.

    Inputs:
        material: Material instance to adjust.
        quantity_meters: Amount to add (must be greater than zero).
        requester: User performing the action (for audit logging).

    Behavior:
        Validates input, increments stock in a transaction, and records an
        audit log entry.

    Returns:
        Stock: The updated or created stock instance.
    """

    quantity = _normalize_quantity(quantity_meters)
    if quantity == 0:
        raise ValidationError("quantity_meters must be greater than zero.")
    stock, created = Stock.objects.get_or_create(material=material)
    if not created:
        Stock.objects.filter(id=stock.id).update(
            quantity_meters=F("quantity_meters") + quantity
        )
        stock.refresh_from_db()
    else:
        stock.quantity_meters = quantity
        stock.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="STOCK_ADDED",
        target_id=material.id,
        identifier_used=material.name,
        payload={
            "material_id": str(material.id),
            "name": material.name,
            "quantity_meters": str(quantity),
        },
    )
    return stock


@transaction.atomic
def set_stock_quantity(
    *, material: Material, quantity_meters: Decimal, requester
) -> Stock:
    """Set stock quantity for a material to an exact value.

    Inputs:
        material: Material instance to adjust.
        quantity_meters: Quantity to set (non-negative).
        requester: User performing the action (for audit logging).

    Behavior:
        Validates input, sets stock quantity in a transaction, and records an
        audit log entry.

    Returns:
        Stock: The updated or created stock instance.
    """
    quantity = _normalize_quantity(quantity_meters)
    stock, _ = Stock.objects.get_or_create(material=material)
    stock.quantity_meters = quantity
    stock.save()

    # Audit logging
    AuditLog.objects.create(
        actor=requester,
        action="STOCK_QUANTITY_SET",
        target_id=material.id,
        identifier_used=material.name,
        payload={
            "material_id": str(material.id),
            "name": material.name,
            "quantity_meters": str(quantity),
        },
    )

    return stock
