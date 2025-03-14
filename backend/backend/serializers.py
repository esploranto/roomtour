from rest_framework import serializers
from .models import Place, PlaceImage
from django.conf import settings

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
    dates = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    class Meta:
        model = Place
        fields = '__all__'
        read_only_fields = ['slug']
        
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