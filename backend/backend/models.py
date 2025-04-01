from django.db import models
from django.utils.text import slugify
import transliterate
from PIL import Image, ImageOps, ExifTags
import os
import uuid
import re
from io import BytesIO
from django.core.files.base import ContentFile

def resize_image(image, max_size=(1200, 800), quality=85):
    """Изменяет размер изображения, сохраняя пропорции и ориентацию."""
    if not image:
        return None
    
    img = Image.open(image)
    
    # Исправляем ориентацию изображения на основе EXIF-данных
    try:
        # Получаем EXIF-данные
        exif = img._getexif()
        if exif:
            # Находим тег ориентации
            for orientation in ExifTags.TAGS.keys():
                if ExifTags.TAGS[orientation] == 'Orientation':
                    break
            
            # Применяем соответствующее преобразование в зависимости от ориентации
            if orientation in exif:
                if exif[orientation] == 2:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT)
                elif exif[orientation] == 3:
                    img = img.transpose(Image.ROTATE_180)
                elif exif[orientation] == 4:
                    img = img.transpose(Image.FLIP_TOP_BOTTOM)
                elif exif[orientation] == 5:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_90)
                elif exif[orientation] == 6:
                    img = img.transpose(Image.ROTATE_270)
                elif exif[orientation] == 7:
                    img = img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_270)
                elif exif[orientation] == 8:
                    img = img.transpose(Image.ROTATE_90)
    except (AttributeError, KeyError, IndexError):
        # Игнорируем ошибки, если EXIF-данные отсутствуют или повреждены
        pass
    
    # Если изображение уже меньше максимального размера, не изменяем его
    if img.width <= max_size[0] and img.height <= max_size[1]:
        # Сохраняем изображение с правильной ориентацией
        output = BytesIO()
        img.save(output, format=img.format or 'JPEG', quality=quality)
        output.seek(0)
        return ContentFile(output.read(), name=os.path.basename(image.name))
    
    # Сохраняем пропорции
    img.thumbnail(max_size, Image.LANCZOS)
    
    # Сохраняем изображение в буфер
    output = BytesIO()
    # Если формат не определен, используем JPEG
    save_format = img.format or 'JPEG'
    img.save(output, format=save_format, quality=quality)
    output.seek(0)
    
    # Создаем ContentFile с тем же именем файла
    return ContentFile(output.read(), name=os.path.basename(image.name))

class Place(models.Model):
    """Модель для логирования мест проживания во время путешествий."""
    user_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="ID пользователя")
    username = models.CharField(max_length=255, blank=True, null=True, verbose_name="Имя пользователя")
    name = models.CharField(max_length=255, default="Без названия", verbose_name="Название")
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name="Локация")
    rating = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="Рейтинг (1-5)")
    review = models.TextField(blank=True, null=True, verbose_name="Отзыв")
    pros = models.TextField(blank=True, null=True, verbose_name="Что понравилось")
    cons = models.TextField(blank=True, null=True, verbose_name="Что не понравилось")
    dates = models.CharField(max_length=255, blank=True, null=True, verbose_name="Даты пребывания")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    slug = models.SlugField(max_length=255, unique=True, blank=True, verbose_name="URL")
    
    def save(self, *args, **kwargs):
        """Переопределяем метод save для автоматического создания slug."""
        if not self.slug:
            # Если название на кириллице, транслитерируем его
            try:
                slug = slugify(transliterate.translit(self.name, 'ru', reversed=True))
            except:
                # Если транслитерация не удалась, просто используем slugify
                slug = slugify(self.name)
            
            # Проверяем, существует ли уже место с таким slug
            original_slug = slug
            counter = 1
            
            # Проверяем, существует ли уже место с таким slug
            while Place.objects.filter(slug=slug).exists():
                # Если slug уже существует, добавляем к нему уникальный суффикс
                # Сначала проверяем, есть ли уже числовой суффикс
                match = re.search(r'(.*?)(\d+)$', original_slug)
                if match:
                    # Если есть, увеличиваем его
                    slug_base = match.group(1)
                    counter = int(match.group(2)) + 1
                    slug = f"{slug_base}{counter}"
                else:
                    # Если нет, добавляем случайный суффикс
                    random_suffix = uuid.uuid4().hex[:6]
                    slug = f"{original_slug}-{random_suffix}"
            
            self.slug = slug
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Places"
        verbose_name_plural = "Places"

class PlaceImage(models.Model):
    """Модель для хранения изображений мест."""
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='images', verbose_name="Место")
    image = models.ImageField(upload_to='places/', verbose_name="Изображение")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Порядок отображения")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    
    def save(self, *args, **kwargs):
        # Если это новое изображение (еще не сохраненное)
        if self.pk is None and self.image:
            # Получаем имя файла
            filename = os.path.basename(self.image.name)
            
            # Изменяем размер изображения
            resized_image = resize_image(self.image)
            
            # Если изображение было изменено, обновляем его
            if resized_image:
                self.image.save(filename, resized_image, save=False)
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Изображение для {self.place.name} ({self.order})"

    class Meta:
        verbose_name = "Place Image"
        verbose_name_plural = "Place Images"
        ordering = ['order']
