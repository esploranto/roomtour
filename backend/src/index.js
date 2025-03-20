require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { upload, handleUploadError } = require('./middleware/fileUpload');
const path = require('path');

const app = express();

// Основные настройки безопасности
app.use(helmet()); // Устанавливает различные HTTP заголовки для безопасности

// Настройка CORS с значениями по умолчанию
const corsOptions = {
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(','),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Настройка rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 минут по умолчанию
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 запросов по умолчанию
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

// Подключаем маршруты
const usersRouter = require('./routes/users');
const placesRouter = require('./routes/places');

app.use('/api/users', usersRouter);
app.use('/api/places', placesRouter);

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