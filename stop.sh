#!/bin/bash

# Modern Dashboard - Stop Script
# Stops both frontend and backend services

PROJECT_DIR="/var/www/cas"
PID_DIR="$PROJECT_DIR/.pids"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Modern Dashboard - Stopping Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to stop a service
stop_service() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"
    
    if [ ! -f "$pid_file" ]; then
        echo -e "${YELLOW}⚠ ${service^} is not running (no PID file)${NC}"
        return 0
    fi
    
    local pid=$(cat "$pid_file")
    
    if ! ps -p $pid > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ ${service^} process not found (PID: $pid)${NC}"
        rm -f "$pid_file"
        return 0
    fi
    
    echo -e "${BLUE}Stopping ${service^}...${NC}"
    echo -e "   PID: $pid"
    
    # Try graceful shutdown first
    kill $pid 2>/dev/null
    
    # Wait up to 10 seconds for graceful shutdown
    for i in {1..10}; do
        if ! ps -p $pid > /dev/null 2>&1; then
            echo -e "${GREEN}✓ ${service^} stopped gracefully${NC}"
            rm -f "$pid_file"
            return 0
        fi
        sleep 1
    done
    
    # Force kill if still running
    echo -e "${YELLOW}   Forcing shutdown...${NC}"
    kill -9 $pid 2>/dev/null
    
    if ! ps -p $pid > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${service^} stopped (forced)${NC}"
        rm -f "$pid_file"
        return 0
    else
        echo -e "${RED}✗ Failed to stop ${service^}${NC}"
        return 1
    fi
}

# Stop services
stop_service "frontend"
echo ""
stop_service "backend"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "To start services again, run: ${YELLOW}./start.sh${NC}"
echo ""
