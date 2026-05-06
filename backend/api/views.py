from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, viewsets, status, serializers

from .admin import models
from .models import Favorite, Property, ViewingRequest
from .serializers import FavoriteSerializer, UserSerializer, ProfileSerializer, PropertySerializer, \
    ViewingRequestSerializer
from .services import geocode_address
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

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
    queryset = ViewingRequest.objects.all()
    serializer_class = ViewingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['property', 'status']
    ordering_fields = ['created_at', 'requested_date', 'requested_time']

    def get_queryset(self):
        user = self.request.user
        queryset = ViewingRequest.objects.all()

        # Получаем параметр property из запроса (если есть)
        property_id = self.request.query_params.get('property')

        if user.role == 'owner':
            # Если указан конкретный объект, показываем заявки только на него
            if property_id:
                return queryset.filter(property_id=property_id, property__owner=user)
            else:
                # Иначе показываем все заявки на объекты владельца
                return queryset.filter(property__owner=user)
        else:
            # Для обычных пользователей
            if property_id:
                # Если указан объект, показываем только свои заявки на этот объект
                return queryset.filter(property_id=property_id, user=user)
            else:
                # Иначе показываем все свои заявки
                return queryset.filter(user=user)

    @action(detail=False, methods=['get'], url_path='count')
    def get_count(self, request):
        property_id = request.query_params.get('property')

        if not property_id:
            return Response(
                {'error': 'Property ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Считаем ВСЕ заявки на объект (без фильтрации по пользователю)
        count = ViewingRequest.objects.filter(property_id=property_id).count()

        return Response({'count': count})

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        print("Incoming data:", request.data)
        print("Authenticated user:", request.user)
        print("User ID:", request.user.id)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        viewing_request = self.get_object()

        if viewing_request.user != request.user:
            return Response(
                {'error': 'Вы можете редактировать только свои заявки'},
                status=status.HTTP_403_FORBIDDEN
            )

        if viewing_request.status in ['approved', 'rejected']:
            return Response(
                {'error': 'Нельзя редактировать подтвержденные или отклоненные заявки'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        viewing_request = self.get_object()

        if viewing_request.user != request.user:
            return Response(
                {'error': 'Вы можете удалять только свои заявки'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        viewing_request = self.get_object()

        if viewing_request.property.owner != request.user:
            return Response(
                {'error': 'Только владелец объекта может подтверждать заявки'},
                status=status.HTTP_403_FORBIDDEN
            )

        if viewing_request.status != 'pending':
            return Response(
                {'error': f'Нельзя подтвердить заявку со статусом: {viewing_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        viewing_request.status = 'approved'
        viewing_request.save()

        serializer = self.get_serializer(viewing_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        viewing_request = self.get_object()

        if viewing_request.property.owner != request.user:
            return Response(
                {'error': 'Только владелец объекта может отклонять заявки'},
                status=status.HTTP_403_FORBIDDEN
            )

        if viewing_request.status != 'pending':
            return Response(
                {'error': f'Нельзя отклонить заявку со статусом: {viewing_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        viewing_request.status = 'rejected'
        viewing_request.save()

        serializer = self.get_serializer(viewing_request)
        return Response(serializer.data)