@echo off
REM SENTINEL-X Docker Startup Script for Windows
REM Makes it easy to start the entire system with proper checks

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          SENTINEL-X Docker Startup Script                  ║
echo ║      Deepfake Detection ^& Authenticity Verification        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Docker is installed
echo [1/4] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed
    echo Please install Docker from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
for /f "tokens=*" %%a in ('docker --version') do set dockerVersion=%%a
echo [OK] Docker found: %dockerVersion%

REM Check if Docker Compose is installed
echo [2/4] Checking Docker Compose installation...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed or not working
    echo Ensure you have Docker Desktop or Docker Compose v2+ installed
    pause
    exit /b 1
)
echo [OK] Docker Compose found

REM Check if .env.local exists
echo [3/4] Checking environment configuration...
if not exist ".env.local" (
    echo WARNING: .env.local not found
    if exist ".env" (
        echo Creating .env.local from .env...
        copy .env .env.local >nul
        echo [OK] Created .env.local
    ) else (
        echo ERROR: No environment file found (.env or .env.local)
        pause
        exit /b 1
    )
) else (
    echo [OK] .env.local exists
)

REM Check for docker-compose.yml
echo [4/4] Checking Docker Compose manifest...
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found
    pause
    exit /b 1
)
echo [OK] docker-compose.yml found

echo.
echo ════════════════════════════════════════════════════════════
echo All pre-flight checks passed!
echo ════════════════════════════════════════════════════════════
echo.

REM Check if services are already running
echo Checking if services are already running...
docker ps --format "table {{.Names}}" 2>nul | findstr /i deepfake >nul
if errorlevel 0 (
    echo WARNING: Some SENTINEL-X services may already be running
    echo.
    choice /C 123 /N /M "Restart services (1), Continue (2), or Exit (3)? "

    if errorlevel 3 (
        exit /b 0
    )
    if errorlevel 1 (
        echo.
        echo Stopping existing services...
        docker compose down
        timeout /t 2 /nobreak
    )
)

echo.
echo Starting SENTINEL-X services...
echo.
echo Access the application at:
echo   Frontend:    http://localhost:3002
echo   Backend API: http://localhost:3001/api
echo   ML Service:  http://localhost:5001/health
echo.

docker compose up

pause
