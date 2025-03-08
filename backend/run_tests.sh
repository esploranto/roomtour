#!/bin/bash

# Запуск тестов с подробным выводом
python manage.py test backend.tests --verbosity=2

# Если нужно запустить тесты с покрытием кода, раскомментируйте следующие строки
# pip install coverage
# coverage run --source='.' manage.py test backend.tests
# coverage report
# coverage html  # создает отчет в HTML-формате в папке htmlcov/ 