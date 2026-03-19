from django.db import models


class Color(models.Model):
    """ 
        Stores color that will be mapped to a materail in a
        one to many relation
    """
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}"
    

class Material(models.Model):
    """
    Represents a material in the inventory system.

    """
    name = models.CharField(max_length=255)
    colors = models.ManyToManyField(
        Color,
        related_name="materials"
    )
    brand = models.CharField(max_length=100, blank=True, null=True)
    texture = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(max_length=200, null=True, blank=True)
    # field for cloth sample made 
    material_image = models.ImageField(
        upload_to="media/materials/clothes/", 
        blank=True, 
        null=True
    )
    # Field for a sample suit made from this sample cloth
    suit_sample_image = models.ImageField(
        upload_to="media/materials/suits/", 
        blank=True, 
        null=True
    )

    def __str__(self):
        return self.name


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
