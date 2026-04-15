from django.contrib.auth import get_user_model
from rest_framework import generics
from .serializers import UserSerializer, ProfileSerializer
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated

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
