# 🔥 迷蒙标题生成大师

基于咪蒙方法论的AI标题生成工具，使用DeepSeek V3.1 API生成10万+爆款标题。

## ✨ 功能特点

- 📄 **多格式支持**：支持PDF、Word、TXT、Markdown文件上传
- 🔗 **在线链接**：直接输入文章链接自动抓取内容
- ✏️ **直接输入**：支持手动粘贴文章内容
- 🎯 **智能生成**：基于咪蒙五大核心法则生成10个标题
- 📋 **一键复制**：点击标题即可复制到剪贴板
- 🎨 **精美界面**：响应式设计，支持移动端

## 📖 咪蒙标题方法论

基于咪蒙的五大核心法则：

1. **危险法则 (DANGEROUS)** - 威胁法则、死亡暗示
2. **意外法则 (UNEXPECTED)** - 数字法则、符号法则、反常识法则
3. **矛盾法则 (CONTRADICTION)** - 选择矛盾、心理矛盾
4. **痛点法则 (SORE POINT)** - 虚荣痛点、欲望痛点、贪婪痛点
5. **感同身受法则 (SYMPATHIZE)** - 对号入座、细节法则、接地气法则

## 🚀 快速开始

### 环境要求

- Node.js 16+
- NPM 或 Yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd mimeng-title
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，添加你的DeepSeek API密钥：
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   PORT=3000
   ```

4. **启动服务**
   ```bash
   # 开发模式
   npm run dev
   
   # 生产模式
   npm start
   ```

5. **访问网站**
   
   打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

```
mimeng-title/
├── index.html              # 主页面
├── style.css              # 样式文件
├── script.js              # 前端脚本
├── server.js              # 服务器入口
├── package.json           # 项目配置
├── system_prompt.md       # 系统提示词
├── .env.example          # 环境变量示例
├── utils/                # 工具类
│   ├── deepseekApi.js    # DeepSeek API调用
│   ├── pdfExtractor.js   # PDF解析
│   ├── wordExtractor.js  # Word解析
│   └── urlFetcher.js     # URL内容获取
└── uploads/              # 上传文件临时目录
```

## 🔧 API接口

### 文件内容提取
```
POST /api/extract-content
Content-Type: multipart/form-data

参数: file (文件)
返回: { content: string }
```

### URL内容获取
```
POST /api/fetch-url
Content-Type: application/json

参数: { url: string }
返回: { content: string }
```

### 标题生成
```
POST /api/generate-titles
Content-Type: application/json

参数: { content: string }
返回: { titles: Array<{rank, title, method, analysis}> }
```

## 🎨 使用方法

1. **选择输入方式**：
   - 文件上传：拖拽或选择文件
   - 在线链接：输入文章URL
   - 直接输入：粘贴文章内容

2. **点击生成**：等待AI生成标题

3. **查看结果**：
   - 查看10个按吸引力排序的标题
   - 每个标题显示使用的方法论和分析
   - 点击标题或📋图标复制到剪贴板

## ⚙️ 配置说明

### DeepSeek API
- 注册DeepSeek账号获取API密钥
- 在`.env`文件中配置`DEEPSEEK_API_KEY`
- 支持DeepSeek V3.1模型

### 文件限制
- 最大文件大小：10MB
- 支持格式：PDF、DOC/DOCX、TXT、MD
- 最小内容长度：100字符

### 服务器配置
- 默认端口：3000
- 请求超时：60秒
- 文件存储：临时目录自动清理

## 🔒 安全说明

- 上传文件在处理后自动删除
- 不存储用户内容和生成结果
- API密钥服务器端安全存储
- 支持CORS跨域请求

## 🚨 故障排除

### 常见问题

1. **API密钥错误**
   - 检查`.env`文件是否正确配置
   - 验证DeepSeek API密钥有效性

2. **文件解析失败**
   - 确认文件格式支持
   - 检查文件是否损坏
   - 尝试转换文件格式

3. **网络请求失败**
   - 检查网络连接
   - 验证防火墙设置
   - 确认URL可访问

4. **标题生成失败**
   - 检查内容长度（至少100字符）
   - 验证API调用限制
   - 查看服务器日志

### 日志查看

```bash
# 查看服务器日志
npm run dev
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题，请提交Issue或联系开发者。

---

**注意**：本工具仅供学习和研究使用，生成的标题仅供参考。请遵守相关法律法规和平台规则。