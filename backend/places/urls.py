from rest_framework.routers import DefaultRouter
from .views import PlaceViewSet, PlaceImageViewSet, UserViewSet

router = DefaultRouter()
router.register(r'places', PlaceViewSet)
router.register(r'place-images', PlaceImageViewSet)
router.register(r'users', UserViewSet)

urlpatterns = router.urls 