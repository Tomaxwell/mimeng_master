const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * 从PDF文件中提取文本内容
 * @param {string} filePath - PDF文件路径
 * @returns {Promise<string>} - 提取的文本内容
 */
async function extractPdfContent(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        
        let text = pdfData.text;
        
        // 清理文本
        text = text
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\n\s*\n/g, '\n') // 合并多个换行
            .trim();
        
        if (!text || text.length < 50) {
            throw new Error('PDF文件内容太少或无法解析');
        }
        
        console.log(`PDF解析成功，提取文本长度: ${text.length} 字符`);
        return text;
    } catch (error) {
        console.error('PDF解析错误:', error);
        throw new Error(`PDF文件解析失败: ${error.message}`);
    }
}

module.exports = {
    extractPdfContent
};