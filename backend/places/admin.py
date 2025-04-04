from django.contrib import admin
from .models import Place, PlaceImage

class PlaceImageInline(admin.TabularInline):
    model = PlaceImage
    extra = 1

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    """Админка для мест."""
    list_display = ('name', 'location', 'rating', 'created_at', 'slug')
    search_fields = ('name', 'location', 'review')
    list_filter = ('rating', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at',)
    inlines = [PlaceImageInline]

@admin.register(PlaceImage)
class PlaceImageAdmin(admin.ModelAdmin):
    """Админка для изображений мест."""
    list_display = ('place', 'order', 'created_at')
    list_filter = ('place', 'created_at')
    search_fields = ('place__name',)
    readonly_fields = ('created_at',)
