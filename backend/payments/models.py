from django.db import models
from decimal import Decimal
import uuid
from orders.models import Order


class Transaction(models.Model):
    """
        Transaction data linked to an order
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="transaction"
    )
    payment_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    bank_ref_number = models.CharField(max_length=255, blank=True, null=True)
    receipt_pdf_url = models.URLField(max_length=500, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.id} - Order {self.order_id}"
