FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Встановлюємо системні залежності
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо uv (сучасний менеджер пакетів Python)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Копіюємо файли залежностей
COPY pyproject.toml uv.lock* ./

# Встановлюємо Python залежності
RUN uv pip install --system . && \
    uv pip install --system asyncpg

# Копіюємо код додатку
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Копіюємо скрипт для запуску
COPY entrypoint.sh .

# Робимо скрипт виконуваним
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Використовуємо entrypoint для запуску міграцій та сервера
ENTRYPOINT ["/app/entrypoint.sh"]