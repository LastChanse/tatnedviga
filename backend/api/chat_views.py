from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .chat_serializers import (
    ConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)
from .models import Conversation, Message


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(client=user) | Q(owner=user)).select_related(
            'property', 'client', 'owner'
        ).prefetch_related('messages')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = StartConversationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        property_obj = serializer.validated_data['property']

        conversation, _ = Conversation.objects.get_or_create(
            property=property_obj,
            client=request.user,
            owner=property_obj.owner,
        )

        text = serializer.validated_data.get('text', '').strip()
        if text:
            Message.objects.create(conversation=conversation, sender=request.user, text=text)
            conversation.updated_at = timezone.now()
            conversation.save(update_fields=['updated_at'])

        output = self.get_serializer(conversation)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        serializer = MessageSerializer(conversation.messages.select_related('sender'), many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send')
    def send(self, request, pk=None):
        conversation = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=serializer.validated_data['text'].strip(),
        )
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        output = MessageSerializer(message, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)
