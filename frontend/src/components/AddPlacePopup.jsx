import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.jsx";
import { CalendarIcon, X, RefreshCw, MapPin } from "lucide-react";
import { format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx";
import { Calendar } from "@/components/ui/calendar.jsx";
import { AuthContext } from "@/context/AuthContext";
import { placesService } from "@/api";
import { usePlaces } from "@/lib/hooks";
import { useToast } from "@/context/ToastContext";
import DatePicker from "@/components/ui/date-picker.jsx";
import { networkService } from '../services/networkService';
import { queueService } from '../services/queueService';

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
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  
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

  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.add('bg-gray-100');
      }
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove('bg-gray-100');
      }
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (dropZoneRef.current) {
        dropZoneRef.current.classList.remove('bg-gray-100');
      }
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };
    
    if (isOpen) {
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('dragleave', handleDragLeave);
      document.addEventListener('drop', handleDrop);
    }
    
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isOpen]);

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setTimeout(() => {
      setEndDatePopoverOpen(true);
    }, 100);
  };

  const handleEndDateSelect = (date) => {
    setEndDate(date);
    setEndDatePopoverOpen(false);
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

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removePhoto = (index, isExisting = false) => {
    if (isExisting) {
      const photoToDelete = existingPhotos[index];
      setDeletedPhotos(prev => [...prev, photoToDelete.id]);
      setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setDisabledPhotos(prev => ({
        ...prev,
        [index]: true
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

      if (isEditMode && onPlaceAdded) {
        onPlaceAdded(placeForUI);
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
    if (isEditMode && place && isOpen) {
      setName(place.name || "");
      setAddress(place.location || "");
      setComment(place.review || "");
      setRating(place.rating || 0);
      
      if (place.dates) {
        try {
          const datesParts = place.dates.split(' – ');
          if (datesParts[0]) {
            const parsedStartDate = parse(datesParts[0].trim(), 'dd.MM.yyyy', new Date());
            if (!isNaN(parsedStartDate.getTime())) {
              setStartDate(parsedStartDate);
            }
          }
          if (datesParts[1]) {
            const parsedEndDate = parse(datesParts[1].trim(), 'dd.MM.yyyy', new Date());
            if (!isNaN(parsedEndDate.getTime())) {
              setEndDate(parsedEndDate);
            }
          }
        } catch (error) {
          console.error('Ошибка при парсинге дат:', error);
          setStartDate(null);
          setEndDate(null);
        }
      }
      
      if (place.images && place.images.length > 0) {
        setExistingPhotos(place.images.map((image, index) => ({
          id: image.id || index,
          url: image.image_url,
          isExisting: true
        })));
      }
      
      setFormChanged(false);
      setInitialFormState({
        name: place.name || "",
        address: place.location || "",
        comment: place.review || "",
        rating: place.rating || 0,
        startDate: null,
        endDate: null,
      });
    }
  }, [isEditMode, place, isOpen]);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          safelyCloseForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-5xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto p-0 z-50">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">{isEditMode ? 'Редактирование места' : 'Новое место'}</DialogTitle>
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
        
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="block mb-2">Название</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например «Выходные на майские»"
                  autoComplete="off"
                  aria-autocomplete="none"
                />
              </div>

              <div>
                <Label htmlFor="address" className="block mb-2">Адрес</Label>
                <div className="flex">
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Укажите адрес"
                    className="flex-grow rounded-r-none"
                    autoComplete="off"
                    aria-autocomplete="none"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="rounded-l-none border-l-0"
                    onClick={() => setShowMap(!showMap)}
                  >
                    Карта
                  </Button>
                </div>

                {showMap && (
                  <div className="mt-2 border rounded-md p-4 h-[200px] flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                      <MapPin className="mx-auto mb-2" />
                      <p>Функционал карты будет добавлен позже</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="block mb-2">Даты проживания</Label>
                <div className="grid grid-cols-2 gap-4">
                  <DatePicker
                    value={startDate}
                    onChange={handleStartDateSelect}
                    onClear={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    placeholder="Заезд"
                  />
                  <DatePicker
                    value={endDate}
                    onChange={handleEndDateSelect}
                    onClear={() => setEndDate(null)}
                    placeholder="Выезд"
                    disabled={!startDate}
                    popoverOpen={endDatePopoverOpen}
                    onPopoverOpenChange={setEndDatePopoverOpen}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="comment" className="block mb-2">Комментарий</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Опишите опыт проживания"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="rating" className="block mb-2">Оценка</Label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <div 
                ref={dropZoneRef}
                className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors h-full"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dropZoneRef.current.classList.add('bg-gray-100');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dropZoneRef.current.classList.remove('bg-gray-100');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dropZoneRef.current.classList.remove('bg-gray-100');
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFiles(e.dataTransfer.files);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  multiple
                />
                
                <div className="w-full text-center">
                  <p className="text-gray-500 mb-4">
                    Перетащите сюда фото или видео
                  </p>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full sm:w-auto"
                  >
                    Загрузить фото
                  </Button>
                </div>
              </div>

              {(photos.length > 0 || existingPhotos.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {existingPhotos.map((photo, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index, true)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить фото"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {photos.map((photo, index) => (
                    !disabledPhotos[index] && (
                      <div key={`new-${index}`} className="relative group">
                        <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                          <img 
                            src={photo.preview} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Удалить фото"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-start space-x-4 mt-6">
            <Button 
              type="submit" 
              disabled={loading || !isFormValid} 
              className="w-full sm:w-auto bg-blue-600 text-white"
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
        </form>
      </DialogContent>
    </Dialog>
  );
} 