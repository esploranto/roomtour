#!/bin/bash

# Устанавливаем coverage, если он еще не установлен
pip install coverage

# Запускаем тесты с покрытием кода
coverage run --source='backend' manage.py test backend.tests

# Выводим отчет о покрытии в консоль
coverage report

# Создаем HTML-отчет о покрытии
coverage html

echo "Отчет о покрытии кода создан в папке htmlcov/"
echo "Откройте htmlcov/index.html в браузере для просмотра отчета" 