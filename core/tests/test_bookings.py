from django.test import TestCase
from knox.models import AuthToken
from rest_framework import status
from rest_framework.test import APITestCase

from core import models
from core.tests import factories


class BookingTestCase(APITestCase):
    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.lodging = factories.LodgingFactory.create()
        self.user = factories.AdminFactory.create()
        self.client.force_login(self.user)
        instance, token = AuthToken.objects.create(self.user)
        self.header = {'HTTP_AUTHORIZATION': "Token " + token}

    def test_need_authentication(self):
        booking = factories.BookingFactory.create()
        response = self.client.get('/api/booking/%d/' % booking.id)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_booking(self):
        booking = factories.BookingFactory.create()
        response = self.client.get('/api/booking/%d/' % booking.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj['id'], booking.id)

    def test_get_booking_with_services(self):
        booking = factories.BookingWithServiceFactory.create()
        response = self.client.get('/api/booking/%d/' % booking.id, **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        obj = response.data
        self.assertEqual(obj['id'], booking.id)
        self.assertIn('options', obj)
        self.assertEqual(len(obj['options']), 1)
        self.assertIn('id', obj['options'][0])
        self.assertIn('reference', obj['options'][0])
        self.assertIn('designation', obj['options'][0])
        self.assertIn('quantity', obj['options'][0])
        self.assertIn('unit_price_ht', obj['options'][0])
        self.assertIn('included_in_booking', obj['options'][0])

    def test_create_booking(self):
        data = {
            'lodging_id': self.lodging.id,
            'status_id': models.BookingStatus.objects.first().id,
            'guest_name': 'John DOE',
            'begin_date': '2021-02-05',
            'end_date': '2021-02-25',
            'duration': 10,
            'price': 345,
        }
        response = self.client.post('/api/booking/', data, **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

    def test_create_booking_with_services(self):
        # factories.ServiceFactory.create_batch(5)
        service = factories.ServiceFactory.create()
        data = {
            'lodging_id': self.lodging.id,
            'status_id': models.BookingStatus.objects.first().id,
            'guest_name': 'John DOE',
            'begin_date': '2021-02-05',
            'end_date':   '2021-02-25',
            'duration':   10,
            'price':      345,
            'options': [
                {'id': service.id, 'reference': service.reference, 'designation': service.designation,
                 'quantity': 1, 'unit_price_ht': service.unit_price_ht, 'included_in_booking': service.included_in_booking}
            ]
        }
        response = self.client.post('/api/booking/', data, format='json', **self.header)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        obj = response.data
        instance = models.Booking.objects.get(id=obj['id'])
        self.assertEqual(instance.options.count(), 1)

        self.assertIn('id', obj)
        self.assertIn('options', obj)
        self.assertEqual(len(obj['options']), 1)

    def test_update_booking_with_services(self):
        booking = factories.BookingWithServiceFactory.create()
        service = factories.ServiceFactory.create()
        self.assertNotEqual(booking.options.first().id, service.id)
        self.assertEqual(models.Service.objects.count(), 2)
        data = {
            'price':      345,
            'options': [
                {'id': service.id, 'reference': service.reference, 'designation': service.designation,
                 'quantity': 1, 'unit_price_ht': service.unit_price_ht, 'included_in_booking': service.included_in_booking}
            ]
        }
        response = self.client.patch('/api/booking/%d/' % booking.id, data, format='json', **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        obj = response.data
        instance = models.Booking.objects.get(id=obj['id'])
        self.assertEqual(instance.options.count(), 1)

        self.assertIn('options', obj)
        self.assertEqual(len(obj['options']), 1)
        self.assertEqual(obj['options'][0]['id'], service.id)

        # removed service is not deleted
        self.assertEqual(models.Service.objects.count(), 2)

    def test_update_quantity_fo_booking_option(self):
        booking = factories.BookingWithServiceFactory.create()
        service = booking.options.first()
        self.assertNotEqual(service.quantity, 123)
        data = {
            'price':      345,
            'options': [
                {'id': service.id, 'reference': service.reference, 'designation': service.designation,
                 'quantity': 123, 'unit_price_ht': service.unit_price_ht, 'included_in_booking': service.included_in_booking}
            ]
        }
        response = self.client.patch('/api/booking/%d/' % booking.id, data, format='json', **self.header)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        obj = response.data
        instance = models.Booking.objects.get(id=obj['id'])
        self.assertEqual(instance.options.count(), 1)

        self.assertIn('options', obj)
        self.assertEqual(len(obj['options']), 1)
        self.assertEqual(obj['options'][0]['id'], service.id)
        self.assertEqual(obj['options'][0]['quantity'], 123)
        self.assertEqual(booking.bookedservice_set.first().quantity, 123)


class BookingModelTestCase(TestCase):
    def setUp(self) -> None:
        factories.BookingStatusFactory.create_batch(4)
        self.lodging = factories.LodgingFactory.create()

    def test_booking_with_options_prices(self):
        booking = factories.BookingFactory.create(price=500)
        service = factories.ServiceFactory.create(quantity=1, unit_price_ht=40, is_flat_rate=False,
                                                  included_in_booking=False)
        models.BookedService.objects.create(service=service, booking=booking, quantity=1)
        self.assertEqual(booking.price, 500)
        self.assertEqual(booking.price_with_options, 500 + 40 * booking.duration)
