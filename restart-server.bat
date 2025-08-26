@echo off
echo 🔄 重启迷蒙标题生成器服务器...
echo.

REM 结束现有的node进程
echo 📋 结束现有服务器进程...
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3000') do (
    for /f "tokens=5" %%j in ('netstat -ano ^| findstr :3000 ^| findstr %%i') do (
        echo 结束进程 %%j
        taskkill /F /PID %%j > nul 2>&1
    )
)

REM 等待端口释放
echo ⏳ 等待端口释放...
timeout /t 3 > nul

REM 检查.env文件
if not exist .env (
    echo ❌ .env文件不存在，请先配置
    pause
    exit /b 1
)

echo ✅ 环境配置检查完成

REM 启动服务器
echo 🚀 启动服务器...
start "Mimeng Title Server" node server.js

REM 等待服务器启动
echo ⏳ 等待服务器启动...
timeout /t 5 > nul

REM 检查服务器状态
curl -s http://localhost:3000/api/health > nul
if %ERRORLEVEL% == 0 (
    echo ✅ 服务器启动成功！
    echo 🌐 访问地址: http://localhost:3000
    echo 🔧 调试地址: http://localhost:3000/debug
) else (
    echo ❌ 服务器启动失败，请检查控制台错误信息
)

echo.
echo 按任意键继续...
pause > nul