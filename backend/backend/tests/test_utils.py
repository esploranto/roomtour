from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from backend.models import resize_image
import tempfile
import os
from PIL import Image, ExifTags
import io

class ResizeImageTest(TestCase):
    """Тесты для функции resize_image."""
    
    def setUp(self):
        """Настройка перед каждым тестом."""
        # Создаем временное изображение для тестов
        self.temp_image = self._create_test_image()
    
    def tearDown(self):
        """Очистка после каждого теста."""
        # Удаляем временное изображение
        if hasattr(self, 'temp_image') and os.path.exists(self.temp_image.name):
            os.unlink(self.temp_image.name)
    
    def _create_test_image(self, width=1500, height=1000):
        """Создает тестовое изображение."""
        # Создаем временный файл
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        
        # Создаем тестовое изображение
        image = Image.new('RGB', (width, height), color='red')
        image.save(temp_file.name)
        
        # Возвращаем файл
        return temp_file
    
    def _create_test_image_with_exif(self, orientation=6):
        """Создает тестовое изображение с EXIF-данными."""
        # Создаем временный файл
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        
        # Создаем тестовое изображение
        image = Image.new('RGB', (1000, 1500), color='red')
        
        # Создаем EXIF-данные с ориентацией
        exif_bytes = b'Exif\x00\x00MM\x00*\x00\x00\x00\x08\x00\x01\x01\x12\x00\x03\x00\x00\x00\x01' + bytes([orientation]) + b'\x00\x00\x00\x00\x00\x00\x00'
        
        # Сохраняем изображение с EXIF-данными
        image.save(temp_file.name, exif=exif_bytes)
        
        # Возвращаем файл
        return temp_file
    
    def test_resize_image_large(self):
        """Тест изменения размера большого изображения."""
        # Открываем файл для чтения
        with open(self.temp_image.name, 'rb') as f:
            # Создаем объект SimpleUploadedFile
            image_file = SimpleUploadedFile(
                name='test_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            # Изменяем размер изображения
            resized_image = resize_image(image_file)
            
            # Проверяем, что изображение изменено
            self.assertIsNotNone(resized_image)
            
            # Открываем изображение для проверки размеров
            img = Image.open(io.BytesIO(resized_image.read()))
            
            # Проверяем, что размеры не превышают максимальные
            self.assertLessEqual(img.width, 1200)
            self.assertLessEqual(img.height, 800)
    
    def test_resize_image_small(self):
        """Тест сохранения размера маленького изображения."""
        # Создаем маленькое изображение
        small_image = self._create_test_image(width=800, height=600)
        
        # Открываем файл для чтения
        with open(small_image.name, 'rb') as f:
            # Создаем объект SimpleUploadedFile
            image_file = SimpleUploadedFile(
                name='small_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            # Изменяем размер изображения
            resized_image = resize_image(image_file)
            
            # Проверяем, что изображение не изменено
            self.assertIsNotNone(resized_image)
            
            # Открываем изображение для проверки размеров
            img = Image.open(io.BytesIO(resized_image.read()))
            
            # Проверяем, что размеры не изменились
            self.assertEqual(img.width, 800)
            self.assertEqual(img.height, 600)
        
        # Удаляем временное изображение
        if os.path.exists(small_image.name):
            os.unlink(small_image.name)
    
    def test_resize_image_with_exif(self):
        """Тест изменения размера изображения с EXIF-данными."""
        # Создаем изображение с EXIF-данными (ориентация 6 - повернуто на 90 градусов по часовой)
        exif_image = self._create_test_image_with_exif(orientation=6)
        
        # Открываем файл для чтения
        with open(exif_image.name, 'rb') as f:
            # Создаем объект SimpleUploadedFile
            image_file = SimpleUploadedFile(
                name='exif_image.jpg',
                content=f.read(),
                content_type='image/jpeg'
            )
            
            # Изменяем размер изображения
            resized_image = resize_image(image_file)
            
            # Проверяем, что изображение изменено
            self.assertIsNotNone(resized_image)
            
            # Открываем изображение для проверки размеров
            img = Image.open(io.BytesIO(resized_image.read()))
            
            # Проверяем, что размеры не превышают максимальные
            self.assertLessEqual(img.width, 1200)
            self.assertLessEqual(img.height, 800)
        
        # Удаляем временное изображение
        if os.path.exists(exif_image.name):
            os.unlink(exif_image.name)
    
    def test_resize_image_none(self):
        """Тест обработки None."""
        # Изменяем размер None
        resized_image = resize_image(None)
        
        # Проверяем, что результат None
        self.assertIsNone(resized_image) 