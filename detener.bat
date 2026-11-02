@echo off
rem Apaga lo que escucha en :3100 (front) y :3101 (API), con sus procesos hijos.
for %%P in (3100 3101) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
    echo Cerrando puerto %%P (PID %%I)
    taskkill /PID %%I /T /F >nul 2>&1
  )
)
taskkill /FI "WINDOWTITLE eq lab-app API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq lab-app WEB*" /T /F >nul 2>&1
echo Listo.
timeout /t 2 /nobreak >nul
