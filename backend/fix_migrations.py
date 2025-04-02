#!/usr/bin/env python
"""
Скрипт для исправления файлов миграций после рефакторинга структуры приложения.
Заменяет все упоминания 'backend' на 'places' в файлах миграций.
"""

import os
import re
import glob

def fix_migrations():
    """Поиск и исправление ссылок в файлах миграций."""
    # Путь к директории с миграциями
    migrations_dir = 'places/migrations'
    # Получение всех файлов миграций
    migration_files = glob.glob(f'{migrations_dir}/*.py')
    
    print(f"Найдено файлов миграций: {len(migration_files)}")
    
    for file_path in migration_files:
        # Пропускаем __init__.py
        if file_path.endswith('__init__.py'):
            continue
        
        # Чтение содержимого файла
        with open(file_path, 'r') as file:
            content = file.read()
        
        # Замена упоминаний 'backend' на 'places' в dependecies
        updated_content = re.sub(
            r"dependencies\s*=\s*\[\s*\(\s*['\"](backend)['\"]",
            "dependencies = [('places'",
            content
        )
        
        # Если были сделаны изменения, записываем обратно в файл
        if content != updated_content:
            with open(file_path, 'w') as file:
                file.write(updated_content)
            print(f"Обновлен файл: {file_path}")
        else:
            print(f"Файл не требует изменений: {file_path}")

if __name__ == '__main__':
    fix_migrations() 