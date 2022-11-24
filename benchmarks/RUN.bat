@echo off
call protect.bat
call run-raw.bat
call run-protected.bat
..\luajit.exe .\main\run.lua
pause