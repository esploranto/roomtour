# Generated by Django 5.1.6 on 2025-04-01 19:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0006_alter_place_dates_alter_place_location_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='place',
            name='cons',
            field=models.TextField(blank=True, null=True, verbose_name='Что не понравилось'),
        ),
        migrations.AddField(
            model_name='place',
            name='pros',
            field=models.TextField(blank=True, null=True, verbose_name='Что понравилось'),
        ),
    ]
