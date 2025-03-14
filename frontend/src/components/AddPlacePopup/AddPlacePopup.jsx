import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { AuthContext } from "@/context/AuthContext";
import { placesService } from "@/api";
import { usePlaces } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";
import { networkService } from '../../services/networkService';
import { queueService } from '../../services/queueService';
import PhotoUploadArea from './PhotoUploadArea';
import PlaceForm from './PlaceForm';
import { X } from "lucide-react";

export default function AddPlacePopup({ isOpen, onClose, onPlaceAdded, place }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [disabledPhotos, setDisabledPhotos] = useState({});
  const [deletedPhotos, setDeletedPhotos] = useState([]);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [initialFormState, setInitialFormState] = useState({});
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  
  const { mutate } = usePlaces();
  
  const { showSuccess, showError } = useToast();

  const isEditMode = Boolean(place);

  useEffect(() => {
    if (isOpen) {
      const savedForm = localStorage.getItem('addPlaceForm');
      if (savedForm && !formChanged) {
        try {
          const parsedForm = JSON.parse(savedForm);
          setName(parsedForm.name || "");
          setAddress(parsedForm.address || "");
          setComment(parsedForm.comment || "");
          setRating(parsedForm.rating || 0);
          
          if (parsedForm.startDate) {
            setStartDate(new Date(parsedForm.startDate));
          }
          if (parsedForm.endDate) {
            setEndDate(new Date(parsedForm.endDate));
          }
          
          setInitialFormState({
            name: parsedForm.name || "",
            address: parsedForm.address || "",
            comment: parsedForm.comment || "",
            rating: parsedForm.rating || 0,
            startDate: parsedForm.startDate ? new Date(parsedForm.startDate) : null,
            endDate: parsedForm.endDate ? new Date(parsedForm.endDate) : null,
          });
        } catch (e) {
          console.error('Ошибка при восстановлении формы:', e);
          localStorage.removeItem('addPlaceForm');
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const hasChanges = 
        name !== "" || 
        address !== "" || 
        comment !== "" || 
        rating !== 0 || 
        photos.length > 0 ||
        startDate !== null ||
        endDate !== null;
      
      setFormChanged(hasChanges);
      
      if (hasChanges) {
        const formState = {
          name,
          address,
          comment,
          rating,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        };
        localStorage.setItem('addPlaceForm', JSON.stringify(formState));
      }
    }
  }, [name, address, comment, rating, photos, startDate, endDate, isOpen]);

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setStartDatePopoverOpen(false);
    
    // Если дата заезда позже даты выезда, сбрасываем дату выезда
    if (endDate && date > endDate) {
      setEndDate(null);
    }
    
    setTimeout(() => {
      setEndDatePopoverOpen(true);
    }, 100);
  };

  const handleEndDateSelect = (date) => {
    setEndDate(date);
    setEndDatePopoverOpen(false);
    
    // Если дата выезда раньше даты заезда, сбрасываем дату заезда
    if (startDate && date < startDate) {
      setStartDate(null);
      setTimeout(() => {
        setStartDatePopoverOpen(true);
      }, 100);
    }
  };

  const handleFiles = (files) => {
    if (files && files.length > 0) {
      const newPhotos = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
    }
  };

  const removePhoto = (photoId, isExisting = false) => {
    if (isExisting) {
      setDeletedPhotos(prev => [...prev, photoId]);
      setExistingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } else {
      setDisabledPhotos(prev => ({
        ...prev,
        [photoId]: true
      }));
    }
  };

  const restorePhoto = (index) => {
    setDisabledPhotos(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const isFormValid = 
    name.trim() !== "" || 
    address.trim() !== "" || 
    comment.trim() !== "" || 
    rating > 0 || 
    photos.length > 0 ||
    startDate !== null ||
    endDate !== null;

  const resetForm = () => {
    setName("");
    setAddress("");
    setComment("");
    setStartDate(null);
    setEndDate(null);
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setRating(0);
    setError(null);
    setUploadProgress(0);
    setDisabledPhotos({});
    setShowMap(false);
    setFormChanged(false);
    
    localStorage.removeItem('addPlaceForm');
  };

  const safelyCloseForm = () => {
    if (formChanged) {
      onClose();
    } else {
      resetForm();
      onClose();
    }
  };

  const handleCancel = () => {
    if (formChanged) {
      if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите закрыть форму?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formattedDates = startDate || endDate 
      ? `${startDate ? format(startDate, "dd.MM.yyyy") : ''} – ${endDate ? format(endDate, "dd.MM.yyyy") : ''}`
      : '';
    
    const placeData = {
      name: name.trim() || 'Без названия',
      location: address.trim() || 'Без адреса',
      rating: rating || 0,
      review: comment.trim(),
      dates: formattedDates
    };

    try {
      let updatedPlace;
      
      if (isEditMode) {
        const identifier = place.slug || place.id;
        updatedPlace = await placesService.updatePlace(identifier, placeData);
        setUploadProgress(30);
        
        if (deletedPhotos.length > 0) {
          await Promise.all(deletedPhotos.map(photoId => 
            placesService.deleteImage(identifier, photoId)
          ));
        }
      } else {
        updatedPlace = await placesService.createPlace(placeData);
        setUploadProgress(30);
      }
      
      const activePhotos = photos.filter((_, index) => !disabledPhotos[index]);
      
      if (activePhotos.length > 0) {
        const formData = new FormData();
        activePhotos.forEach(photo => {
          formData.append('images', photo.file);
        });
        
        const identifier = updatedPlace.slug || updatedPlace.id;
        
        try {
          const uploadedImages = await placesService.uploadImages(identifier, formData);
          setUploadProgress(100);
          updatedPlace.images = [...(updatedPlace.images || []), ...uploadedImages];
        } catch (uploadError) {
          console.error("Ошибка при загрузке изображений:", uploadError);
          showError("Не удалось загрузить некоторые изображения, но место было сохранено");
        }
      }
      
      const placeForUI = {
        ...updatedPlace,
        title: updatedPlace.name,
        dates: formattedDates,
        id: updatedPlace.id,
        slug: updatedPlace.slug
      };

      showSuccess(isEditMode ? 'Место успешно обновлено!' : 'Место успешно добавлено!');
      mutate();
      resetForm();
      onClose();

      if (onPlaceAdded) {
        onPlaceAdded(placeForUI);
      }

      if (isEditMode) {
        // Ничего не делаем, так как форма уже закрыта
      } else if (user && user.username && placeForUI) {
        const placeIdentifier = placeForUI.slug || placeForUI.id;
        const targetUrl = `/${user.username.toLowerCase().replace(/\s+/g, '')}/${placeIdentifier}`;
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 100);
      }
    } catch (err) {
      console.error(isEditMode ? "Ошибка при обновлении места:" : "Ошибка при добавлении места:", err);
      
      if (!navigator.onLine) {
        console.log("Нет подключения к интернету, добавляем в очередь");
        
        const photoFiles = photos
          .filter((_, index) => !disabledPhotos[index])
          .map(photo => photo.file);
        
        try {
          await queueService.addToQueue({
            type: isEditMode ? 'updatePlace' : 'createPlace',
            data: placeData,
            files: photoFiles,
            ...(isEditMode && { identifier: place.slug || place.id })
          });
          
          showSuccess(isEditMode 
            ? 'Место будет обновлено автоматически, как только появится интернет'
            : 'Место будет добавлено автоматически, как только появится интернет'
          );
          resetForm();
          onClose();
        } catch (queueError) {
          console.error("Ошибка при добавлении в очередь:", queueError);
          showError(isEditMode 
            ? "Не удалось сохранить изменения для последующей отправки"
            : "Не удалось сохранить место для последующей отправки"
          );
        }
      } else {
        const errorMessage = err.error 
          ? (typeof err.error === 'string' ? err.error : JSON.stringify(err.error)) 
          : 'Произошла ошибка при отправке данных. Пожалуйста, попробуйте позже.';
        
        console.error("Детали ошибки:", errorMessage);
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isEditMode && place) {
      setName(place.name || "");
      setAddress(place.location || "");
      setComment(place.review || "");
      setRating(place.rating || 0);
      
      if (place.dates) {
        const [startDateStr, endDateStr] = place.dates.split(' – ');
        if (startDateStr) {
          setStartDate(parse(startDateStr, "dd.MM.yyyy", new Date()));
        }
        if (endDateStr) {
          setEndDate(parse(endDateStr, "dd.MM.yyyy", new Date()));
        }
      }
      
      if (place.images && place.images.length > 0) {
        setExistingPhotos(place.images);
      }
      
      setInitialFormState({
        name: place.name || "",
        address: place.location || "",
        comment: place.review || "",
        rating: place.rating || 0,
        startDate: startDate,
        endDate: endDate,
      });
    }
  }, [isOpen, isEditMode, place]);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          safelyCloseForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-5xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-hidden p-0 z-50 rounded-xl">
        <DialogHeader className="p-6 pb-2 sticky top-0 bg-white dark:bg-gray-800 z-10 border-b">
          <DialogTitle className="text-xl">{isEditMode ? 'Редактирование места' : 'Новое место'}</DialogTitle>
          <button
            onClick={handleCancel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mx-6 mb-4">
            {error}
          </div>
        )}
        
        {loading && uploadProgress > 0 && (
          <div className="mx-6 mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-center mt-1">
              {uploadProgress < 100 ? 'Загрузка...' : 'Загрузка завершена!'}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)', padding: '0 24px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <PlaceForm 
              name={name}
              setName={setName}
              address={address}
              setAddress={setAddress}
              comment={comment}
              setComment={setComment}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              rating={rating}
              setRating={setRating}
              showMap={showMap}
              setShowMap={setShowMap}
              startDatePopoverOpen={startDatePopoverOpen}
              setStartDatePopoverOpen={setStartDatePopoverOpen}
              endDatePopoverOpen={endDatePopoverOpen}
              setEndDatePopoverOpen={setEndDatePopoverOpen}
              handleStartDateSelect={handleStartDateSelect}
              handleEndDateSelect={handleEndDateSelect}
            />

            <PhotoUploadArea 
              photos={photos}
              existingPhotos={existingPhotos}
              disabledPhotos={disabledPhotos}
              onFileSelect={handleFiles}
              onRemovePhoto={removePhoto}
            />
          </div>
        </form>

        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <div className="flex justify-start space-x-4">
            <Button 
              type="submit" 
              disabled={loading || !isFormValid} 
              className="w-full sm:w-auto bg-blue-600 text-white"
              onClick={handleSubmit}
            >
              {loading ? (isEditMode ? "Сохранение..." : "Добавление...") : (isEditMode ? "Сохранить" : "Добавить место")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 