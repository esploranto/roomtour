from django.db import models

class Place(models.Model):
    """Модель для логирования мест проживания во время путешествий."""
    name = models.CharField(max_length=255, verbose_name="Название")
    location = models.CharField(max_length=255, verbose_name="Локация")
    rating = models.PositiveSmallIntegerField(verbose_name="Рейтинг (1-5)")
    review = models.TextField(blank=True, verbose_name="Отзыв")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")

    def __str__(self):
        return f"{self.name} - {self.location} ({self.rating}/5)"

    class Meta:
        verbose_name = "Places"
        verbose_name_plural = "Places"
