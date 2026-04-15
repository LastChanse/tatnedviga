from django.db import models
from django.contrib.auth.models import User, AbstractUser


# Models will be added here in the future

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("client", "Клиент"),
        ("owner", "Собственник"),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)