const fs = require('fs');
const mammoth = require('mammoth');

/**
 * 从Word文档中提取文本内容
 * @param {string} filePath - Word文件路径
 * @returns {Promise<string>} - 提取的文本内容
 */
async function extractWordContent(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        
        let text = result.value;
        
        // 清理文本
        text = text
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\n\s*\n/g, '\n') // 合并多个换行
            .trim();
        
        if (!text || text.length < 50) {
            throw new Error('Word文档内容太少或无法解析');
        }
        
        // 检查是否有解析警告
        if (result.messages.length > 0) {
            console.log('Word解析警告:', result.messages);
        }
        
        console.log(`Word解析成功，提取文本长度: ${text.length} 字符`);
        return text;
    } catch (error) {
        console.error('Word解析错误:', error);
        throw new Error(`Word文档解析失败: ${error.message}`);
    }
}

module.exports = {
    extractWordContent
};