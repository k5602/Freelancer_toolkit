#!/bin/bash

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/../backend"
FRONTEND_DIR="${SCRIPT_DIR}/../frontend"

if [[ ! -d "${BACKEND_DIR}" ]]; then
  echo "[dev.sh] Backend directory not found: ${BACKEND_DIR}" >&2
  exit 1
fi
if [[ ! -d "${FRONTEND_DIR}" ]]; then
  echo "[dev.sh] Frontend directory not found: ${FRONTEND_DIR}" >&2
  exit 1
fi

BACKEND_PID=""
FRONTEND_PID=""

shutdown() {
  echo "\n[dev.sh] Shutting down..."
  if [[ -n "${FRONTEND_PID}" ]] && ps -p "${FRONTEND_PID}" > /dev/null 2>&1; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
    wait "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && ps -p "${BACKEND_PID}" > /dev/null 2>&1; then
    kill "${BACKEND_PID}" 2>/dev/null || true
    wait "${BACKEND_PID}" 2>/dev/null || true
  fi
}

trap shutdown EXIT SIGINT SIGTERM

# Start backend
echo "[dev.sh] Starting FastAPI backend on http://localhost:8000..."
(
  cd "${BACKEND_DIR}"
  if command -v uvicorn >/dev/null 2>&1; then
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  else
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  fi
) &
BACKEND_PID=$!

# Start frontend
echo "[dev.sh] Starting React frontend on http://localhost:5173..."
(
  cd "${FRONTEND_DIR}"
  # Add -- --host to expose on network if needed; for Vite config 
  npm run dev -- --host
) &
FRONTEND_PID=$!

echo "[dev.sh] Backend PID: ${BACKEND_PID}, Frontend PID: ${FRONTEND_PID}"
echo "[dev.sh] Press Ctrl+C to stop both."

wait ${BACKEND_PID} ${FRONTEND_PID}
