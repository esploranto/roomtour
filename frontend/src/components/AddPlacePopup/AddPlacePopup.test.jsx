import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import AddPlacePopup from './AddPlacePopup';
import { AuthContext } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import * as placesService from '@/api/placesService';

// Мокаем react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

// Мокаем компоненты UI
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => (
    open ? <div>{children}</div> : null
  ),
  DialogContent: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, id, ...props }) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, id, ...props }) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

// Мокаем API сервисы
jest.mock('@/api/placesService', () => ({
  createPlace: jest.fn(),
  updatePlace: jest.fn(),
  uploadImages: jest.fn(),
  deleteImage: jest.fn(),
}));

describe('AddPlacePopup Component', () => {
  const mockPlace = {
    id: '1',
    name: 'Test Place',
    description: 'Test Description',
    images: [{ id: 'image1.jpg', url: 'image1.jpg' }],
  };

  const renderWithProviders = (component) => {
    return render(
      <AuthContext.Provider value={{ user: { username: 'testuser' } }}>
        <ToastProvider>
          {component}
        </ToastProvider>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    placesService.createPlace.mockResolvedValue({ id: '1' });
    placesService.updatePlace.mockResolvedValue({});
    placesService.uploadImages.mockResolvedValue(['image1.jpg']);
    placesService.deleteImage.mockResolvedValue({});
  });

  it('renders without crashing in add mode', () => {
    renderWithProviders(
      <AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={jest.fn()} />
    );
    expect(screen.getByLabelText('Название')).toBeInTheDocument();
  });

  it('renders without crashing in edit mode', () => {
    renderWithProviders(
      <AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={jest.fn()} place={mockPlace} />
    );
    expect(screen.getByDisplayValue('Test Place')).toBeInTheDocument();
  });

  it('calls onPlaceAdded after successful submission in add mode', async () => {
    const onPlaceAdded = jest.fn();
    placesService.createPlace.mockResolvedValueOnce({ id: '1', name: 'New Place' });
    placesService.uploadImages.mockResolvedValueOnce([]);

    renderWithProviders(
      <AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={onPlaceAdded} />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'New Place' } });
      fireEvent.change(screen.getByLabelText('Комментарий'), { target: { value: 'New Description' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /добавить место/i }));
    });

    await waitFor(() => {
      expect(placesService.createPlace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Place',
          review: 'New Description'
        })
      );
    });

    await waitFor(() => {
      expect(onPlaceAdded).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('successfully updates place in edit mode', async () => {
    renderWithProviders(
      <AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={jest.fn()} place={mockPlace} />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Updated Place' } });
      fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));
    });

    await waitFor(() => {
      expect(placesService.updatePlace).toHaveBeenCalledWith(
        mockPlace.id,
        expect.objectContaining({ name: 'Updated Place' })
      );
    });
  });

  it('handles image deletion in edit mode', async () => {
    const mockPlaceWithImages = {
      id: '1',
      name: 'Test Place',
      images: [
        { id: '1', url: 'http://example.com/image1.jpg' }
      ]
    };

    renderWithProviders(
      <AddPlacePopup
        isOpen={true}
        onClose={() => {}}
        place={mockPlaceWithImages}
        isEditMode={true}
      />
    );

    await waitFor(() => {
      const deleteButton = screen.getByTestId('delete-image-button');
      expect(deleteButton).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-image-button');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    const saveButton = screen.getByRole('button', { name: /сохранить/i });
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(placesService.updatePlace).toHaveBeenCalledWith('1', expect.any(Object));
      expect(placesService.deleteImage).toHaveBeenCalledWith('1', '1');
    });
  });

  it('handles network errors gracefully', async () => {
    placesService.updatePlace.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(
      <AddPlacePopup isOpen={true} onClose={jest.fn()} onPlaceAdded={jest.fn()} place={mockPlace} />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Название'), { target: { value: 'Updated Place' } });
      fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument();
    });
  });
}); 