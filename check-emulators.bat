@echo off
echo Checking Firebase Emulators Status...
echo =====================================

echo.
echo Checking Emulator UI (Port 4000)...
curl -s -o nul -w "Status: %%{http_code}\n" http://127.0.0.1:4000/ || echo Status: NOT RUNNING

echo.
echo Checking Auth Emulator (Port 9099)...
netstat -an | findstr :9099 | findstr LISTENING >nul && echo Status: RUNNING || echo Status: NOT RUNNING

echo.
echo Checking Firestore Emulator (Port 8088)...
curl -s -o nul -w "Status: %%{http_code}\n" http://127.0.0.1:8088/ || echo Status: NOT RUNNING

echo.
echo Checking Hosting Emulator (Port 5000)...
curl -s -o nul -w "Status: %%{http_code}\n" http://127.0.0.1:5000/ || echo Status: NOT RUNNING

echo.
echo =====================================
echo.
echo Emulator UI: http://127.0.0.1:4000
echo Hosting:     http://127.0.0.1:5000
echo.
pause