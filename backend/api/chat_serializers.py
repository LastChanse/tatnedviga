from rest_framework import serializers

from .models import Conversation, Message, Property


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'text', 'is_read', 'is_mine', 'created_at']
        read_only_fields = ['conversation', 'sender', 'is_read', 'created_at']

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return bool(request and request.user == obj.sender)


class ConversationSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_image = serializers.ImageField(source='property.image', read_only=True)
    client_name = serializers.CharField(source='client.username', read_only=True)
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'property', 'property_title', 'property_image',
            'client', 'client_name', 'owner', 'owner_name',
            'last_message', 'unread_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['client', 'owner', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        message = obj.messages.order_by('-created_at').first()
        if not message:
            return None
        return {
            'id': message.id,
            'text': message.text,
            'sender_name': message.sender.username,
            'created_at': message.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.exclude(sender=request.user).filter(is_read=False).count()


class StartConversationSerializer(serializers.Serializer):
    property_id = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all(), source='property')
    text = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs):
        request = self.context['request']
        property_obj = attrs['property']

        if request.user.role != 'client':
            raise serializers.ValidationError('Only clients can start a chat with an owner')
        if property_obj.owner == request.user:
            raise serializers.ValidationError('You cannot start a chat with yourself')

        return attrs


class SendMessageSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000)
