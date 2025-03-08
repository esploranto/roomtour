from django.test import TestCase
from backend.models import Place, PlaceImage
from backend.serializers import PlaceSerializer, PlaceImageSerializer
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import os
from PIL import Image

class PlaceSerializerTest(TestCase):
    """Тесты для PlaceSerializer."""
    
    def setUp(self):
        """Настройка перед каждым тестом."""
        self.place_data = {
            'name': 'Тестовое место',
            'location': 'Тестовый адрес',
            'rating': 5,
            'review': 'Тестовый отзыв'
        }
        
        # Создаем место для тестов
        self.place = Place.objects.create(**self.place_data)
    
    def test_place_serializer_contains_expected_fields(self):
        """Тест наличия ожидаемых полей в сериализаторе."""
        serializer = PlaceSerializer(instance=self.place)
        data = serializer.data
        
        # Проверяем наличие всех полей
        self.assertIn('id', data)
        self.assertIn('name', data)
        self.assertIn('location', data)
        self.assertIn('rating', data)
        self.assertIn('review', data)
        self.assertIn('created_at', data)
        self.assertIn('slug', data)
        self.assertIn('images', data)
    
    def test_place_serializer_data(self):
        """Тест данных сериализатора."""
        serializer = PlaceSerializer(instance=self.place)
        data = serializer.data
        
        # Проверяем значения полей
        self.assertEqual(data['name'], self.place_data['name'])
        self.assertEqual(data['location'], self.place_data['location'])
        self.assertEqual(data['rating'], self.place_data['rating'])
        self.assertEqual(data['review'], self.place_data['review'])
        self.assertEqual(data['slug'], self.place.slug)
    
    def test_place_serializer_validation(self):
        """Тест валидации сериализатора."""
        # Некорректные данные (отсутствует обязательное поле name)
        invalid_data = {
            'location': 'Тестовый адрес',
            'rating': 5,
            'review': 'Тестовый отзыв'
        }
        
        serializer = PlaceSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        
        # Некорректный рейтинг
        invalid_data = {
            'name': 'Тестовое место',
            'location': 'Тестовый адрес',
            'rating': 10,  # Рейтинг должен быть от 1 до 5
            'review': 'Тестовый отзыв'
        }
        
        serializer = PlaceSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('rating', serializer.errors)
    
    def test_place_serializer_create(self):
        """Тест создания места через сериализатор."""
        new_place_data = {
            'name': 'Новое тестовое место',
            'location': 'Новый тестовый адрес',
            'rating': 4,
            'review': 'Новый тестовый отзыв'
        }
        
        serializer = PlaceSerializer(data=new_place_data)
        self.assertTrue(serializer.is_valid())
        
        # Создаем место
        place = serializer.save()
        
        # Проверяем, что место создано
        self.assertEqual(place.name, new_place_data['name'])
        self.assertEqual(place.location, new_place_data['location'])
        self.assertEqual(place.rating, new_place_data['rating'])
        self.assertEqual(place.review, new_place_data['review'])
        self.assertIsNotNone(place.slug)
        self.assertIsNotNone(place.created_at)


class PlaceImageSerializerTest(TestCase):
    """Тесты для PlaceImageSerializer."""
    
    def setUp(self):
        """Настройка перед каждым тестом."""
        # Создаем место для тестов
        self.place = Place.objects.create(
            name='Тестовое место',
            location='Тестовый адрес',
            rating=5,
            review='Тестовый отзыв'
        )
        
        # Создаем временное изображение для тестов
        self.temp_image = self._create_test_image()
        
        # Создаем изображение места
        with open(self.temp_image.name, 'rb') as f:
            image_file = SimpleUploadedFile(
                name='test_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            self.place_image = PlaceImage.objects.create(
                place=self.place,
                image=image_file,
                order=1
            )
    
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
    
    def test_place_image_serializer_contains_expected_fields(self):
        """Тест наличия ожидаемых полей в сериализаторе."""
        serializer = PlaceImageSerializer(instance=self.place_image)
        data = serializer.data
        
        # Проверяем наличие всех полей
        self.assertIn('id', data)
        self.assertIn('place', data)
        self.assertIn('image_url', data)
        self.assertIn('order', data)
        self.assertIn('created_at', data)
    
    def test_place_image_serializer_data(self):
        """Тест данных сериализатора."""
        serializer = PlaceImageSerializer(instance=self.place_image)
        data = serializer.data
        
        # Проверяем значения полей
        self.assertEqual(data['place'], self.place.id)
        self.assertIsNotNone(data['image_url'])
        self.assertEqual(data['order'], 1)
    
    def test_place_image_serializer_validation(self):
        """Тест валидации сериализатора."""
        # Некорректные данные (отсутствует обязательное поле place)
        invalid_data = {
            'order': 1
        }
        
        serializer = PlaceImageSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('place', serializer.errors)
        self.assertIn('image', serializer.errors) 