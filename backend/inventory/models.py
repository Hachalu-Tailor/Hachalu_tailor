from django.db import models


class Material(models.Model):
    """
    Represents a material in the inventory system.

    """
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=100)
    texture = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
  
    def __str__(self):
        return f"{self.name} ({self.color})"


class Stock(models.Model):
    """
    Represents the stock record for a particular material.
    """
    material = models.OneToOneField(
        Material,
        on_delete=models.PROTECT,
        related_name='inventory'
    )
    quantity_meters = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    is_available = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        """
        Override save to automatically update availability based on quantity.
        """
        self.is_available = self.quantity_meters > 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Stock for {self.material.name}: {self.quantity_meters}m"
