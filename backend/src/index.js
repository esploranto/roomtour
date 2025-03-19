require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { upload, handleUploadError } = require('./middleware/fileUpload');

const app = express();

// Основные настройки безопасности
app.use(helmet()); // Устанавливает различные HTTP заголовки для безопасности
app.use(cors({
  origin: process.env.CORS_ORIGINS.split(','),
  credentials: true
}));

// Настройка rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
  message: 'Слишком много запросов с этого IP, пожалуйста, попробуйте позже'
});

// Применяем rate limiting ко всем запросам
app.use(limiter);

// Парсинг JSON
app.use(express.json());

// Роут для загрузки файлов
app.post('/api/upload', upload, handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  // Возвращаем информацию о загруженном файле
  res.json({
    message: 'Файл успешно загружен',
    filename: req.file.filename,
    path: `${process.env.CDN_URL}/${req.file.filename}`
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Произошла внутренняя ошибка сервера' });
});

// Запуск сервера
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 