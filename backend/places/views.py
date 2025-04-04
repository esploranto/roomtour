from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
import logging
import os
from .models import Place, PlaceImage
from .serializers import PlaceSerializer, PlaceImageSerializer, UserSerializer
from django.http import Http404

# Настройка логирования
logger = logging.getLogger(__name__)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для пользователей (только чтение)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'

    def get_object(self):
        """
        Переопределяем метод для поддержки поиска пользователей
        как по оригинальному имени, так и по отформатированному URL.
        """
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs[lookup_url_kwarg]

        # Пробуем найти по точному совпадению
        try:
            obj = queryset.get(username=lookup_value)
            return obj
        except User.DoesNotExist:
            # Если не нашли, пробуем найти по отформатированному имени
            formatted_username = lookup_value.replace('-', ' ')
            try:
                obj = queryset.get(username__iexact=formatted_username)
                return obj
            except User.DoesNotExist:
                raise Http404("Пользователь не найден")

class PlaceViewSet(viewsets.ModelViewSet):
    """ViewSet для мест проживания."""
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    lookup_field = 'slug'  # Используем slug вместо id для URL
    
    def get_queryset(self):
        """Возвращает queryset с предзагрузкой изображений."""
        return Place.objects.all().prefetch_related('images')
    
    def get_serializer_context(self):
        """Добавляем request в контекст сериализатора."""
        context = super().get_serializer_context()
        return context
    
    def get_object(self):
        """
        Переопределяем метод для поддержки как slug, так и id.
        Сначала пытаемся найти по slug, затем по id.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            
            # Получаем значение из URL
            lookup_value = self.kwargs[lookup_url_kwarg]
            
            # Сначала пытаемся найти по slug
            try:
                obj = get_object_or_404(queryset, slug=lookup_value)
            except:
                # Если не нашли по slug, пробуем найти по id
                if lookup_value.isdigit():
                    # Если значение числовое, ищем место с таким slug
                    obj = get_object_or_404(queryset, slug=lookup_value)
                else:
                    raise
                
            # Проверяем разрешения
            self.check_object_permissions(self.request, obj)
            
            return obj
        except Exception as e:
            logger.error(f"Ошибка при получении объекта: {str(e)}")
            raise
    
    def create(self, request, *args, **kwargs):
        """Создание нового места с расширенной обработкой ошибок."""
        try:
            logger.info(f"Создание нового места: {request.data}")
            
            # Создаем копию данных запроса
            data = request.data.copy()
            
            # Устанавливаем значения по умолчанию для обязательных полей
            if not data.get('name'):
                data['name'] = "Без названия"
                
            if not data.get('location'):
                data['location'] = None
                
            if not data.get('rating'):
                data['rating'] = None
                
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Место успешно создано: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            logger.error(f"Ошибка валидации при создании места: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Непредвиденная ошибка при создании места: {str(e)}")
            return Response(
                {"error": "Произошла ошибка при создании места. Пожалуйста, попробуйте позже."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Обновление места с поддержкой удаления изображений."""
        try:
            place = self.get_object()
            logger.info(f"Обновление места {place.id}: {request.data}")
            
            # Получаем даты из запроса
            dates = request.data.get('dates', '')
            
            # Создаем копию данных запроса
            data = request.data.copy()
            data['dates'] = dates
            
            # Получаем список ID изображений, которые нужно удалить
            deleted_image_ids = request.data.get('deleted_image_ids', [])
            if deleted_image_ids:
                logger.info(f"Удаление изображений для места {place.id}: {deleted_image_ids}")
                # Преобразуем строку в список, если она пришла в виде строки
                if isinstance(deleted_image_ids, str):
                    try:
                        import json
                        deleted_image_ids = json.loads(deleted_image_ids)
                    except json.JSONDecodeError:
                        deleted_image_ids = [int(id) for id in deleted_image_ids.split(',') if id.strip().isdigit()]
                
                # Удаляем изображения
                PlaceImage.objects.filter(id__in=deleted_image_ids, place=place).delete()
            
            # Обновляем данные места
            serializer = self.get_serializer(place, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            logger.info(f"Место успешно обновлено: {serializer.data}")
            return Response(serializer.data)
        except ValidationError as e:
            logger.error(f"Ошибка валидации при обновлении места: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Непредвиденная ошибка при обновлении места: {str(e)}")
            return Response(
                {"error": "Произошла ошибка при обновлении места. Пожалуйста, попробуйте позже."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_images(self, request, slug=None):
        """Загрузка изображений для места."""
        try:
            place = self.get_object()
            images = request.FILES.getlist('images')
            
            if not images:
                logger.warning(f"Попытка загрузки изображений без файлов для места {place.id}")
                return Response(
                    {'error': 'Не выбраны изображения для загрузки.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Проверка размера и типа файлов
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
            max_size = 10 * 1024 * 1024  # 10 MB
            
            # Создаем изображения для места
            image_instances = []
            for i, image_file in enumerate(images):
                # Проверка размера файла
                if image_file.size > max_size:
                    logger.warning(f"Файл {image_file.name} слишком большой ({image_file.size} байт)")
                    return Response(
                        {'error': f'Файл {image_file.name} превышает максимальный размер 10 МБ.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Проверка расширения файла
                _, ext = os.path.splitext(image_file.name.lower())
                if ext not in allowed_extensions:
                    logger.warning(f"Недопустимый формат файла: {ext}")
                    return Response(
                        {'error': f'Формат файла {ext} не поддерживается. Разрешены только: {", ".join(allowed_extensions)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                image = PlaceImage(place=place, image=image_file, order=i)
                image.save()
                image_instances.append(image)
            
            # Сериализуем созданные изображения
            serializer = PlaceImageSerializer(
                image_instances, 
                many=True,
                context={'request': request}
            )
            
            logger.info(f"Успешно загружено {len(image_instances)} изображений для места {place.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Ошибка при загрузке изображений: {str(e)}")
            return Response(
                {"error": "Произошла ошибка при загрузке изображений. Пожалуйста, попробуйте позже."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_image_order(self, request, slug=None):
        """Обновление порядка отображения изображений для места."""
        try:
            place = self.get_object()
            image_ids = request.data.get('image_ids', [])
            
            if not image_ids:
                logger.warning(f"Попытка обновления порядка без указания ID изображений для места {place.id}")
                return Response(
                    {'error': 'Не указаны ID изображений для обновления порядка.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Если это строка, пытаемся преобразовать в список
            if isinstance(image_ids, str):
                try:
                    import json
                    image_ids = json.loads(image_ids)
                except json.JSONDecodeError:
                    image_ids = [int(id) for id in image_ids.split(',') if id.strip().isdigit()]
            
            # Проверяем, что все ID изображений относятся к данному месту
            images = list(PlaceImage.objects.filter(id__in=image_ids, place=place))
            if len(images) != len(image_ids):
                logger.warning(f"Не все изображения принадлежат месту {place.id}")
                return Response(
                    {'error': 'Не все указанные изображения принадлежат данному месту.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Обновляем порядок отображения
            for i, image_id in enumerate(image_ids):
                for image in images:
                    if image.id == int(image_id):
                        image.order = i
                        image.save()
                        break
            
            # Возвращаем обновленные изображения
            updated_images = PlaceImage.objects.filter(place=place).order_by('order')
            serializer = PlaceImageSerializer(updated_images, many=True, context={'request': request})
            
            logger.info(f"Порядок изображений для места {place.id} успешно обновлен")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Ошибка при обновлении порядка изображений: {str(e)}")
            return Response(
                {"error": "Произошла ошибка при обновлении порядка изображений. Пожалуйста, попробуйте позже."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PlaceImageViewSet(viewsets.ModelViewSet):
    """ViewSet для изображений мест."""
    queryset = PlaceImage.objects.all()
    serializer_class = PlaceImageSerializer
    
    def get_serializer_context(self):
        """Добавляем request в контекст сериализатора."""
        context = super().get_serializer_context()
        return context