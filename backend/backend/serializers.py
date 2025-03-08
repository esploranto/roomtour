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
    
    class Meta:
        model = Place
        fields = '__all__'
        read_only_fields = ['slug']