#!/bin/bash

# 云服务器部署脚本 - 迷蒙标题生成大师
# 支持腾讯云、阿里云、华为云等云服务器

set -e

echo "🚀 开始部署迷蒙标题生成大师..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用root权限运行此脚本"
    exit 1
fi

# 更新系统
echo "📦 更新系统包..."
apt-get update && apt-get upgrade -y

# 安装必要软件
echo "🔧 安装必要软件..."
apt-get install -y curl wget git nginx

# 安装Node.js 18
echo "📥 安装Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 克隆或创建项目目录
APP_DIR="/var/www/mimeng-title"
echo "📁 设置项目目录: $APP_DIR"

if [ -d "$APP_DIR" ]; then
    echo "目录已存在，清理旧文件..."
    rm -rf $APP_DIR
fi

mkdir -p $APP_DIR
cd $APP_DIR

# 复制项目文件（假设已经上传到服务器）
echo "📋 请确保项目文件已上传到服务器"
echo "如果使用git，请运行: git clone <your-repo-url> ."

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install --production

# 创建uploads目录
mkdir -p uploads
chown -R www-data:www-data uploads

# 创建systemd服务
echo "⚙️ 创建systemd服务..."
cat > /etc/systemd/system/mimeng-title.service << EOF
[Unit]
Description=Mimeng Title Generator
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

# 配置Nginx反向代理
echo "🌐 配置Nginx..."
cat > /etc/nginx/sites-available/mimeng-title << EOF
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/mimeng-title /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 设置文件权限
chown -R www-data:www-data $APP_DIR
chmod +x $APP_DIR/server.js

# 启动服务
echo "🚀 启动服务..."
systemctl daemon-reload
systemctl enable mimeng-title
systemctl start mimeng-title
systemctl restart nginx

# 配置防火墙
echo "🔒 配置防火墙..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "✅ 部署完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 编辑 $APP_DIR/.env 文件，设置 DEEPSEEK_API_KEY"
echo "2. 修改 /etc/nginx/sites-available/mimeng-title 中的域名"
echo "3. 运行以下命令重启服务:"
echo "   systemctl restart mimeng-title"
echo "   systemctl restart nginx"
echo ""
echo "🔍 查看服务状态:"
echo "   systemctl status mimeng-title"
echo "   systemctl status nginx"
echo ""
echo "📄 查看日志:"
echo "   journalctl -u mimeng-title -f"
echo ""
echo "🌍 如果配置了域名，现在可以访问你的网站了！"