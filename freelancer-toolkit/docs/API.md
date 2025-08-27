# API Documentation

This document provides details on the API endpoints for the Freelancer Toolkit.
as i advance in development i will fill it out later

## Base URL

`http://localhost:8000/api`

## Endpoints

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
