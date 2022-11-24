@echo off
echo Testing raw luajit
cd raw
"../../luajit.exe" ./runbenchmarks.lua
cd..