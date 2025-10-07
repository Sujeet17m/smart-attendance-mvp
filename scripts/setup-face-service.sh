#!/bin/bash

echo "🚀 Setting up Face Recognition Service..."

# Navigate to face-service directory
cd face-service || exit 1

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download face detection models
echo "📥 Downloading face detection models..."
python scripts/download_models.py

# Create necessary directories
mkdir -p logs app/models

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Run database migrations
echo "🗄️  Setting up database tables..."
psql -h localhost -U postgres -d smart_attendance -f database_schema.sql

echo "✅ Face Recognition Service setup complete!"
echo ""
echo "To start the service:"
echo "  cd face-service"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --host 0.0.0.0 --port 8002 --reload"