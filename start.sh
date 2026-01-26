#!/bin/bash

# Deepfake Detection System - Startup Script
# This script starts all services: Frontend, Backend, ML Service, and MongoDB

set -e  # Exit on error

echo "=========================================="
echo "  SENTINEL-X Deepfake Detection System"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}[1/5]${NC} Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if docker-compose is available
echo -e "${BLUE}[2/5]${NC} Checking docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose is available${NC}"
echo ""

# Stop any existing containers
echo -e "${BLUE}[3/5]${NC} Stopping existing containers..."
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✓ Cleaned up existing containers${NC}"
echo ""

# Start all services
echo -e "${BLUE}[4/5]${NC} Starting all services..."
echo -e "${YELLOW}This may take a few minutes on first run...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo ""
echo -e "${BLUE}[5/5]${NC} Waiting for services to be ready..."
echo -e "${YELLOW}Checking health status...${NC}"

# Wait up to 60 seconds for services to start
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    # Check if all containers are running
    RUNNING=$(docker-compose ps --services --filter "status=running" | wc -l)
    TOTAL=$(docker-compose ps --services | wc -l)
    
    if [ "$RUNNING" -eq "$TOTAL" ]; then
        break
    fi
    
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    echo -n "."
done
echo ""

# Display service status
echo ""
echo -e "${GREEN}=========================================="
echo "  Services Status"
echo -e "==========================================${NC}"
docker-compose ps
echo ""

# Display access URLs
echo -e "${GREEN}=========================================="
echo "  Access URLs"
echo -e "==========================================${NC}"
echo -e "${BLUE}Frontend:${NC}    http://localhost:3002"
echo -e "${BLUE}Backend API:${NC} http://localhost:3001"
echo -e "${BLUE}ML Service:${NC}  http://localhost:5001"
echo -e "${BLUE}MongoDB:${NC}     mongodb://localhost:27018"
echo ""

# Check service health
echo -e "${GREEN}=========================================="
echo "  Health Checks"
echo -e "==========================================${NC}"

# Check Frontend
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is starting...${NC}"
fi

# Check Backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Backend is starting...${NC}"
fi

# Check ML Service
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ML Service is healthy${NC}"
else
    echo -e "${YELLOW}⚠ ML Service is starting...${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  System Started Successfully!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}To view logs:${NC}       docker-compose logs -f"
echo -e "${BLUE}To stop system:${NC}    docker-compose down"
echo -e "${BLUE}To restart:${NC}        ./start.sh"
echo ""
echo -e "${YELLOW}Note: Services may take 30-60 seconds to be fully ready.${NC}"
echo -e "${YELLOW}If you see errors, wait a moment and refresh your browser.${NC}"
echo ""
