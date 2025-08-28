# syntax=docker/dockerfile:1.6

# ==============================================================================
# Stage 1: Build Frontend (Vite + React)
# ==============================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package manifests and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build-time configuration (override via --build-arg if needed)
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME="Freelancer Toolkit"

# Vite only respects env vars prefixed with VITE_ at build-time
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}

# Build production assets
RUN npm run build


# ==============================================================================
# Stage 2: Final - Backend (Uvicorn) + Frontend (Nginx) in one container
# ==============================================================================
FROM python:3.12-slim AS final

# ------------------------------------------------------------------------------
# Runtime env and defaults
# ------------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Uvicorn bind address/port
    BACKEND_HOST=127.0.0.1 \
    BACKEND_PORT=8000 \
    # Default audio storage (can be overridden)
    AUDIO_STORAGE_PATH=/app/audio_files

WORKDIR /app

# ------------------------------------------------------------------------------
# System dependencies: nginx + supervisor + curl + Playwright deps (Chromium)
# ------------------------------------------------------------------------------
RUN --mount=type=cache,target=/var/cache/apt \
    set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    ca-certificates \
    curl \
    # Headless Chromium/Playwright deps (for backend scraper)
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxkbcommon0; \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------
# Python dependencies (backend)
# ------------------------------------------------------------------------------
# Copy requirements first to leverage Docker layer caching
COPY backend/requirements.txt ./backend/requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt && \
    # Install Playwright runtime and Chromium browser
    python -m playwright install-deps chromium && \
    python -m playwright install chromium

# ------------------------------------------------------------------------------
# Copy backend application
# ------------------------------------------------------------------------------
COPY backend/ ./backend/

# ------------------------------------------------------------------------------
# Copy built frontend from builder stage to Nginx web root
# ------------------------------------------------------------------------------
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# ------------------------------------------------------------------------------
# Nginx configuration (serve SPA and reverse proxy /api and /audio to backend)
# ------------------------------------------------------------------------------
# Remove default site if present
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf || true

# Write Nginx config
RUN set -eux; \
    cat > /etc/nginx/conf.d/app.conf <<'NGINX_CONF'
server {
    listen 80;
    server_name _;

    # Serve frontend static files
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression for text assets
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss image/svg+xml;
    gzip_min_length 256;

    # Caching for static assets (adjust as needed)
    location ~* \.(?:css|js|map|woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    # SPA fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy to FastAPI backend for API routes
    location /api/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:8000;
    }

    # Reverse proxy for audio files served by FastAPI StaticFiles mount
    location /audio/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8000;
    }
}
NGINX_CONF

# Ensure runtime dirs exist
RUN mkdir -p /var/log/supervisor /var/run/nginx /app/audio_files

# ------------------------------------------------------------------------------
# Supervisor configuration to run Nginx + Uvicorn in one container
# ------------------------------------------------------------------------------
RUN set -eux; \
    cat > /etc/supervisor/conf.d/app.conf <<'SUPERVISOR_CONF'
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
childlogdir=/var/log/supervisor

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autorestart=true
priority=10
stdout_logfile=/var/log/supervisor/nginx-stdout.log
stderr_logfile=/var/log/supervisor/nginx-stderr.log
startsecs=2
stopasgroup=true
killasgroup=true

[program:uvicorn]
directory=/app/backend
# Bind only to localhost; Nginx will proxy from :80 -> :8000
command=python -m uvicorn app.main:app --host ${BACKEND_HOST} --port ${BACKEND_PORT}
autorestart=true
priority=20
stdout_logfile=/var/log/supervisor/uvicorn-stdout.log
stderr_logfile=/var/log/supervisor/uvicorn-stderr.log
startsecs=2
stopasgroup=true
killasgroup=true
SUPERVISOR_CONF

# ------------------------------------------------------------------------------
# Healthcheck via the backend health endpoint exposed through Nginx
# ------------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1/api/health || exit 1

EXPOSE 80

# ------------------------------------------------------------------------------
# Start both Nginx and Uvicorn via Supervisor
# ------------------------------------------------------------------------------
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/app.conf"]
