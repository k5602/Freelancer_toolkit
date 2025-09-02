# Stage 1: Final image
# Use the official Playwright Python image
FROM mcr.microsoft.com/playwright/python:v1.49.1-jammy AS final

# Runtime environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    BACKEND_HOST=127.0.0.1 \
    BACKEND_PORT=8000 \
    AUDIO_STORAGE_PATH=/app/audio_files

# Set the working directory
WORKDIR /app

# ------------------------------------------------------------------------------
# System dependencies
# ------------------------------------------------------------------------------
# The Playwright image comes with most dependencies pre-installed,
# but we still need nginx and supervisor
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nginx \
    supervisor && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ------------------------------------------------------------------------------
# Python dependencies
# ------------------------------------------------------------------------------
COPY requirements.txt ./
RUN pip install --no-cache-dir -r ./requirements.txt

# ------------------------------------------------------------------------------
# Copy backend application files
# ------------------------------------------------------------------------------
COPY . ./

# Nginx config
RUN rm -f /etc/nginx/conf.d/default.conf || true
RUN set -eux; \
    cat > /etc/nginx/conf.d/app.conf <<'NGINX_CONF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss image/svg+xml;
    gzip_min_length 256;

    location ~* \.(?:css|js|map|woff2?|ttf|eot|otf|svg|png|jpg|jpeg|gif)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:8000;
    }

    location /audio/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:8000;
    }
}
NGINX_CONF

# ------------------------------------------------------------------------------
# Supervisor config
# ------------------------------------------------------------------------------
RUN mkdir -p /var/log/supervisor /var/run/nginx /app/audio_files
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
directory=/app
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
# Healthcheck
# ------------------------------------------------------------------------------
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1/api/health || exit 1

EXPOSE 80

# Start both Nginx and Uvicorn
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/app.conf"]
