const express = require('express');
const router = express.Router();

// Получить список всех мест
router.get('/', async (req, res) => {
  try {
    // Здесь должна быть логика получения мест из базы данных
    // Пока возвращаем моковые данные
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить место по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Моковые данные для тестирования
    const mockPlaces = {
      '444': {
        id: '444',
        name: 'Тестовое место',
        location: 'Тестовый адрес',
        dates: '1–31 мар 2025',
        rating: 5,
        review: 'Тестовый отзыв',
        images: []
      }
    };

    const place = mockPlaces[id];
    
    if (!place) {
      return res.status(404).json({ 
        detail: `Место с идентификатором ${id} не существует`
      });
    }

    res.json(place);
  } catch (error) {
    console.error('Ошибка при получении места:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router; 