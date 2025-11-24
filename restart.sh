#!/bin/bash

# Modern Dashboard - Restart Script
# Restarts both frontend and backend services

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Modern Dashboard - Restarting${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Stop services
"$SCRIPT_DIR/stop.sh"

echo ""
echo -e "${BLUE}Waiting 2 seconds before restart...${NC}"
sleep 2
echo ""

# Start services
"$SCRIPT_DIR/start.sh"
