from django.contrib.auth.models import AbstractUser
from django.db import models

"""
Overide default user model with Custom model
Included role as a field
"""


class User(AbstractUser):
    # Role choices as defined in your protocols 
    ADMIN = 'ADMIN'
    RECEPTIONIST = 'RECEPTIONIST'
    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (RECEPTIONIST, 'Receptionist'),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=RECEPTIONIST
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

"""
The customer model to tie a customer to order, measurent,
payments
"""    


class Customer(models.Model):
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)

    def __str__(self):
        return self.full_name