import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom/extend-expect';
import AddPlacePopup from './AddPlacePopup';
import { act } from 'react';

// Mocking dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext({
      user: { username: 'testuser' }
    }),
  };
});

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks', () => ({
  usePlaces: () => ({
    mutate: jest.fn(),
  }),
}));

const mockCreatePlace = jest.fn().mockResolvedValue({ id: '1', slug: 'test-place' });
const mockUpdatePlace = jest.fn().mockResolvedValue({ id: '1', slug: 'test-place', name: 'Updated Place' });
const mockUploadImages = jest.fn().mockResolvedValue([]);
const mockDeleteImage = jest.fn().mockResolvedValue({});

jest.mock('@/api', () => ({
  placesService: {
    createPlace: (...args) => mockCreatePlace(...args),
    updatePlace: (...args) => mockUpdatePlace(...args),
    uploadImages: (...args) => mockUploadImages(...args),
    deleteImage: (...args) => mockDeleteImage(...args),
  },
}));

// Test suite
describe('AddPlacePopup Component', () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    mockCreatePlace.mockClear();
    mockUpdatePlace.mockClear();
    mockUploadImages.mockClear();
    mockDeleteImage.mockClear();
  });

  test('renders without crashing in add mode', () => {
    console.log('Тест: renders without crashing in add mode');
    render(<AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={jest.fn()} />);
    expect(screen.getByText('Новое место')).toBeInTheDocument();
    expect(screen.getByText('Добавить место')).toBeInTheDocument();
  });

  test('renders without crashing in edit mode', () => {
    console.log('Тест: renders without crashing in edit mode');
    const place = {
      name: 'Test Place',
      location: 'Test Location',
      review: 'Test Review',
      rating: 4,
      dates: '01.01.2023 – 02.01.2023',
      images: [
        { id: 1, image_url: 'test1.jpg' },
        { id: 2, image_url: 'test2.jpg' }
      ]
    };
    render(<AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={jest.fn()} place={place} />);
    expect(screen.getByText('Редактирование места')).toBeInTheDocument();
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Place')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Review')).toBeInTheDocument();
  });

  test('calls onPlaceAdded after successful submission in add mode', async () => {
    const onPlaceAdded = jest.fn();
    render(<AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={onPlaceAdded} />);
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Test Place' } });
      fireEvent.click(screen.getByText('Добавить место'));
    });
    
    await waitFor(() => {
      expect(mockCreatePlace).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Place'
      }));
      expect(onPlaceAdded).toHaveBeenCalled();
    });
  });

  test('successfully updates place in edit mode', async () => {
    const place = {
      id: '1',
      slug: 'test-place',
      name: 'Test Place',
      location: 'Test Location',
      review: 'Test Review',
      rating: 4,
      dates: '01.01.2023 – 02.01.2023',
      images: [
        { id: 1, image_url: 'test1.jpg' },
        { id: 2, image_url: 'test2.jpg' }
      ]
    };
    
    const onPlaceAdded = jest.fn();
    const onClose = jest.fn();
    
    render(
      <AddPlacePopup 
        isOpen={true} 
        onClose={onClose} 
        onPlaceAdded={onPlaceAdded} 
        place={place} 
      />
    );
    
    await act(async () => {
      // Изменяем название места
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Updated Place' } });
      
      // Нажимаем кнопку сохранения
      fireEvent.click(screen.getByText('Сохранить'));
    });
    
    await waitFor(() => {
      // Проверяем, что был вызван метод updatePlace с правильными параметрами
      expect(mockUpdatePlace).toHaveBeenCalledWith(
        'test-place',
        expect.objectContaining({
          name: 'Updated Place'
        })
      );
      
      // Проверяем, что были вызваны колбэки
      expect(onPlaceAdded).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('handles image deletion in edit mode', async () => {
    const place = {
      id: '1',
      slug: 'test-place',
      name: 'Test Place',
      images: [
        { id: 1, image_url: 'test1.jpg' },
        { id: 2, image_url: 'test2.jpg' }
      ]
    };
    
    render(
      <AddPlacePopup 
        isOpen={true} 
        onClose={jest.fn()} 
        onPlaceAdded={jest.fn()} 
        place={place} 
      />
    );
    
    // Находим все кнопки удаления фото
    const deleteButtons = screen.getAllByTitle('Удалить фото');
    
    await act(async () => {
      // Удаляем первое фото
      fireEvent.click(deleteButtons[0]);
      
      // Сохраняем изменения
      fireEvent.click(screen.getByText('Сохранить'));
    });
    
    await waitFor(() => {
      // Проверяем, что был вызван метод deleteImage
      expect(mockDeleteImage).toHaveBeenCalledWith('test-place', 1);
      expect(mockUpdatePlace).toHaveBeenCalled();
    });
  });

  test('handles network errors gracefully', async () => {
    // Имитируем ошибку сети
    mockUpdatePlace.mockRejectedValueOnce(new Error('Network error'));
    
    const place = {
      id: '1',
      slug: 'test-place',
      name: 'Test Place'
    };
    
    render(
      <AddPlacePopup 
        isOpen={true} 
        onClose={jest.fn()} 
        onPlaceAdded={jest.fn()} 
        place={place} 
      />
    );
    
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Updated Place' } });
      fireEvent.click(screen.getByText('Сохранить'));
    });
    
    await waitFor(() => {
      // Проверяем, что появилось сообщение об ошибке
      expect(screen.getByText(/Произошла ошибка/i)).toBeInTheDocument();
    });
  });
}); 