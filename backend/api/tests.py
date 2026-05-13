from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Conversation, Favorite, Message, Property, Review, ViewingRequest

User = get_user_model()


class ApiTestCase(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='password123',
            role='owner',
        )
        self.client_user = User.objects.create_user(
            username='client',
            email='client@example.com',
            password='password123',
            role='client',
        )
        self.other_client = User.objects.create_user(
            username='other-client',
            email='other@example.com',
            password='password123',
            role='client',
        )
        self.property = Property.objects.create(
            owner=self.owner,
            title='Тестовая квартира',
            description='Описание объекта',
            price=50000,
            area=42,
            deal='rent',
            property_type='apartment',
            status='available',
            is_active=True,
            address='Казань, Кремлевская 1',
            district='Вахитовский',
        )

    def auth_as(self, user):
        self.client.force_authenticate(user=user)


class PropertyApiTests(ApiTestCase):
    def test_property_list_hides_inactive_by_default(self):
        Property.objects.create(
            owner=self.owner,
            title='Скрытый объект',
            price=100000,
            deal='buy',
            property_type='house',
            status='sold',
            is_active=False,
        )

        response = self.client.get(reverse('property-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.property.id)

    def test_property_list_can_include_inactive(self):
        inactive_property = Property.objects.create(
            owner=self.owner,
            title='Скрытый объект',
            price=100000,
            deal='buy',
            property_type='house',
            status='sold',
            is_active=False,
        )

        response = self.client.get(reverse('property-list'), {'include_inactive': 'true'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertSetEqual(ids, {self.property.id, inactive_property.id})

    def test_inactive_property_can_be_opened_by_direct_link(self):
        self.property.is_active = False
        self.property.status = 'rented'
        self.property.save(update_fields=['is_active', 'status'])

        response = self.client.get(reverse('property-detail', args=[self.property.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.property.id)
        self.assertFalse(response.data['is_active'])


class FavoriteApiTests(ApiTestCase):
    def test_client_can_toggle_favorite(self):
        self.auth_as(self.client_user)

        response = self.client.post(reverse('favorite-toggle'), {'property_id': self.property.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'added')
        self.assertTrue(Favorite.objects.filter(user=self.client_user, property=self.property).exists())

    def test_owner_cannot_add_favorite(self):
        self.auth_as(self.owner)

        response = self.client.post(reverse('favorite-toggle'), {'property_id': self.property.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Favorite.objects.filter(user=self.owner, property=self.property).exists())


class ViewingRequestApiTests(ApiTestCase):
    def test_client_can_create_viewing_request_for_available_property(self):
        self.auth_as(self.client_user)

        response = self.client.post(
            reverse('viewing-request-list'),
            {
                'property': self.property.id,
                'requested_date': '2026-05-20',
                'requested_time': '14:30',
                'message': 'Хочу посмотреть объект',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], ViewingRequest.PENDING)
        self.assertEqual(response.data['property_title'], self.property.title)

    def test_owner_cannot_create_viewing_request(self):
        self.auth_as(self.owner)

        response = self.client.post(
            reverse('viewing-request-list'),
            {
                'property': self.property.id,
                'requested_date': '2026-05-20',
                'requested_time': '14:30',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ViewingRequest.objects.exists())

    def test_client_cannot_create_request_for_unavailable_property(self):
        self.property.status = 'sold'
        self.property.is_active = False
        self.property.save(update_fields=['status', 'is_active'])
        self.auth_as(self.client_user)

        response = self.client.post(
            reverse('viewing-request-list'),
            {
                'property': self.property.id,
                'requested_date': '2026-05-20',
                'requested_time': '14:30',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ViewingRequest.objects.exists())

    def test_owner_can_approve_request_and_property_becomes_booked(self):
        viewing_request = ViewingRequest.objects.create(
            property=self.property,
            user=self.client_user,
            requested_date='2026-05-20',
            requested_time='14:30',
        )
        self.auth_as(self.owner)

        response = self.client.post(reverse('viewing-request-approve', args=[viewing_request.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        viewing_request.refresh_from_db()
        self.property.refresh_from_db()
        self.assertEqual(viewing_request.status, ViewingRequest.APPROVED)
        self.assertEqual(self.property.status, 'booked')
        self.assertTrue(self.property.is_active)

    def test_owner_can_complete_rent_request_and_property_becomes_rented_inactive(self):
        viewing_request = ViewingRequest.objects.create(
            property=self.property,
            user=self.client_user,
            requested_date='2026-05-20',
            requested_time='14:30',
            status=ViewingRequest.APPROVED,
        )
        self.auth_as(self.owner)

        response = self.client.post(reverse('viewing-request-complete', args=[viewing_request.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        viewing_request.refresh_from_db()
        self.property.refresh_from_db()
        self.assertEqual(viewing_request.status, ViewingRequest.COMPLETED)
        self.assertEqual(self.property.status, 'rented')
        self.assertFalse(self.property.is_active)

    def test_owner_can_complete_buy_request_and_property_becomes_sold_inactive(self):
        self.property.deal = 'buy'
        self.property.save(update_fields=['deal'])
        viewing_request = ViewingRequest.objects.create(
            property=self.property,
            user=self.client_user,
            requested_date='2026-05-20',
            requested_time='14:30',
            status=ViewingRequest.APPROVED,
        )
        self.auth_as(self.owner)

        response = self.client.post(reverse('viewing-request-complete', args=[viewing_request.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.property.refresh_from_db()
        self.assertEqual(self.property.status, 'sold')
        self.assertFalse(self.property.is_active)

    def test_client_sees_only_own_requests(self):
        own_request = ViewingRequest.objects.create(
            property=self.property,
            user=self.client_user,
            requested_date='2026-05-20',
            requested_time='14:30',
        )
        ViewingRequest.objects.create(
            property=self.property,
            user=self.other_client,
            requested_date='2026-05-21',
            requested_time='15:30',
        )
        self.auth_as(self.client_user)

        response = self.client.get(reverse('viewing-request-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], own_request.id)


class ReviewApiTests(ApiTestCase):
    def test_review_requires_completed_viewing_request(self):
        viewing_request = ViewingRequest.objects.create(
            property=self.property,
            user=self.client_user,
            requested_date='2026-05-20',
            requested_time='14:30',
            status=ViewingRequest.APPROVED,
        )
        self.auth_as(self.client_user)

        response = self.client.post(
            reverse('review-list'),
            {
                'property': self.property.id,
                'viewing_request': viewing_request.id,
                'rating': 5,
                'text': 'Отличный объект',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Review.objects.exists())

    def test_client_can_create_review_after_completed_request(self):
        viewing_request = ViewingRequest.objects.create(
            property=self.property,
            user=self.client_user,
            requested_date='2026-05-20',
            requested_time='14:30',
            status=ViewingRequest.COMPLETED,
        )
        self.auth_as(self.client_user)

        response = self.client.post(
            reverse('review-list'),
            {
                'property': self.property.id,
                'viewing_request': viewing_request.id,
                'rating': 5,
                'text': 'Отличный объект',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Review.objects.filter(user=self.client_user, property=self.property).exists())


class ConversationApiTests(ApiTestCase):
    def test_client_can_start_conversation_with_owner(self):
        self.auth_as(self.client_user)

        response = self.client.post(
            reverse('conversation-list'),
            {
                'property_id': self.property.id,
                'text': 'Здравствуйте, объект актуален?',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Conversation.objects.count(), 1)
        self.assertEqual(Message.objects.count(), 1)
        conversation = Conversation.objects.first()
        self.assertEqual(conversation.client, self.client_user)
        self.assertEqual(conversation.owner, self.owner)

    def test_owner_cannot_start_conversation_as_client(self):
        self.auth_as(self.owner)

        response = self.client.post(
            reverse('conversation-list'),
            {
                'property_id': self.property.id,
                'text': 'Тест',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Conversation.objects.exists())

    def test_conversation_participant_can_send_and_read_messages(self):
        conversation = Conversation.objects.create(
            property=self.property,
            client=self.client_user,
            owner=self.owner,
        )
        self.auth_as(self.client_user)

        send_response = self.client.post(
            reverse('conversation-send', args=[conversation.id]),
            {'text': 'Добрый день'},
            format='json',
        )

        self.assertEqual(send_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 1)

        messages_response = self.client.get(reverse('conversation-messages', args=[conversation.id]))

        self.assertEqual(messages_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(messages_response.data), 1)
        self.assertTrue(messages_response.data[0]['is_mine'])

    def test_non_participant_cannot_read_conversation(self):
        conversation = Conversation.objects.create(
            property=self.property,
            client=self.client_user,
            owner=self.owner,
        )
        self.auth_as(self.other_client)

        response = self.client.get(reverse('conversation-messages', args=[conversation.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
