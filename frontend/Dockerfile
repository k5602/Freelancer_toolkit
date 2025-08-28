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
