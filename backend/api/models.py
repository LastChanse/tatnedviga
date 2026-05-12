from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser


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
        ("booked", "Забронирован"),
        ("sold", "Продан"),
        ("rented", "Сдан в аренду"),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="properties")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.IntegerField()
    area = models.PositiveIntegerField(null=True, blank=True, verbose_name='Площадь')
    deal = models.CharField(max_length=10, choices=DEAL_CHOICES)
    property_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    is_active = models.BooleanField(default=True)
    views_count = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='properties/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    address = models.CharField(max_length=500, blank=True, verbose_name='Полный адрес')
    district = models.CharField(max_length=255, blank=True, verbose_name='Район')
    latitude = models.FloatField(null=True, blank=True, verbose_name='Широта')
    longitude = models.FloatField(null=True, blank=True, verbose_name='Долгота')

    def __str__(self):
        return self.title


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'property']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.property.title}"


class ViewingRequest(models.Model):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    COMPLETED = 'completed'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (COMPLETED, 'Completed'),
    ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    requested_date = models.DateField()
    requested_time = models.TimeField()
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class Review(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    viewing_request = models.OneToOneField(
        ViewingRequest,
        on_delete=models.CASCADE,
        related_name='review',
        null=True,
        blank=True,
    )
    rating = models.PositiveSmallIntegerField()
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['property', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.property.title}: {self.rating}"


class Conversation(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='conversations')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_conversations')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owner_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['property', 'client', 'owner']

    def __str__(self):
        return f"{self.property.title}: {self.client.username} - {self.owner.username}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.text[:40]}"
