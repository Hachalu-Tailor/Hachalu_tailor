from django.db import models
from django.conf import settings
import uuid
from inventory.models import Material, Color


class SuitType(models.Model):
    """
    Represents the type of suit available for orders.
    """

    name = models.CharField(max_length=100, unique=True)
    lapel_count = models.PositiveSmallIntegerField()

    def __str__(self):
        return self.name


class Customer(models.Model):
    """
    Represents a customer who places suit orders.
    """

    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.full_name


class Order(models.Model):
    """
    Represents an order placed by a customer.
    ('INITIATED', 'Customer submitted order; waiting for Receptionist to call and set price/date'),
        ('AWAITING_PAYMENT', 'Price/Date set; waiting for Customer to upload Ref Number/Receipt'),
        ('PENDING_APPROVAL', 'Customer uploaded receipt; waiting for Receptionist to verify bank data'),
        ('IN_PROGRESS', 'Payment verified; Suit is being stitched'),
        ('COMPLETED', 'Suit is finished and ready for pickup'), 'HAS BEEN SEEWED AT THE FACTORY'
        ('SHIPPED'), 'ORDER HAS BEEN SHIPPED FROM FACTORY'
        ('IN_STORE'), 'ORDER MATERIAL HAS NOW ARRIVED AND IS READY FOR USER TO TAKE'
        ('CLOSED', 'Customer has collected the suit'),
        ('REJECTED', 'Payment was invalid or order cancelled'),
    """

    STATUS_CHOICES = [
        ("INITIATED", "Initiated"),
        ("AWAITING_PAYMENT", "Awaiting_approval"),
        ("PENDING_APPROVAL", "pending_approval"),
        ("IN_PROGRESS", "In_progress"),
        ("SHIPPED", "Shipped"),
        ("COMPLETED", "Completed"),
        ("IN_STORE", "In_store"),
        ("CLOSED", "Closed"),
        ("IN_STORE", "In_store"),
        ("REJECTED", "Rejected"),
        ("EXPIRED", "Expired"),
    ]
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the order",
    )
    order_code = models.CharField(max_length=12, unique=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="orders"
    )
    suit_type = models.ForeignKey(
        SuitType, on_delete=models.CASCADE, related_name="orders"
    )
    material = models.ForeignKey(
        Material, on_delete=models.CASCADE, related_name="orders"
    )
    selected_color = models.ForeignKey(
        Color, on_delete=models.PROTECT, related_name="chosen_color", default=1
    )
    measurement = models.OneToOneField(
        "Measurement",
        on_delete=models.CASCADE,
        related_name="order",
        null=True,
        blank=True,
    )
    expected_price = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reviewed_orders",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="INITIATED"
    )
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()

    payment_reference = models.CharField(max_length=120, blank=True)
    payment_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    payment_received_at = models.DateTimeField(null=True, blank=True)
    payment_notes = models.TextField(blank=True)
    payment_allowed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_code} - {self.customer.full_name}"


class Measurement(models.Model):
    """
    Represents measurements associated with a particular order.
    """

    chest = models.FloatField()
    shoulder = models.FloatField()
    waist = models.FloatField()
    hips = models.FloatField()
    arm_length = models.FloatField()
    height = models.FloatField()

    def __str__(self):
        return f"Measurements #{self.id}"
