@echo off
echo Starting Cardio Backend Server...
echo.

cd lib\backend

echo Installing dependencies...
call npm install

echo.
echo Starting server...
call npm run dev

pause
