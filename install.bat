@echo off
echo ========================================
echo Multi-Website Management System
echo Automated Setup Script
echo ========================================
echo.

REM Check Node.js
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found
echo.

REM Check npm
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo ✓ npm found
echo.

REM Install root dependencies
echo [3/6] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo ✓ Root dependencies installed
echo.

REM Install backend dependencies
echo [4/6] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Backend dependencies installed
echo.

REM Install frontend dependencies
echo [5/6] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Frontend dependencies installed
echo.

REM Check MongoDB
echo [6/6] Checking MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MongoDB not detected
    echo Please ensure MongoDB is installed and running
    echo Download from: https://www.mongodb.com/try/download/community
    echo.
) else (
    echo ✓ MongoDB found
    echo.
)

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update .env file with your SMTP credentials
echo 2. Ensure MongoDB is running
echo 3. Run: npm run seed (to populate database)
echo 4. Run: npm run dev (to start the application)
echo.
echo For detailed instructions, see QUICKSTART.md
echo ========================================
echo.
pause
