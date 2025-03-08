from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from backend.models import Place, PlaceImage
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import os
from PIL import Image

class PlaceViewSetTest(TestCase):
    """Тесты для PlaceViewSet."""
    
    def setUp(self):
        """Настройка перед каждым тестом."""
        self.client = APIClient()
        self.place_data = {
            'name': 'Тестовое место',
            'location': 'Тестовый адрес',
            'rating': 5,
            'review': 'Тестовый отзыв'
        }
        
        # Создаем место для тестов
        self.place = Place.objects.create(**self.place_data)
        
        # URL для API
        self.places_url = '/api/places/'
        self.place_detail_url = f'/api/places/{self.place.slug}/'
        
        # Создаем временное изображение для тестов
        self.temp_image = self._create_test_image()
    
    def tearDown(self):
        """Очистка после каждого теста."""
        # Удаляем временное изображение
        if hasattr(self, 'temp_image') and os.path.exists(self.temp_image.name):
            os.unlink(self.temp_image.name)
    
    def _create_test_image(self):
        """Создает тестовое изображение."""
        # Создаем временный файл
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        
        # Создаем тестовое изображение
        image = Image.new('RGB', (100, 100), color='red')
        image.save(temp_file.name)
        
        # Возвращаем файл
        return temp_file
    
    def test_get_places_list(self):
        """Тест получения списка мест."""
        response = self.client.get(self.places_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], self.place_data['name'])
    
    def test_get_place_detail(self):
        """Тест получения детальной информации о месте."""
        response = self.client.get(self.place_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.place_data['name'])
        self.assertEqual(response.data['location'], self.place_data['location'])
        self.assertEqual(response.data['rating'], self.place_data['rating'])
        self.assertEqual(response.data['review'], self.place_data['review'])
    
    def test_create_place(self):
        """Тест создания места."""
        new_place_data = {
            'name': 'Новое тестовое место',
            'location': 'Новый тестовый адрес',
            'rating': 4,
            'review': 'Новый тестовый отзыв'
        }
        
        response = self.client.post(self.places_url, new_place_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], new_place_data['name'])
        self.assertEqual(response.data['location'], new_place_data['location'])
        self.assertEqual(response.data['rating'], new_place_data['rating'])
        self.assertEqual(response.data['review'], new_place_data['review'])
        
        # Проверяем, что место создано в базе данных
        self.assertTrue(Place.objects.filter(name=new_place_data['name']).exists())
    
    def test_update_place(self):
        """Тест обновления места."""
        updated_data = {
            'name': 'Обновленное тестовое место',
            'location': 'Обновленный тестовый адрес',
            'rating': 3,
            'review': 'Обновленный тестовый отзыв'
        }
        
        response = self.client.put(self.place_detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], updated_data['name'])
        self.assertEqual(response.data['location'], updated_data['location'])
        self.assertEqual(response.data['rating'], updated_data['rating'])
        self.assertEqual(response.data['review'], updated_data['review'])
        
        # Проверяем, что место обновлено в базе данных
        self.place.refresh_from_db()
        self.assertEqual(self.place.name, updated_data['name'])
        self.assertEqual(self.place.location, updated_data['location'])
        self.assertEqual(self.place.rating, updated_data['rating'])
        self.assertEqual(self.place.review, updated_data['review'])
    
    def test_delete_place(self):
        """Тест удаления места."""
        response = self.client.delete(self.place_detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что место удалено из базы данных
        self.assertFalse(Place.objects.filter(id=self.place.id).exists())
    
    def test_upload_images(self):
        """Тест загрузки изображений для места."""
        # URL для загрузки изображений
        upload_url = f'/api/places/{self.place.slug}/upload_images/'
        
        # Открываем файл для чтения
        with open(self.temp_image.name, 'rb') as f:
            # Создаем объект SimpleUploadedFile
            image_file = SimpleUploadedFile(
                name='test_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            # Отправляем запрос на загрузку изображения
            response = self.client.post(
                upload_url,
                {'images': [image_file]},
                format='multipart'
            )
            
            # Проверяем ответ
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(len(response.data), 1)
            
            # Проверяем, что изображение создано в базе данных
            self.assertTrue(PlaceImage.objects.filter(place=self.place).exists())
            self.assertEqual(PlaceImage.objects.filter(place=self.place).count(), 1)
    
    def test_get_place_by_id(self):
        """Тест получения места по ID."""
        # URL для получения места по ID
        place_id_url = f'/api/places/{self.place.id}/'
        
        response = self.client.get(place_id_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.place_data['name'])
        self.assertEqual(response.data['location'], self.place_data['location'])
        self.assertEqual(response.data['rating'], self.place_data['rating'])
        self.assertEqual(response.data['review'], self.place_data['review'])
    
    def test_create_place_with_invalid_data(self):
        """Тест создания места с некорректными данными."""
        # Отсутствует обязательное поле name
        invalid_data = {
            'location': 'Тестовый адрес',
            'rating': 5,
            'review': 'Тестовый отзыв'
        }
        
        response = self.client.post(self.places_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Некорректный рейтинг
        invalid_data = {
            'name': 'Тестовое место',
            'location': 'Тестовый адрес',
            'rating': 10,  # Рейтинг должен быть от 1 до 5
            'review': 'Тестовый отзыв'
        }
        
        response = self.client.post(self.places_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 