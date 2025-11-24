#!/bin/bash

# Modern Dashboard - Status Script
# Shows status of frontend and backend services

PROJECT_DIR="/var/www/cas"
PID_DIR="$PROJECT_DIR/.pids"

BACKEND_PORT=4000
FRONTEND_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Modern Dashboard - Service Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check service status
check_service_status() {
    local service=$1
    local port=$2
    local pid_file="$PID_DIR/${service}.pid"
    
    echo -e "${BLUE}${service^} Service:${NC}"
    
    # Check PID file
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo -e "   PID File: ${GREEN}Found${NC} ($pid)"
        
        # Check if process is running
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "   Process:  ${GREEN}Running${NC}"
            
            # Get process info
            local cpu=$(ps -p $pid -o %cpu --no-headers | tr -d ' ')
            local mem=$(ps -p $pid -o %mem --no-headers | tr -d ' ')
            local uptime=$(ps -p $pid -o etime --no-headers | tr -d ' ')
            
            echo -e "   CPU:      ${cpu}%"
            echo -e "   Memory:   ${mem}%"
            echo -e "   Uptime:   ${uptime}"
        else
            echo -e "   Process:  ${RED}Not Running${NC} (stale PID)"
        fi
    else
        echo -e "   PID File: ${YELLOW}Not Found${NC}"
        echo -e "   Process:  ${RED}Not Running${NC}"
    fi
    
    # Check port
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        local port_pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        echo -e "   Port $port: ${GREEN}In Use${NC} (PID: $port_pid)"
        
        # Test HTTP endpoint
        if command -v curl &> /dev/null; then
            if [ "$service" = "backend" ]; then
                if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" 2>/dev/null | grep -q "200"; then
                    echo -e "   Health:   ${GREEN}OK${NC}"
                else
                    echo -e "   Health:   ${YELLOW}Unknown${NC}"
                fi
            fi
        fi
    else
        echo -e "   Port $port: ${RED}Not In Use${NC}"
    fi
    
    echo ""
}

# Check both services
check_service_status "backend" $BACKEND_PORT
check_service_status "frontend" $FRONTEND_PORT

# Overall status
echo -e "${BLUE}========================================${NC}"

# Count running services
RUNNING=0
if [ -f "$PID_DIR/backend.pid" ] && ps -p $(cat "$PID_DIR/backend.pid") > /dev/null 2>&1; then
    ((RUNNING++))
fi
if [ -f "$PID_DIR/frontend.pid" ] && ps -p $(cat "$PID_DIR/frontend.pid") > /dev/null 2>&1; then
    ((RUNNING++))
fi

if [ $RUNNING -eq 2 ]; then
    echo -e "${GREEN}Status: All Services Running (2/2)${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  🌐 Dashboard:  ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  🔌 API:        ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  ❤️  Health:     ${GREEN}http://localhost:$BACKEND_PORT/health${NC}"
elif [ $RUNNING -eq 1 ]; then
    echo -e "${YELLOW}Status: Partial (1/2 services running)${NC}"
elif [ $RUNNING -eq 0 ]; then
    echo -e "${RED}Status: All Services Stopped${NC}"
    echo ""
    echo -e "To start services, run: ${YELLOW}./start.sh${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo ""

# Show management commands
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  Start services:  ${YELLOW}./start.sh${NC}"
echo -e "  Stop services:   ${YELLOW}./stop.sh${NC}"
echo -e "  Restart:         ${YELLOW}./restart.sh${NC}"
echo -e "  View logs:       ${YELLOW}tail -f .logs/frontend.log${NC}"
echo -e "                   ${YELLOW}tail -f .logs/backend.log${NC}"
echo ""
