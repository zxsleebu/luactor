@echo off
echo Testing protected luajit
cd protected
"../../luajit.exe" ./runbenchmarks.lua
cd..