# syntax=docker/dockerfile:1.6
FROM python:3.12-slim AS base

# ---- Runtime env ----
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    AUDIO_STORAGE_PATH=/app/audio_files

WORKDIR /app

# ---- System deps (for Chromium/Playwright and FastAPI runtime) ----
# We install this set of libraries required to run headless Chromium reliably
# in most container platforms (Railway/containers).
RUN --mount=type=cache,target=/var/cache/apt \
    set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    procps \
    # Headless Chromium/Playwright deps
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

# ---- Python deps ----
COPY ./requirements.txt ./requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Install Playwright browsers + system deps ----
# Install the necessary system deps and Chromium browser for Playwright at build-time
# to avoid doing it at runtime. Keep in this order so playwright CLI is available.
RUN set -eux; \
    python -m playwright install-deps chromium; \
    python -m playwright install chromium

# ---- Create non-root user and prepare filesystem ----
ARG APP_USER=appuser
ARG APP_UID=10001
ARG APP_GID=10001
RUN set -eux; \
    groupadd -r -g "${APP_GID}" "${APP_USER}" && \
    useradd -r -m -d "/home/${APP_USER}" -u "${APP_UID}" -g "${APP_GID}" "${APP_USER}" && \
    mkdir -p /app/audio_files && \
    mkdir -p "${PLAYWRIGHT_BROWSERS_PATH}" && \
    chown -R "${APP_UID}:${APP_GID}" /app "${PLAYWRIGHT_BROWSERS_PATH}" "/home/${APP_USER}"

USER ${APP_USER}

# ---- App source ----
# Copy backend app source last to maximize caching of deps layers.
COPY . .

EXPOSE 8000

# ---- Healthcheck ----
# the FastAPI service provides /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:8000/health || exit 1

# ---- Run ----
# Use uvicorn to serve FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
