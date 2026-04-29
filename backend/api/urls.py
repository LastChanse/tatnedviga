from django.urls import path
from rest_framework.routers import DefaultRouter

from .auth_views import forgot_password, reset_password_confirm
from .views import FavoriteViewSet, PropertyViewSet, ViewingRequestViewSet

router = DefaultRouter()
router.register(r'properties', PropertyViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'viewing-requests', ViewingRequestViewSet, basename='viewing-request')

urlpatterns = [
    # Password reset endpoints
    path('password-reset/', forgot_password, name='password_reset'),
    path('password-reset-confirm/<uidb64>/<token>/', reset_password_confirm, name='password_reset_confirm'),
] + router.urls
