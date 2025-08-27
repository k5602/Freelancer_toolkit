# API Documentation

This document provides details on the API endpoints for the Freelancer Toolkit.

## Base URL

`http://localhost:8000/api`

## Endpoints

### Health Check

- **URL:** `/health`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

### Proposal Generator

- **URL:** `/proposal/generate`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "job_description": "string"
  }
  ```
- **Response:**
  ```json
  {
    "proposal_text": "string"
  }
  ```

### Voice Responder

- **URL:** `/voice/generate`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "text_to_speak": "string"
  }
  ```
- **Response:**
  ```json
  {
    "audio_url": "string"
  }
  ```

### Contract Generator

- **URL:** `/contract/generate`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "project_description": "string"
  }
  ```
- **Response:**
  ```json
  {
    "contract_text": "string"
  }
  ```

## Usage Notes

- All endpoints return errors in the format:
  ```json
  {
    "detail": "Error message"
  }
  ```
- API keys for Gemini and ElevenLabs must be set in `.env`.
- Audio files are served from `/audio/{filename}`.
