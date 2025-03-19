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



  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  return (
    <div 
      ref={dropZoneRef}
      className={`rounded-lg flex flex-col items-center justify-center transition-colors bg-gray-100 dark:bg-gray-700 ${(photos.length === 0 && existingPhotos.length === 0) ? 'md:h-[calc(90vh-14rem)] h-[100px]' : 'h-[100px] md:h-[200px]'} ${photos.length === 0 && existingPhotos.length === 0 ? 'p-6' : 'p-3 md:p-6'}`}
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
        <p className="text-gray-500 mb-4 hidden md:block">
          Перетащите фото в любое место окна браузера
        </p>
        <Button 
          type="button" 
          variant="default" 
          onClick={() => fileInputRef.current.click()}
          className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
        >
          Выбрать фото
        </Button>
      </div>
    </div>
  );
};

export default PhotoUploadArea; 