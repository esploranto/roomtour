const express = require('express');
const router = express.Router();

// Получить информацию о пользователе по username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    // Здесь должна быть логика получения пользователя из базы данных
    // Пока возвращаем моковые данные
    res.json({
      username,
      name: username,
      email: `${username}@example.com`,
      avatar: null
    });
  } catch (error) {
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router; 