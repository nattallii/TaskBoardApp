#!/bin/bash
set -e

echo "========================================"
echo "       Starting Board Service"
echo "========================================"

# Чекаємо, поки база даних буде готова
echo "Waiting for database to be ready..."
sleep 5

# Перевіряємо підключення до бази (опціонально)
echo "Checking database connection..."
python -c "
import asyncio
import os
import asyncpg
import sys

async def test_connection():
    try:
        # Парсимо URL з змінної середовища
        url = os.getenv('DATABASE_URL')
        if not url:
            print('ERROR: DATABASE_URL not set')
            sys.exit(1)
        
        # Видаляємо префікс для asyncpg
        conn_str = url.replace('postgresql+asyncpg://', 'postgresql://')
        conn = await asyncpg.connect(conn_str)
        print('✅ Database connection successful!')
        await conn.close()
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        print('Retrying in 5 seconds...')
        sys.exit(1)

asyncio.run(test_connection())
"

# Виконуємо міграції бази даних
echo "Running database migrations..."
alembic upgrade head

# Запускаємо FastAPI сервер
echo "Starting FastAPI server..."
echo "========================================"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000