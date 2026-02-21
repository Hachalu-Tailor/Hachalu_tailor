# Generated migration to add receipt_screenshot field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0004_alter_transaction_bank_ref_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="receipt_screenshot",
            field=models.FileField(
                blank=True, null=True, upload_to="receipts/screenshots/"
            ),
        ),
    ]
