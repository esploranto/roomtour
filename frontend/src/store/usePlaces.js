import { create } from 'zustand';
import axios from 'axios';

const usePlaces = create((set) => ({
  places: [],
  fetchPlaces: async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/places/');
      set({ places: response.data });
    } catch (error) {
      console.error('Ошибка при загрузке мест:', error);
    }
  }
}));

export default usePlaces;