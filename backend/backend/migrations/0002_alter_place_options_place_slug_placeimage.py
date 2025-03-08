# Generated by Django 5.1.6 on 2025-03-08 17:30

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='place',
            options={'verbose_name': 'Places', 'verbose_name_plural': 'Places'},
        ),
        migrations.AddField(
            model_name='place',
            name='slug',
            field=models.SlugField(blank=True, max_length=255, unique=True, verbose_name='URL'),
        ),
        migrations.CreateModel(
            name='PlaceImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='places/', verbose_name='Изображение')),
                ('order', models.PositiveSmallIntegerField(default=0, verbose_name='Порядок отображения')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')),
                ('place', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='backend.place', verbose_name='Место')),
            ],
            options={
                'verbose_name': 'Place Image',
                'verbose_name_plural': 'Place Images',
                'ordering': ['order'],
            },
        ),
    ]
