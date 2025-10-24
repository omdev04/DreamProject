#!/bin/bash

echo "========================================"
echo "Multi-Website Management System"
echo "Automated Setup Script (Linux/Mac)"
echo "========================================"
echo ""

# Check Node.js
echo "[1/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"
echo ""

# Check npm
echo "[2/6] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    exit 1
fi
echo "✓ npm found: $(npm --version)"
echo ""

# Install root dependencies
echo "[3/6] Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install root dependencies"
    exit 1
fi
echo "✓ Root dependencies installed"
echo ""

# Install backend dependencies
echo "[4/6] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    cd ..
    exit 1
fi
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "[5/6] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    cd ..
    exit 1
fi
cd ..
echo "✓ Frontend dependencies installed"
echo ""

# Check MongoDB
echo "[6/6] Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "WARNING: MongoDB not detected"
    echo "Please ensure MongoDB is installed and running"
    echo "Download from: https://www.mongodb.com/try/download/community"
    echo ""
else
    echo "✓ MongoDB found: $(mongod --version | head -n 1)"
    echo ""
fi

echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Update .env file with your SMTP credentials"
echo "2. Ensure MongoDB is running"
echo "3. Run: npm run seed (to populate database)"
echo "4. Run: npm run dev (to start the application)"
echo ""
echo "For detailed instructions, see QUICKSTART.md"
echo "========================================"
echo ""
