# ====== Base Image ======
FROM python:3.11-slim

# ====== Environment Variables ======
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# ====== System Deps (Playwright + DB + Build Tools) ======
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget git \
    build-essential \
    libssl-dev \
    libffi-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    libjpeg-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# ====== Install Python Deps ======
WORKDIR /app
COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# ====== Install Playwright Browsers ======
RUN playwright install-deps chromium \
    && playwright install chromium

# ====== Copy App ======
COPY . .

# ====== Expose & Command ======
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
