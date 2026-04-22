from django.conf import settings
from django.db import models
from django.contrib.auth.models import User, AbstractUser


# Models will be added here in the future
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("client", "Клиент"),
        ("owner", "Собственник"),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

class Property(models.Model):
    DEAL_CHOICES = (
        ("rent", "Аренда"),
        ("buy", "Продажа"),
    )

    TYPE_CHOICES = (
        ("apartment", "Квартира"),
        ("house", "Дом"),
        ("commercial", "Коммерческая"),
    )

    STATUS_CHOICES = (
        ("available", "Доступен"),
        ("sold", "Продан"),
        ("rented", "Сдан"),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="properties")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.IntegerField()
    deal = models.CharField(max_length=10, choices=DEAL_CHOICES)
    property_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    district = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    image = models.ImageField(upload_to='properties/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title