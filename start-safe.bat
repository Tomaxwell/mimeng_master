@echo off
echo 🔍 检查迷蒙标题生成大师启动状态...
echo.

REM 检查环境变量
if not exist .env (
    echo ❌ 未找到 .env 文件
    echo 💡 请先配置环境变量：
    echo    copy .env.example .env
    echo    然后编辑 .env 文件设置 DEEPSEEK_API_KEY
    pause
    exit /b 1
)

REM 检查端口是否被占用
echo 📡 检查端口 3000 是否可用...
netstat -ano | findstr :3000 > nul
if %ERRORLEVEL% == 0 (
    echo ❌ 端口 3000 已被占用
    echo.
    echo 💡 请选择解决方案：
    echo [1] 结束占用端口的进程
    echo [2] 使用其他端口启动
    echo [3] 退出
    echo.
    set /p choice="请输入选择 (1-3): "
    
    if "!choice!"=="1" (
        echo 🔄 正在结束占用端口的进程...
        for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3000') do (
            taskkill /F /PID %%i > nul 2>&1
        )
        echo ✅ 已结束相关进程
        timeout /t 2 > nul
    ) else if "!choice!"=="2" (
        set PORT=3001
        echo 🔄 使用端口 3001 启动...
    ) else (
        exit /b 0
    )
)

REM 检查依赖
if not exist node_modules (
    echo 📦 安装依赖包...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

REM 启动服务器
echo.
echo 🚀 启动迷蒙标题生成大师...
echo.
if defined PORT (
    set PORT=%PORT% && npm start
) else (
    npm start
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ 服务器启动失败
    echo 💡 常见解决方案：
    echo    1. 检查 .env 文件是否配置正确
    echo    2. 确认网络连接正常
    echo    3. 验证 Node.js 版本 (需要 16+)
    pause
)