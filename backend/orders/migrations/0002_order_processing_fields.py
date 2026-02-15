from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="payment_reference",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_amount",
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=12, null=True
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_received_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                choices=[
                    ("INITIATED", "Initiated"),
                    ("AWAITING_PAYMENT", "Awaiting_approval"),
                    ("PENDING_APPROVAL", "pending_approval"),
                    ("IN_PROGRESS", "In_progress"),
                    ("COMPLETED", "Completed"),
                    ("CLOSED", "Closed"),
                    ("REJECTED", "Rejected"),
                    ("EXPIRED", "Expired"),
                ],
                default="INITIATED",
                max_length=20,
            ),
        ),
    ]
