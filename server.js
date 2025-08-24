const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const { extractPdfContent } = require('./utils/pdfExtractor');
const { extractWordContent } = require('./utils/wordExtractor');
const { fetchUrlContent } = require('./utils/urlFetcher');
const { generateTitlesWithDeepSeek } = require('./utils/deepseekApi');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|txt|md/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || 
                         file.mimetype === 'application/msword' ||
                         file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         file.mimetype === 'text/plain' ||
                         file.mimetype === 'text/markdown';
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('不支持的文件格式'));
        }
    }
});

// API路由

// 文件内容提取
app.post('/api/extract-content', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const filePath = req.file.path;
        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        let content = '';

        console.log('处理文件:', req.file.originalname, '类型:', fileExtension);

        switch (fileExtension) {
            case '.pdf':
                content = await extractPdfContent(filePath);
                break;
            case '.doc':
            case '.docx':
                content = await extractWordContent(filePath);
                break;
            case '.txt':
            case '.md':
                content = fs.readFileSync(filePath, 'utf8');
                break;
            default:
                throw new Error('不支持的文件格式');
        }

        // 删除临时文件
        fs.unlinkSync(filePath);

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '文件内容为空或无法解析' });
        }

        res.json({ content: content.trim() });
    } catch (error) {
        console.error('文件处理错误:', error);
        
        // 清理临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: error.message || '文件处理失败' });
    }
});

// URL内容获取
app.post('/api/fetch-url', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL不能为空' });
        }

        console.log('获取URL内容:', url);
        const content = await fetchUrlContent(url);
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: '无法从URL获取有效内容' });
        }

        res.json({ content: content.trim() });
    } catch (error) {
        console.error('URL获取错误:', error);
        res.status(500).json({ error: error.message || 'URL内容获取失败' });
    }
});

// 标题生成
app.post('/api/generate-titles', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: '内容不能为空' });
        }

        if (content.length < 100) {
            return res.status(400).json({ error: '内容太短，请提供更多内容以生成有效标题' });
        }

        console.log('生成标题，内容长度:', content.length);
        const titles = await generateTitlesWithDeepSeek(content);
        
        res.json({ titles });
    } catch (error) {
        console.error('标题生成错误:', error);
        res.status(500).json({ error: error.message || '标题生成失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小超过限制（10MB）' });
        }
        return res.status(400).json({ error: '文件上传错误: ' + error.message });
    }
    
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('请确保设置了 DEEPSEEK_API_KEY 环境变量');
});