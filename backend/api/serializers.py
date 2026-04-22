from django.contrib.auth.models import User
from rest_framework import serializers

from django.contrib.auth import get_user_model

from api.models import Favorite, Property

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
    
    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = ("owner",)

class FavoriteSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'property', 'created_at']