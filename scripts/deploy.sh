#!/bin/bash
set -e

# Frontend build
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Backend Docker build
echo "Building backend Docker image..."
cd backend
docker build -t freelancer-toolkit-backend .
cd ..

echo "Running Docker container..."
docker run -d -p 8000:8000 --env-file backend/.env freelancer-toolkit-backend

echo "Deployment complete!"
