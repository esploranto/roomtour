import React, { useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { X } from "lucide-react";

const PhotoUploadArea = ({ 
  photos, 
  existingPhotos, 
  disabledPhotos, 
  onFileSelect, 
  onRemovePhoto 
}) => {
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);

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
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        ref={dropZoneRef}
        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors h-full"
        style={{ borderStyle: 'dashed', borderWidth: '2px', borderSpacing: '12px' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
            variant="default" 
            onClick={() => fileInputRef.current.click()}
            className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
          >
            Загрузить фото
          </Button>
        </div>
      </div>

      {(photos.length > 0 || existingPhotos.length > 0) && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {existingPhotos.map((photo, index) => (
            <div key={`existing-${index}`} className="relative group">
              <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden h-[120px]">
                <img 
                  src={photo.url || photo.image_url} 
                  alt={`Preview ${index}`} 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemovePhoto(photo.id, true)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить фото"
                data-testid="delete-image-button"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          {photos.map((photo, index) => (
            !disabledPhotos[index] && (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden h-[120px]">
                  <img 
                    src={photo.preview} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
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
  );
};

export default PhotoUploadArea; 