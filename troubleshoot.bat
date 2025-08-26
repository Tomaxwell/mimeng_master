@echo off
echo 🔧 迷蒙标题生成大师 - 故障排除工具
echo ==========================================
echo.

REM 检查Node.js版本
echo 📋 检查系统环境...
echo.
echo Node.js 版本:
node --version
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js 未安装或版本过低 (需要 16+)
    echo 💡 请访问 https://nodejs.org 下载安装
    pause
    exit /b 1
)

echo.
echo NPM 版本:
npm --version

REM 检查项目文件
echo.
echo 📁 检查项目文件...
if not exist package.json (
    echo ❌ 未找到 package.json
    echo 💡 请确认在正确的项目目录中运行
    pause
    exit /b 1
)
echo ✅ package.json 存在

if not exist server.js (
    echo ❌ 未找到 server.js
    echo 💡 项目文件可能损坏，请重新下载
    pause
    exit /b 1
)
echo ✅ server.js 存在

if not exist .env (
    echo ❌ 未找到 .env 文件
    echo 💡 正在创建 .env 文件...
    copy .env.example .env >nul 2>&1
    if exist .env (
        echo ✅ 已创建 .env 文件
        echo ⚠️  请编辑 .env 文件设置 DEEPSEEK_API_KEY
    ) else (
        echo ❌ 创建 .env 文件失败
    )
) else (
    echo ✅ .env 文件存在
)

REM 检查依赖
echo.
echo 📦 检查项目依赖...
if not exist node_modules (
    echo ❌ 依赖未安装
    echo 💡 正在安装依赖...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ 依赖安装失败
        echo 💡 请检查网络连接或清除npm缓存: npm cache clean --force
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

REM 检查端口占用
echo.
echo 🌐 检查端口占用...
netstat -ano | findstr :3000 > nul
if %ERRORLEVEL% == 0 (
    echo ⚠️  端口 3000 被占用
    echo 💡 使用端口 3001: SET PORT=3001
) else (
    echo ✅ 端口 3000 可用
)

REM 检查环境变量
echo.
echo 🔑 检查环境变量...
findstr "DEEPSEEK_API_KEY" .env > nul
if %ERRORLEVEL% == 0 (
    echo ✅ 找到 DEEPSEEK_API_KEY 配置
    findstr "请在这里填写\|your_api_key_here" .env > nul
    if %ERRORLEVEL% == 0 (
        echo ⚠️  API密钥尚未设置
        echo 💡 请编辑 .env 文件设置真实的API密钥
    ) else (
        echo ✅ API密钥已配置
    )
) else (
    echo ❌ 未找到 DEEPSEEK_API_KEY 配置
    echo 💡 请在 .env 文件中添加: DEEPSEEK_API_KEY=your_api_key_here
)

echo.
echo 🔍 系统信息总结:
echo ==========================================
echo 操作系统: %OS%
echo 当前目录: %CD%
echo Node.js: 
node --version
echo NPM: 
npm --version

echo.
echo 📋 下一步建议:
echo 1. 确保 .env 文件中设置了正确的 DEEPSEEK_API_KEY
echo 2. 如果端口被占用，使用: SET PORT=3001 ^&^& npm start
echo 3. 运行: npm start 启动服务器
echo.

pause