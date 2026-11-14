@echo off
cd /d "%~dp0"
py -m pip install -r requirements.txt
if errorlevel 1 goto fail
start "CareBeyond browser" powershell -NoProfile -Command "for ($i=0; $i -lt 180; $i++) { try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5000/ -TimeoutSec 2 | Out-Null; Start-Process 'http://127.0.0.1:5000/'; break } catch { Start-Sleep -Seconds 2 } }"
py app.py
:fail
pause
