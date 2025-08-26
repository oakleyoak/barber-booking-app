@echo off
REM Setup script for Windows

echo 🚀 Setting up Booking Management App...

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Python and Node.js found

REM Setup Backend
echo 📦 Setting up backend...
cd backend

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed

REM Setup Frontend
echo 📦 Setting up frontend...
cd ..\frontend

REM Install Node dependencies
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed

REM Go back to root
cd ..

echo 🎉 Setup complete!
echo.
echo To start the application:
echo 1. Backend: cd backend ^&^& python run.py
echo 2. Frontend: cd frontend ^&^& npm run dev
echo.
echo The app will be available at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs

pause
