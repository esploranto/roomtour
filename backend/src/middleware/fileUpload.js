const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const FileType = require('file-type');
const fs = require('fs');

// Загружаем переменные окружения с значениями по умолчанию
const {
  UPLOAD_MAX_SIZE = '5242880', // 5MB по умолчанию
  ALLOWED_FILE_TYPES = 'jpeg,jpg,png,webp', // Разрешенные типы по умолчанию
  UPLOAD_PATH = path.join(__dirname, '../../uploads') // Путь для загрузки по умолчанию
} = process.env;

// Конвертируем строку разрешенных типов файлов в массив
const allowedMimeTypes = ALLOWED_FILE_TYPES.split(',').map(type => `image/${type}`);

// Создаем директорию для загрузки, если она не существует
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    // Генерируем случайное имя файла
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);
      
      // Сохраняем оригинальное расширение файла
      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

// Функция валидации файла
const fileFilter = async (req, file, cb) => {
  try {
    // Проверка MIME типа
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Неподдерживаемый тип файла'), false);
    }

    // Получаем буфер первых байтов файла для проверки магических чисел
    const buffer = file.stream.read(FileType.minimumBytes);
    if (buffer) {
      file.stream.unshift(buffer);
    }

    // Проверяем реальный тип файла по магическим числам
    const fileInfo = await FileType.fromBuffer(buffer);
    if (!fileInfo || !allowedMimeTypes.includes(fileInfo.mime)) {
      return cb(new Error('Обнаружена подмена типа файла'), false);
    }

    // Проверка на вредоносный код (простой пример)
    const readChunk = promisify(file.stream.read).bind(file.stream);
    const chunk = await readChunk(1024); // Читаем первый килобайт
    const stringChunk = chunk.toString();
    
    // Проверяем на наличие подозрительных паттернов
    const suspiciousPatterns = ['<?php', '<script>', '<%', '<?='];
    if (suspiciousPatterns.some(pattern => stringChunk.includes(pattern))) {
      return cb(new Error('Обнаружен потенциально опасный контент'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Создаем middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(UPLOAD_MAX_SIZE, 10),
    files: 1 // Ограничиваем загрузку одним файлом за раз
  }
});

// Middleware обработки ошибок загрузки
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Размер файла превышает допустимый предел'
      });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload: upload.single('file'), // Для одиночной загрузки файла
  handleUploadError
}; 