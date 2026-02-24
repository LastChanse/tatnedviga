from django.urls import path
from .auth_views import forgot_password, reset_password_confirm

urlpatterns = [
    # Password reset endpoints
    path('password-reset/', forgot_password, name='password_reset'),
    path('password-reset-confirm/<uidb64>/<token>/', reset_password_confirm, name='password_reset_confirm'),
]
