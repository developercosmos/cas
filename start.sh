#!/bin/bash

# Modern Dashboard - Start Script
# Starts both frontend and backend on static ports

set -e

PROJECT_DIR="/var/www/cas"
PID_DIR="$PROJECT_DIR/.pids"
LOG_DIR="$PROJECT_DIR/.logs"

BACKEND_PORT=4000
FRONTEND_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$PID_DIR"
mkdir -p "$LOG_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Modern Dashboard - Starting Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to check if service is already running
check_running() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Check if backend is already running
if check_running "backend"; then
    echo -e "${YELLOW}⚠ Backend is already running${NC}"
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    echo -e "   PID: $BACKEND_PID"
else
    # Check if port is in use by another process
    if check_port $BACKEND_PORT; then
        echo -e "${RED}✗ Port $BACKEND_PORT is already in use by another process${NC}"
        echo -e "  Run: ${YELLOW}lsof -i :$BACKEND_PORT${NC} to see what's using it"
        exit 1
    fi
    
    echo -e "${BLUE}Starting Backend...${NC}"
    cd "$PROJECT_DIR/backend"
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠ .env file not found, creating from .env.example${NC}"
        cp .env.example .env
    fi
    
    # Start backend in background
    npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_DIR/backend.pid"
    
    # Wait for backend to start
    echo -n "   Waiting for backend to start"
    for i in {1..30}; do
        if check_port $BACKEND_PORT; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if ! check_port $BACKEND_PORT; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}✗ Backend failed to start. Check logs: $LOG_DIR/backend.log${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Backend started successfully${NC}"
    echo -e "   PID: $BACKEND_PID"
    echo -e "   Port: $BACKEND_PORT"
    echo -e "   URL: http://localhost:$BACKEND_PORT"
    echo -e "   Logs: $LOG_DIR/backend.log"
fi

echo ""

# Check if frontend is already running
if check_running "frontend"; then
    echo -e "${YELLOW}⚠ Frontend is already running${NC}"
    FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
    echo -e "   PID: $FRONTEND_PID"
else
    # Check if port is in use by another process
    if check_port $FRONTEND_PORT; then
        echo -e "${RED}✗ Port $FRONTEND_PORT is already in use by another process${NC}"
        echo -e "  Run: ${YELLOW}lsof -i :$FRONTEND_PORT${NC} to see what's using it"
        exit 1
    fi
    
    echo -e "${BLUE}Starting Frontend...${NC}"
    cd "$PROJECT_DIR/frontend"
    
    # Start frontend in background
    npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PID_DIR/frontend.pid"
    
    # Wait for frontend to start
    echo -n "   Waiting for frontend to start"
    for i in {1..30}; do
        if check_port $FRONTEND_PORT; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    if ! check_port $FRONTEND_PORT; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}✗ Frontend failed to start. Check logs: $LOG_DIR/frontend.log${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Frontend started successfully${NC}"
    echo -e "   PID: $FRONTEND_PID"
    echo -e "   Port: $FRONTEND_PORT"
    echo -e "   URL: http://localhost:$FRONTEND_PORT"
    echo -e "   Logs: $LOG_DIR/frontend.log"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All Services Running Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Detect network IP addresses
NETWORK_IPS=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$' | head -3)

echo -e "${BLUE}Access the application:${NC}"
echo ""
echo -e "${BLUE}Local Access:${NC}"
echo -e "  🌐 Dashboard:  ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  🔌 API:        ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "  ❤️  Health:     ${GREEN}http://localhost:$BACKEND_PORT/health${NC}"
echo ""

if [ -n "$NETWORK_IPS" ]; then
    echo -e "${BLUE}Network Access (from other devices):${NC}"
    for ip in $NETWORK_IPS; do
        echo -e "  🌐 Dashboard:  ${GREEN}http://${ip}:$FRONTEND_PORT${NC}"
        echo -e "  🔌 API:        ${GREEN}http://${ip}:$BACKEND_PORT${NC}"
    done
    echo ""
fi

echo -e "${BLUE}Credentials:${NC}"
echo -e "  Check backend configuration for default credentials"
echo ""
echo -e "${BLUE}Management:${NC}"
echo -e "  Stop services:   ${YELLOW}./stop.sh${NC}"
echo -e "  Check status:    ${YELLOW}./status.sh${NC}"
echo -e "  View logs:       ${YELLOW}tail -f .logs/frontend.log${NC}"
echo -e "                   ${YELLOW}tail -f .logs/backend.log${NC}"
echo ""
echo -e "${YELLOW}Note: Application is accessible from the network.${NC}"
echo -e "${YELLOW}      Make sure firewall allows ports $FRONTEND_PORT and $BACKEND_PORT.${NC}"
echo ""
