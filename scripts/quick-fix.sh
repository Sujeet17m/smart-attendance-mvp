#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔧 Quick Fix Script - Repairing Smart Attendance System"
echo ""

# Kill any existing processes
echo "Stopping any running services..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "python.*main.py" 2>/dev/null || true
echo -e "${GREEN}✓ Processes stopped${NC}"

# Fix Backend
echo ""
echo "Fixing Backend..."
cd backend

# Remove node_modules and reinstall
if [ -d "node_modules" ]; then
    echo "Removing old node_modules..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies
npm install --legacy-peer-deps

# Create necessary directories
mkdir -p logs src/config src/routes src/controllers src/services src/middleware src/utils src/database/seeds

echo -e "${GREEN}✓ Backend fixed${NC}"
cd ..

# Fix Frontend
echo ""
echo "Fixing Frontend..."
cd frontend

# Remove node_modules and reinstall
if [ -d "node_modules" ]; then
    echo "Removing old node_modules..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies
npm install --legacy-peer-deps

# Create necessary directories
mkdir -p src/components src/pages src/services src/hooks src/context src/utils

echo -e "${GREEN}✓ Frontend fixed${NC}"
cd ..

# Fix Face Service
echo ""
echo "Fixing Face Service..."
cd face-service

# Remove venv and recreate
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create virtual environment
python3 -m venv venv

# Activate and install
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate

pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✓ Face Service fixed${NC}"
deactivate
cd ..

# Fix Database
echo ""
echo "Fixing Database..."

# Stop and remove old container
docker stop attendance-postgres 2>/dev/null || true
docker rm attendance-postgres 2>/dev/null || true

# Start fresh PostgreSQL
docker run -d \
  --name attendance-postgres \
  -e POSTGRES_DB=attendance \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  postgres:15-alpine

echo "Waiting for PostgreSQL to start..."
sleep 5

echo -e "${GREEN}✓ Database fixed${NC}"

echo ""
echo -e "${GREEN}✓ All fixes applied!${NC}"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/start-dev.sh"
echo "2. Wait 10 seconds for all services to start"
echo "3. Check: http://localhost:5173"