from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import F
from rest_framework import generics, permissions, viewsets, status

from .models import Favorite, Property, Review, ViewingRequest
from .serializers import (
    FavoriteSerializer,
    ProfileSerializer,
    PropertySerializer,
    ReviewSerializer,
    UserSerializer,
    ViewingRequestSerializer,
)
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
        return request.method in permissions.SAFE_METHODS or obj.owner == request.user


class IsOwnerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "owner"


class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['deal', 'property_type', 'status', 'is_active']
    ordering_fields = ['created_at', 'price', 'views_count']

    def get_queryset(self):
        queryset = Property.objects.all()

        if self.action == 'my':
            return queryset.filter(owner=self.request.user)

        if self.action in ['list', 'retrieve']:
            return queryset.filter(is_active=True)

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'my']:
            return [IsOwnerUser()]
        if self.action in ['update', 'partial_update', 'destroy', 'activate', 'deactivate']:
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        address = self.request.data.get('address', '')
        if address:
            lat, lon = geocode_address(address)
            serializer.save(owner=self.request.user, latitude=lat, longitude=lon)
        else:
            serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        address = self.request.data.get('address')
        if address:
            lat, lon = geocode_address(address)
            serializer.save(latitude=lat, longitude=lon)
        else:
            serializer.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Property.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
        instance.refresh_from_db(fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my')
    def my(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        property_obj = self.get_object()
        property_obj.is_active = True
        property_obj.save(update_fields=['is_active'])
        serializer = self.get_serializer(property_obj)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        property_obj = self.get_object()
        property_obj.is_active = False
        property_obj.save(update_fields=['is_active'])
        serializer = self.get_serializer(property_obj)
        return Response(serializer.data)


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
        property_id = self.request.query_params.get('property')

        if user.role == 'owner':
            if property_id:
                return queryset.filter(property_id=property_id, property__owner=user)
            return queryset.filter(property__owner=user)

        if property_id:
            return queryset.filter(property_id=property_id, user=user)
        return queryset.filter(user=user)

    @action(detail=False, methods=['get'], url_path='count')
    def get_count(self, request):
        property_id = request.query_params.get('property')

        if not property_id:
            return Response(
                {'error': 'Property ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        count = ViewingRequest.objects.filter(property_id=property_id).count()
        return Response({'count': count})

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        viewing_request = self.get_object()
        is_request_author = viewing_request.user == request.user
        is_property_owner = viewing_request.property.owner == request.user

        if not is_request_author and not is_property_owner:
            return Response(
                {'error': 'Вы можете редактировать только свои заявки или заявки на свои объекты'},
                status=status.HTTP_403_FORBIDDEN
            )

        if viewing_request.status in [ViewingRequest.REJECTED, ViewingRequest.COMPLETED]:
            return Response(
                {'error': 'Нельзя редактировать отклоненные или завершенные заявки'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if is_property_owner and not is_request_author:
            allowed_fields = {'requested_date', 'requested_time', 'message'}
            forbidden_fields = set(request.data.keys()) - allowed_fields
            if forbidden_fields:
                return Response(
                    {'error': 'Собственник может переносить только дату, время и комментарий'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        viewing_request = self.get_object()

        if viewing_request.user != request.user and viewing_request.property.owner != request.user:
            return Response(
                {'error': 'Вы можете удалять только свои заявки или заявки на свои объекты'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        return self._set_owner_status(request, ViewingRequest.APPROVED, 'подтверждать')

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        return self._set_owner_status(request, ViewingRequest.REJECTED, 'отклонять')

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        return self._set_owner_status(request, ViewingRequest.COMPLETED, 'завершать')

    def _set_owner_status(self, request, new_status, action_label):
        viewing_request = self.get_object()

        if viewing_request.property.owner != request.user:
            return Response(
                {'error': f'Только владелец объекта может {action_label} заявки'},
                status=status.HTTP_403_FORBIDDEN
            )

        if viewing_request.status not in [ViewingRequest.PENDING, ViewingRequest.APPROVED]:
            return Response(
                {'error': f'Нельзя изменить заявку со статусом: {viewing_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        viewing_request.status = new_status
        viewing_request.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(viewing_request)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['property']
    ordering_fields = ['created_at', 'rating']
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        queryset = Review.objects.select_related('property', 'user', 'viewing_request')
        property_id = self.request.query_params.get('property')
        if property_id:
            return queryset.filter(property_id=property_id)
        return queryset.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        if review.user != request.user:
            return Response(
                {'error': 'Вы можете удалять только свои отзывы'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
