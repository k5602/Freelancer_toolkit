#!/bin/bash
# Exit on error
set -e
# Backend setup
echo "Setting up backend..."
cd backend
pip install -r requirements.txt
cd ..
# Frontend setup
echo "Setting up frontend..."
cd frontend
npm install
cd ..
# Create .env file
echo "Creating .env file..."
cd backend
if [ ! -f .env ]; then
    echo "PERPLEXITY_API_KEY=your_perplexity_api_key" > .env
    echo "ELEVENLABS_API_KEY=your_elevenlabs_api_key" >> .env
fi
cd ..
echo "Setup complete!"
