from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from inventory.models import Color, Material, Stock
from accounts.models import User


COLORS = [
    "Red", "Blue", "Green", "Black", "White", "Yellow", "Pink",
    "Purple", "Brown", "Gray", "Orange", "Beige", "Maroon", "Navy",
    "Violet", "Midnight Blue",
]

MATERIALS = [
    {"name": "Our Jema", "texture": "Odda", "category": "Men", "colors": ["Blue", "Yellow"], "stock": 0},
    {"name": "Chuchew", "texture": "Lamine Yamal", "category": "Children", "colors": ["Red", "Blue", "Yellow", "Orange"], "stock": 100},
    {"name": "Barcelona", "texture": "Catalonia", "category": "Men", "colors": ["Red", "Yellow"], "stock": 100},
    {"name": "Biniyam News", "texture": "Soft Slightly", "category": "Men", "colors": ["Red", "Blue", "Yellow"], "stock": 100},
    {"name": "Silk", "texture": "Smooth", "category": "Men", "colors": ["Blue", "Green", "Black"], "stock": 25},
    {"name": "Cotton", "texture": "Little Hard", "category": "Men", "colors": ["Red", "Blue", "Yellow", "Violet"], "stock": 30},
    {"name": "Chuchu Tano", "texture": "Yellow", "category": "Child", "colors": ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Brown", "Gray"], "stock": 100},
    {"name": "Master", "texture": "Hard", "category": "Men", "colors": ["Red", "Blue", "Black", "White", "Brown"], "stock": 100},
]


class Command(BaseCommand):
    help = "Seed demo data for inventory"

    def handle(self, *args, **options):
        if not User.objects.filter(email="admin@gmail.com").exists():
            User.objects.create(
                email="admin@gmail.com",
                password=make_password("admin123"),
                full_name="Admin User",
                phone_number="555",
                role=User.ADMIN,
                is_staff=True,
            )
            self.stdout.write(self.style.SUCCESS("Created admin user"))

        if not User.objects.filter(email="receptionist@gmail.com").exists():
            User.objects.create(
                email="receptionist@gmail.com",
                password=make_password("secret123"),
                full_name="Receptionist User",
                phone_number="444",
                role=User.RECEPTIONIST,
            )
            self.stdout.write(self.style.SUCCESS("Created receptionist user"))

        color_map = {}
        for name in COLORS:
            color, created = Color.objects.get_or_create(name=name)
            color_map[name] = color
            if created:
                self.stdout.write(f"  Created color: {name}")

        for item in MATERIALS:
            if Material.objects.filter(name=item["name"]).exists():
                continue
            material = Material.objects.create(
                name=item["name"],
                texture=item["texture"],
                category=item["category"],
            )
            for cname in item["colors"]:
                if cname in color_map:
                    material.colors.add(color_map[cname])
            Stock.objects.create(material=material, quantity_meters=item["stock"])
            self.stdout.write(f"  Created material: {item['name']}")

        self.stdout.write(self.style.SUCCESS(f"Seed complete: {Color.objects.count()} colors, {Material.objects.count()} materials"))
