from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from backend.models import Place, PlaceImage
import os
import tempfile
from PIL import Image

class PlaceModelTest(TestCase):
    """Тесты для модели Place."""
    
    def setUp(self):
        """Настройка перед каждым тестом."""
        self.place_data = {
            'name': 'Тестовое место',
            'location': 'Тестовый адрес',
            'rating': 5,
            'review': 'Тестовый отзыв'
        }
    
    def test_place_creation(self):
        """Тест создания места."""
        place = Place.objects.create(**self.place_data)
        self.assertEqual(place.name, self.place_data['name'])
        self.assertEqual(place.location, self.place_data['location'])
        self.assertEqual(place.rating, self.place_data['rating'])
        self.assertEqual(place.review, self.place_data['review'])
        self.assertIsNotNone(place.slug)
        self.assertIsNotNone(place.created_at)
    
    def test_place_slug_generation(self):
        """Тест генерации slug."""
        place = Place.objects.create(**self.place_data)
        self.assertEqual(place.slug, 'testovoe-mesto')
    
    def test_place_slug_uniqueness(self):
        """Тест уникальности slug."""
        place1 = Place.objects.create(**self.place_data)
        place2 = Place.objects.create(**self.place_data)
        self.assertNotEqual(place1.slug, place2.slug)
    
    def test_place_rating_validation(self):
        """Тест валидации рейтинга."""
        # Рейтинг должен быть от 1 до 5
        with self.assertRaises(ValidationError):
            place = Place.objects.create(
                name='Тестовое место',
                location='Тестовый адрес',
                rating=6,
                review='Тестовый отзыв'
            )
            place.full_clean()  # Вызываем валидацию
    
    def test_place_str_representation(self):
        """Тест строкового представления места."""
        place = Place.objects.create(**self.place_data)
        self.assertEqual(str(place), self.place_data['name'])


class PlaceImageModelTest(TestCase):
    """Тесты для модели PlaceImage."""
    
    def setUp(self):
        """Настройка перед каждым тестом."""
        self.place = Place.objects.create(
            name='Тестовое место',
            location='Тестовый адрес',
            rating=5,
            review='Тестовый отзыв'
        )
        
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
    
    def test_place_image_creation(self):
        """Тест создания изображения места."""
        # Открываем файл для чтения
        with open(self.temp_image.name, 'rb') as f:
            # Создаем объект SimpleUploadedFile
            image_file = SimpleUploadedFile(
                name='test_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            # Создаем изображение места
            place_image = PlaceImage.objects.create(
                place=self.place,
                image=image_file,
                order=1
            )
            
            # Проверяем, что изображение создано
            self.assertEqual(place_image.place, self.place)
            self.assertIsNotNone(place_image.image)
            self.assertEqual(place_image.order, 1)
            self.assertIsNotNone(place_image.created_at)
    
    def test_place_image_str_representation(self):
        """Тест строкового представления изображения места."""
        # Открываем файл для чтения
        with open(self.temp_image.name, 'rb') as f:
            # Создаем объект SimpleUploadedFile
            image_file = SimpleUploadedFile(
                name='test_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            # Создаем изображение места
            place_image = PlaceImage.objects.create(
                place=self.place,
                image=image_file,
                order=1
            )
            
            # Проверяем строковое представление
            self.assertIn(str(self.place), str(place_image))
    
    def test_place_image_ordering(self):
        """Тест сортировки изображений места."""
        # Создаем несколько изображений с разным порядком
        images = []
        for i in range(3):
            with open(self.temp_image.name, 'rb') as f:
                image_file = SimpleUploadedFile(
                    name=f'test_image_{i}.jpg',
                    content=f.read(),
                    content_type='image/jpeg'
                )
                
                images.append(PlaceImage.objects.create(
                    place=self.place,
                    image=image_file,
                    order=3-i  # Обратный порядок: 3, 2, 1
                ))
        
        # Получаем изображения места и проверяем порядок
        place_images = PlaceImage.objects.filter(place=self.place)
        self.assertEqual(place_images[0].order, 1)
        self.assertEqual(place_images[1].order, 2)
        self.assertEqual(place_images[2].order, 3) 