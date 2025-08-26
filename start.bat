@echo off
REM Quick start script for development

echo 🚀 Starting Booking Management App...

REM Start backend in background
echo 📡 Starting backend server...
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate && python run.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🌐 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ Both servers are starting...
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill the servers
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo 🛑 Servers stopped.
