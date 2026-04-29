from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, viewsets, status

from .models import Favorite, Property, ViewingRequest
from .serializers import FavoriteSerializer, UserSerializer, ProfileSerializer, PropertySerializer, \
    ViewingRequestSerializer
from .services import geocode_address
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

User = get_user_model()

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsOwnerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "owner"

class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_permissions(self):
        if self.action == "create":
            return [IsOwnerUser()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        address = self.request.data.get('address', '')
        if address:
            lat, lon = geocode_address(address)
            serializer.save(owner=self.request.user, latitude=lat, longitude=lon)
        else:
            serializer.save(owner=self.request.user)
    
class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        property_id = request.data.get('property_id')
        favorite = Favorite.objects.filter(user=request.user, property_id=property_id).first()
        if favorite:
            favorite.delete()
            return Response({'status': 'removed'})
        else:
            Favorite.objects.create(user=request.user, property_id=property_id)
            return Response({'status': 'added'})


class ViewingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ViewingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ViewingRequest.objects.all()

        # Фильтрация по объекту недвижимости
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)

        # Владельцы видят все заявки на свои объекты
        if self.request.user.role == 'owner':
            return queryset.filter(property__owner=self.request.user)

        # Клиенты видят только свои заявки
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        property_id = self.request.data.get('property')
        property = get_object_or_404(Property, id=property_id)

        # Проверка, что пользователь не владелец объекта
        if property.owner == self.request.user:
            return Response(
                {'detail': 'Владелец не может создавать заявки на свои объекты'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save(user=self.request.user, status='pending')

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        return self._change_status(pk, 'approved')

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        return self._change_status(pk, 'rejected')

    def _change_status(self, pk, new_status):
        viewing_request = self.get_object()

        # Проверка, что текущий пользователь - владелец объекта
        if viewing_request.property.owner != self.request.user:
            return Response(
                {'detail': 'Только владелец может изменять статус заявки'},
                status=status.HTTP_403_FORBIDDEN
            )

        viewing_request.status = new_status
        viewing_request.save()
        serializer = self.get_serializer(viewing_request)
        return Response(serializer.data)