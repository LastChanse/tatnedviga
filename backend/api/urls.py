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
    path('viewing-requests/', ViewingRequestViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('viewing-requests/<int:pk>/', ViewingRequestViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    })),
] + router.urls