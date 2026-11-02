@echo off
rem Levanta API (:3101) y front (:3100) en dos ventanas y abre el navegador.
set RAIZ=%~dp0

netstat -ano | findstr /r /c:":3101 .*LISTENING" >nul
if errorlevel 1 (
  start "lab-app API" cmd /k "cd /d %RAIZ%api && npm run dev"
) else (
  echo La API ya esta corriendo en :3101
)

netstat -ano | findstr /r /c:":3100 .*LISTENING" >nul
if errorlevel 1 (
  start "lab-app WEB" cmd /k "cd /d %RAIZ%web && npm run dev"
) else (
  echo El front ya esta corriendo en :3100
)

timeout /t 8 /nobreak >nul
start http://localhost:3100
