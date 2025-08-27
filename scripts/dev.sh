#!/bin/bash

set -e

BACKEND_DIR="$(dirname "$0")/../backend"
FRONTEND_DIR="$(dirname "$0")/../frontend"

# Start backend
cd "$BACKEND_DIR"
echo "Starting FastAPI backend on http://localhost:8000..."
uvicorn app.main:app --reload &
BACKEND_PID=$!

# Start frontend
cd "$FRONTEND_DIR"
echo "Starting React frontend on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

# Trap Ctrl+C and kill both
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT

wait $BACKEND_PID $FRONTEND_PID
