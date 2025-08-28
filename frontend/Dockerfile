# Stage 1: Build the frontend application
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package manifests and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build production assets
RUN npm run build

# Stage 2: Serve the built assets with Nginx
FROM nginx:1.25.3-alpine

# Set the working directory for Nginx
WORKDIR /usr/share/nginx/html

# Remove default Nginx welcome page
RUN rm -rf ./*

# Copy the built assets from the builder stage
COPY --from=frontend-builder /app/frontend/dist .

# Expose port 80 to serve the application
EXPOSE 80

# Run Nginx to serve the static files
CMD ["nginx", "-g", "daemon off;"]
