@echo off
title CircuitVision Debugger
echo ========================================
echo  CircuitVision Debugger
echo  AI PCB 智能故障检测系统
echo ========================================
echo.
echo [1] 使用浏览器直接打开 (file://)
echo [2] 启动本地 HTTP 服务器 (Python)
echo [3] 启动本地 HTTP 服务器 (Node.js)
echo.
set /p choice="请选择启动方式 (1/2/3): "

if "%choice%"=="1" (
    start "" "index.html"
    echo 已用浏览器打开 index.html
    goto end
)
if "%choice%"=="2" (
    python -m http.server 8080
    echo 服务器已启动: http://localhost:8080
    start http://localhost:8080
    goto end
)
if "%choice%"=="3" (
    npx serve . -p 8080
    echo 服务器已启动: http://localhost:8080
    start http://localhost:8080
    goto end
)

echo 无效选择，请重新运行。
pause
:end
