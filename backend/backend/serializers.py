from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Place, PlaceImage
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователей."""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class PlaceImageSerializer(serializers.ModelSerializer):
    """Сериализатор для изображений мест."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PlaceImage
        fields = ['id', 'image', 'order', 'image_url']
        
    def get_image_url(self, obj):
        """Получаем полный URL изображения."""
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            else:
                # Если request не доступен, формируем URL вручную
                return f"{settings.MEDIA_URL}{obj.image}"
        return None

class PlaceSerializer(serializers.ModelSerializer):
    """Сериализатор для мест проживания."""
    images = PlaceImageSerializer(many=True, read_only=True)
    dates = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    location = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    rating = serializers.IntegerField(required=False, allow_null=True)
    review = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pros = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cons = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    user_id = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    username = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Place
        fields = ['id', 'user_id', 'username', 'name', 'location', 'rating', 'review', 'pros', 'cons', 'dates', 'images', 'slug']
        read_only_fields = ['id', 'slug', 'created_at']
        
    def _format_month_ru(self, month_number):
        """Возвращает название месяца на русском языке."""
        months = {
            1: 'янв',
            2: 'фев',
            3: 'мар',
            4: 'апр',
            5: 'май',
            6: 'июн',
            7: 'июл',
            8: 'авг',
            9: 'сен',
            10: 'окт',
            11: 'ноя',
            12: 'дек'
        }
        return months.get(month_number, '')
        
    def to_representation(self, instance):
        """Преобразование объекта в словарь с форматированием дат."""
        data = super().to_representation(instance)
        
        # Если есть даты, пробуем их отформатировать
        if data.get('dates'):
            try:
                # Разбираем даты
                dates = data['dates']
                
                # Если даты в формате DD.MM.YYYY – DD.MM.YYYY
                if '.' in dates:
                    from datetime import datetime
                    parts = dates.split('–')
                    if len(parts) == 2:
                        start_date = datetime.strptime(parts[0].strip(), '%d.%m.%Y')
                        end_date = datetime.strptime(parts[1].strip(), '%d.%m.%Y')
                        
                        # Если один и тот же месяц
                        if start_date.month == end_date.month and start_date.year == end_date.year:
                            formatted_dates = f"{start_date.day}–{end_date.day} {self._format_month_ru(end_date.month)} {end_date.year}"
                        # Если разные месяцы, но один год
                        elif start_date.year == end_date.year:
                            formatted_dates = f"{start_date.day} {self._format_month_ru(start_date.month)} – {end_date.day} {self._format_month_ru(end_date.month)} {end_date.year}"
                        # Если разные годы
                        else:
                            formatted_dates = f"{start_date.day} {self._format_month_ru(start_date.month)} {start_date.year} – {end_date.day} {self._format_month_ru(end_date.month)} {end_date.year}"
                        
                        data['dates'] = formatted_dates
            except Exception as e:
                # В случае ошибки оставляем как есть
                pass
        
        return data
        
    def create(self, validated_data):
        """Создание места с правильной обработкой поля dates."""
        # Извлекаем dates из validated_data, если оно есть
        dates = validated_data.pop('dates', '')
        
        # Создаем объект Place без поля dates
        instance = Place.objects.create(**validated_data)
        
        # Устанавливаем значение dates после создания
        instance.dates = dates
        instance.save()
        
        return instance
        
    def update(self, instance, validated_data):
        """Обновление места с правильной обработкой поля dates."""
        # Извлекаем dates из validated_data, если оно есть
        dates = validated_data.pop('dates', instance.dates)
        
        # Обновляем остальные поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Обновляем dates
        instance.dates = dates
        instance.save()
        
        return instance