#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logo
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Smart Attendance System - Automated Setup            ║
║     Version 1.0.0                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running in project root
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# =============================================================================
# STEP 1: Check Prerequisites
# =============================================================================

print_section "STEP 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "$PYTHON_VERSION installed"
else
    print_error "Python3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "$DOCKER_VERSION installed"
else
    print_warning "Docker not found. You'll need to run PostgreSQL manually"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "$COMPOSE_VERSION installed"
fi

# =============================================================================
# STEP 2: Create Environment Files
# =============================================================================

print_section "STEP 2: Creating Environment Files"

# Root .env
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << 'EOF'
POSTGRES_DB=attendance
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_PORT=5432
REDIS_PORT=6379
N8N_PORT=5678
N8N_USER=admin
N8N_PASSWORD=admin123
BACKEND_PORT=3000
FRONTEND_PORT=5173
FACE_SERVICE_PORT=8000
EOF
    print_success "Created root .env file"
else
    print_warning "Root .env already exists, skipping"
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env 2>/dev/null
    print_success "Created backend/.env file"
    print_warning "Please update AWS credentials in backend/.env"
else
    print_warning "backend/.env already exists, skipping"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env 2>/dev/null
    print_success "Created frontend/.env file"
else
    print_warning "frontend/.env already exists, skipping"
fi

# Face Service .env
if [ ! -f "face-service/.env" ]; then
    cp face-service/.env.example face-service/.env 2>/dev/null
    print_success "Created face-service/.env file"
else
    print_warning "face-service/.env already exists, skipping"
fi

# =============================================================================
# STEP 3: Install Backend Dependencies
# =============================================================================

print_section "STEP 3: Installing Backend Dependencies"

cd backend
if [ -f "package.json" ]; then
    echo "Installing Node.js packages..."
    npm install
    print_success "Backend dependencies installed"
else
    print_error "backend/package.json not found"
fi
cd ..

# =============================================================================
# STEP 4: Install Frontend Dependencies
# =============================================================================

print_section "STEP 4: Installing Frontend Dependencies"

cd frontend
if [ -f "package.json" ]; then
    echo "Installing Node.js packages..."
    npm install
    
    # Initialize Tailwind if not already done
    if [ ! -f "tailwind.config.js" ]; then
        npx tailwindcss init -p
        print_success "Tailwind CSS initialized"
    fi
    
    print_success "Frontend dependencies installed"
else
    print_error "frontend/package.json not found"
fi
cd ..

# =============================================================================
# STEP 5: Setup Python Virtual Environment
# =============================================================================

print_section "STEP 5: Setting Up Face Recognition Service"

cd face-service

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate and install dependencies
echo "Installing Python packages..."
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

if [ -f "requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Face service dependencies installed"
    
    # Download ML models
    echo "Downloading ML models (this may take a few minutes)..."
    python3 -c "from facenet_pytorch import MTCNN, InceptionResnetV1; MTCNN(); InceptionResnetV1(pretrained='vggface2')"
    print_success "ML models downloaded"
else
    print_error "requirements.txt not found"
fi

deactivate 2>/dev/null

cd ..

# =============================================================================
# STEP 6: Setup Database
# =============================================================================

print_section "STEP 6: Setting Up Database"

if command -v docker &> /dev/null; then
    # Check if PostgreSQL container exists
    if docker ps -a | grep -q attendance-postgres; then
        print_warning "PostgreSQL container already exists"
        
        # Start if not running
        if ! docker ps | grep -q attendance-postgres; then
            docker start attendance-postgres
            print_success "Started existing PostgreSQL container"
        fi
    else
        # Start PostgreSQL with docker-compose
        echo "Starting PostgreSQL..."
        docker-compose up -d postgres
        sleep 5
        print_success "PostgreSQL started"
    fi
    
    # Initialize database
    if [ -f "database/schema.sql" ]; then
        echo "Initializing database schema..."
        docker exec -i attendance-postgres psql -U postgres attendance < database/schema.sql 2>/dev/null
        print_success "Database schema created"
    fi
    
    # Seed database
    if [ -f "database/seed.sql" ]; then
        echo "Seeding database with demo data..."
        docker exec -i attendance-postgres psql -U postgres attendance < database/seed.sql 2>/dev/null
        print_success "Database seeded with demo data"
    fi
else
    print_warning "Docker not available. Please setup PostgreSQL manually"
    print_warning "Connection: postgresql://postgres:postgres123@localhost:5432/attendance"
fi

# =============================================================================
# STEP 7: Create Logs Directory
# =============================================================================

print_section "STEP 7: Creating Directories"

mkdir -p backend/logs
mkdir -p face-service/logs
mkdir -p database/backups
print_success "Log directories created"

# =============================================================================
# STEP 8: Make Scripts Executable
# =============================================================================

print_section "STEP 8: Setting Script Permissions"

chmod +x scripts/*.sh 2>/dev/null
print_success "Scripts are now executable"

# =============================================================================
# COMPLETION
# =============================================================================

echo -e "\n${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ✓ Setup Completed Successfully!                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Next Steps:${NC}\n"
echo -e "  1. Update AWS credentials in backend/.env"
echo -e "  2. Start all services: ${GREEN}./scripts/start-dev.sh${NC}"
echo -e "  3. Access the application:"
echo -e "     - Frontend: ${YELLOW}http://localhost:5173${NC}"
echo -e "     - Backend API: ${YELLOW}http://localhost:3000${NC}"
echo -e "     - Face Service: ${YELLOW}http://localhost:8000${NC}"
echo -e "     - n8n: ${YELLOW}http://localhost:5678${NC} (admin/admin123)"
echo -e "\n  4. Demo Login:"
echo -e "     - Email: ${YELLOW}teacher@demo.com${NC}"
echo -e "     - Password: ${YELLOW}teacher123${NC}"
echo -e "\n${BLUE}Documentation:${NC}"
echo -e "  - Setup Guide: docs/SETUP.md"
echo -e "  - API Docs: docs/API.md"
echo -e "  - Demo Script: docs/DEMO.md"
echo ""