@echo off
echo ===================================================
echo   Starting Automated Student Attendance System
echo ===================================================

echo.
echo Starting Node.js Backend (Port 3070)...
start "Node.js Server" cmd /c "cd server && npm start"

echo.
echo Starting Python CV Engine (Port 5001)...
start "Python CV Engine" cmd /c "cd cv-engine && python server.py"

echo.
echo Starting React Frontend (Vite)...
start "React Client" cmd /c "cd client && npm run dev"

echo.
echo Opening Frontend in your default browser...
timeout /t 3 /nobreak > nul
start http://localhost:5173

echo.
echo All services are starting up! 
echo Check the new terminal windows for logs.
echo ===================================================
pause
