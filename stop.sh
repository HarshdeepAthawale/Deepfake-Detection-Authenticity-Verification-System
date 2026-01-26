#!/bin/bash

# Deepfake Detection System - Stop Script
# This script stops all running services

set -e

echo "=========================================="
echo "  Stopping SENTINEL-X System"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Stopping all containers...${NC}"
docker-compose down

echo ""
echo -e "${GREEN}✓ All services stopped successfully${NC}"
echo ""
echo "To start again, run: ./start.sh"
echo ""
