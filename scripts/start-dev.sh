#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}Starting Smart Attendance System...${NC}\n"

# Start PostgreSQL
if command -v docker &> /dev/null; then
    if ! docker ps | grep -q attendance-postgres; then
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        docker-compose up -d postgres
        sleep 3
    fi
    echo -e "${GREEN}✓${NC} PostgreSQL running"
fi

# Start Redis (optional)
if docker ps -a | grep -q attendance-redis; then
    if ! docker ps | grep -q attendance-redis; then
        docker start attendance-redis
    fi
    echo -e "${GREEN}✓${NC} Redis running"
fi

# Start Backend
echo -e "${YELLOW}Starting Backend API...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
sleep 2
echo -e "${GREEN}✓${NC} Backend API started (PID: $BACKEND_PID)"

# Start Face Service
echo -e "${YELLOW}Starting Face Recognition Service...${NC}"
cd face-service
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
python main.py &
FACE_PID=$!
deactivate 2>/dev/null
cd ..
sleep 2
echo -e "${GREEN}✓${NC} Face Service started (PID: $FACE_PID)"

# Start Frontend
echo -e "${YELLOW}Starting Frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
sleep 2
echo -e "${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID)"

# Print access URLs
echo -e "\n${BLUE}════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Smart Attendance System - Running${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}\n"
echo -e "  Frontend:     ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Face Service: ${GREEN}http://localhost:8000${NC}"
echo -e "  Health Check: ${GREEN}http://localhost:3000/health${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Store PIDs
echo "$BACKEND_PID $FACE_PID $FRONTEND_PID" > .pids

# Wait for interrupt
trap "kill $BACKEND_PID $FACE_PID $FRONTEND_PID 2>/dev/null; docker-compose stop 2>/dev/null; rm -f .pids; echo -e '\n${GREEN}All services stopped${NC}'; exit" INT TERM

wait