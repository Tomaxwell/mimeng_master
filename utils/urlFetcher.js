const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 从URL获取并解析网页内容
 * @param {string} url - 要获取的URL
 * @returns {Promise<string>} - 提取的文本内容
 */
async function fetchUrlContent(url) {
    try {
        // 验证URL格式
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            throw new Error('只支持HTTP和HTTPS协议的URL');
        }

        console.log('正在获取URL内容:', url);
        
        // 获取网页内容
        const response = await axios.get(url, {
            timeout: 30000, // 30秒超时
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });

        if (response.status !== 200) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const html = response.data;
        const $ = cheerio.load(html);

        // 移除不需要的元素
        $('script, style, nav, footer, header, .advertisement, .ad, .sidebar').remove();
        
        // 尝试提取主要内容
        let content = '';
        
        // 常见的文章内容选择器
        const contentSelectors = [
            'article',
            '.article-content',
            '.post-content',
            '.content',
            '.main-content',
            '#content',
            '.entry-content',
            '.post-body',
            '.article-body',
            'main',
            '.container p',
            'body p'
        ];
        
        for (const selector of contentSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                content = elements.text().trim();
                if (content.length > 200) { // 如果内容足够长，就使用它
                    break;
                }
            }
        }
        
        // 如果没有找到合适的内容，提取所有段落
        if (!content || content.length < 200) {
            content = $('p').map((i, el) => $(el).text().trim()).get().join('\n');
        }
        
        // 如果仍然没有内容，提取body中的所有文本
        if (!content || content.length < 100) {
            content = $('body').text();
        }
        
        // 清理文本
        content = content
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\n\s*\n/g, '\n') // 合并多个换行
            .replace(/[^\u4e00-\u9fa5\u0000-\u007F\s]/g, '') // 保留中文、英文和基本符号
            .trim();
        
        if (!content || content.length < 100) {
            throw new Error('无法从网页中提取到足够的有效内容');
        }
        
        // 如果内容太长，截取前5000字符
        if (content.length > 5000) {
            content = content.substring(0, 5000) + '...';
        }
        
        console.log(`URL内容获取成功，提取文本长度: ${content.length} 字符`);
        return content;
        
    } catch (error) {
        console.error('URL获取错误:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            throw new Error('无法解析域名，请检查URL是否正确');
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('连接被拒绝，网站可能无法访问');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('请求超时，请稍后重试');
        } else if (error.response) {
            throw new Error(`HTTP错误 ${error.response.status}: ${error.response.statusText}`);
        } else {
            throw new Error(`URL内容获取失败: ${error.message}`);
        }
    }
}

module.exports = {
    fetchUrlContent
};