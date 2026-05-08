#!/bin/bash
# SENTINEL-X Docker Startup Script
# Makes it easy to start the entire system with proper checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          SENTINEL-X Docker Startup Script                  ║"
echo "║      Deepfake Detection & Authenticity Verification        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is installed
echo -e "${YELLOW}[1/4]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

# Check if Docker Compose is installed
echo -e "${YELLOW}[2/4]${NC} Checking Docker Compose installation..."
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed or not working${NC}"
    echo "Ensure you have Docker Desktop or Docker Compose v2+ installed"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found$(NC}"

# Check if .env.local exists
echo -e "${YELLOW}[3/4]${NC} Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local not found${NC}"
    echo "Creating .env.local from template..."
    if [ -f ".env" ]; then
        cp .env .env.local
        echo -e "${GREEN}✓ Created .env.local from .env${NC}"
    else
        echo -e "${RED}✗ No environment file found (.env or .env.local)${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env.local exists${NC}"
fi

# Check for docker-compose.yml
echo -e "${YELLOW}[4/4]${NC} Checking Docker Compose manifest..."
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose.yml found${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All pre-flight checks passed!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if services are already running
echo -e "${YELLOW}Checking if services are already running...${NC}"
if docker ps --format '{{.Names}}' | grep -q deepfake-; then
    echo -e "${YELLOW}⚠ Some SENTINEL-X services are already running${NC}"
    echo ""
    echo "Options:"
    echo "  1) Restart services (stop + start)"
    echo "  2) Continue with existing services"
    echo "  3) Exit"
    read -p "Choose [1-3]: " choice

    if [ "$choice" = "1" ]; then
        echo -e "${YELLOW}Stopping existing services...${NC}"
        docker compose down
        sleep 2
    elif [ "$choice" = "3" ]; then
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}🚀 Starting SENTINEL-X services...${NC}"
echo ""

# Start Docker Compose
docker compose up

