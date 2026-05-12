from rest_framework import serializers

from django.contrib.auth import get_user_model

from api.models import Favorite, Property, Review, ViewingRequest

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "role"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        role = validated_data.pop('role', 'client')
        user = User.objects.create_user(**validated_data)
        user.role = role
        user.save()
        return user


class ProfileSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    is_admin = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "is_admin",
            "groups",
            "role",
        ]

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser

    def get_groups(self, obj):
        return list(obj.groups.values_list("name", flat=True))

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class PropertySerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    reviews_count = serializers.IntegerField(source='reviews.count', read_only=True)

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = ("owner", "views_count")


class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'property', 'created_at']


class ViewingRequestSerializer(serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(),
        error_messages={'does_not_exist': 'Property does not exist'}
    )
    requested_date = serializers.DateField(
        input_formats=['%Y-%m-%d'],
        error_messages={
            'invalid': 'Enter a valid date in YYYY-MM-DD format'
        }
    )
    requested_time = serializers.TimeField(
        input_formats=['%H:%M'],
        error_messages={
            'invalid': 'Enter a valid time in HH:MM format'
        }
    )
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ViewingRequest
        fields = [
            'id', 'property', 'requested_date', 'requested_time',
            'message', 'status', 'created_at', 'updated_at', 'user', 'user_name'
        ]
        read_only_fields = ['status', 'created_at', 'updated_at', 'user']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'property', 'property_title', 'user', 'user_name',
            'viewing_request', 'rating', 'text', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value

    def validate(self, attrs):
        request = self.context['request']
        user = request.user
        property_obj = attrs.get('property')
        viewing_request = attrs.get('viewing_request')

        if viewing_request:
            if viewing_request.user != user or viewing_request.property != property_obj:
                raise serializers.ValidationError('Viewing request does not match current user and property')
            if viewing_request.status != ViewingRequest.COMPLETED:
                raise serializers.ValidationError('Review can be linked only to a completed viewing request')
        else:
            has_completed_request = ViewingRequest.objects.filter(
                user=user,
                property=property_obj,
                status=ViewingRequest.COMPLETED,
            ).exists()
            if not has_completed_request:
                raise serializers.ValidationError('Review is available only after a completed viewing request')

        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
