from django.contrib.auth import get_user_model
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # For security, don't reveal if the email exists or not
        return Response(
            {'message': 'If this email exists, you will receive a password reset link'}, 
            status=status.HTTP_200_OK
        )
    
    # Generate password reset token
    token = default_token_generator.make_token(user)
    uid = user.pk
    
    # Create reset URL
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
    
    # Send email
    subject = 'Password Reset Request'
    message = f'Click the link to reset your password: {reset_url}'
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    
    return Response(
        {'message': 'Password reset link has been sent to your email'}, 
        status=status.HTTP_200_OK
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    
    if user is not None and default_token_generator.check_token(user, token):
        new_password = request.data.get('new_password')
        if not new_password:
            return Response(
                {'error': 'New password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        # Optionally, you can log the user in after password reset
        # refresh = RefreshToken.for_user(user)
        # return Response({
        #     'refresh': str(refresh),
        #     'access': str(refresh.access_token),
        # })
        
        return Response(
            {'message': 'Password has been reset successfully'}, 
            status=status.HTTP_200_OK
        )
    
    return Response(
        {'error': 'Invalid reset link'}, 
        status=status.HTTP_400_BAD_REQUEST
    )
