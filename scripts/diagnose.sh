#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Running Smart Attendance System Diagnostics..."
echo ""

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ $(node --version)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check npm
echo -n "npm: "
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ $(npm --version)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check Python
echo -n "Python: "
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ $(python3 --version)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check Docker
echo -n "Docker: "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ $(docker --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

echo ""
echo "📦 Checking Project Structure..."

# Check backend
if [ -d "backend" ]; then
    echo -n "backend/: "
    if [ -f "backend/package.json" ]; then
        echo -e "${GREEN}✓ Found${NC}"
        if [ -d "backend/node_modules" ]; then
            echo "  └─ node_modules: ${GREEN}✓ Installed${NC}"
        else
            echo "  └─ node_modules: ${RED}✗ Missing${NC}"
        fi
    else
        echo -e "${RED}✗ package.json missing${NC}"
    fi
fi

# Check frontend
if [ -d "frontend" ]; then
    echo -n "frontend/: "
    if [ -f "frontend/package.json" ]; then
        echo -e "${GREEN}✓ Found${NC}"
        if [ -d "frontend/node_modules" ]; then
            echo "  └─ node_modules: ${GREEN}✓ Installed${NC}"
        else
            echo "  └─ node_modules: ${RED}✗ Missing${NC}"
        fi
    else
        echo -e "${RED}✗ package.json missing${NC}"
    fi
fi

# Check face-service
if [ -d "face-service" ]; then
    echo -n "face-service/: "
    if [ -f "face-service/requirements.txt" ]; then
        echo -e "${GREEN}✓ Found${NC}"
        if [ -d "face-service/venv" ]; then
            echo "  └─ venv: ${GREEN}✓ Created${NC}"
        else
            echo "  └─ venv: ${RED}✗ Missing${NC}"
        fi
    else
        echo -e "${RED}✗ requirements.txt missing${NC}"
    fi
fi

echo ""
echo "🐳 Checking Docker Services..."

# Check PostgreSQL
if docker ps | grep -q attendance-postgres; then
    echo -e "PostgreSQL: ${GREEN}✓ Running${NC}"
else
    echo -e "PostgreSQL: ${RED}✗ Not running${NC}"
fi

echo ""
echo "🔌 Checking Ports..."

# Check if ports are in use
for port in 3000 5173 8000 5432; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "Port $port: ${YELLOW}⚠ In use${NC}"
    else
        echo -e "Port $port: ${GREEN}✓ Available${NC}"
    fi
done

echo ""
echo "📁 Checking Configuration Files..."

# Check .env files
for file in ".env" "backend/.env" "frontend/.env" "face-service/.env"; do
    if [ -f "$file" ]; then
        echo -e "$file: ${GREEN}✓ Exists${NC}"
    else
        echo -e "$file: ${RED}✗ Missing${NC}"
    fi
done

echo ""
echo "Diagnostics complete!"