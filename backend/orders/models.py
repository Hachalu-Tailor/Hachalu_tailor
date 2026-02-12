from django.db import models
import uuid
from inventory.models import Material


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
        ('COMPLETED', 'Suit is finished and ready for pickup'),
        ('CLOSED', 'Customer has collected the suit'),
        ('REJECTED', 'Payment was invalid or order cancelled'),
    """
    STATUS_CHOICES = [
        ('AWAITING_PAYMENT', 'Awaiting_approval'),
        ('PENDING_APPROVAL', 'pending_approval'),
        ('IN_PROGRESS', 'In_progress'),
        ('COMPLETED', 'Completed'),
        ('CLOSED', 'Closed'),
        ('REJECTED', 'Rejected'),
    ]
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False,
        help_text="Unique identifier for the order"
    )
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    suit_type = models.ForeignKey(SuitType, on_delete=models.CASCADE, related_name='orders')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    quantity = models.PositiveIntegerField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer.full_name}"


class Measurement(models.Model):
    """
    Represents measurements associated with a particular order.
    """
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='measurement')
    chest = models.FloatField()
    shoulder = models.FloatField()
    waist = models.FloatField()
    hips = models.FloatField()
    arm_length = models.FloatField()
    height = models.FloatField()

    def __str__(self):
        return f"Measurements for Order #{self.order.id}"
