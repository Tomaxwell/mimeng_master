const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 读取系统提示词
const systemPromptPath = path.join(__dirname, '..', 'system_prompt.md');
const systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');

/**
 * 调用DeepSeek API生成标题
 * @param {string} content - 文章内容
 * @returns {Promise<Array>} - 生成的标题列表
 */
async function generateTitlesWithDeepSeek(content) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
        throw new Error('请设置 DEEPSEEK_API_KEY 环境变量');
    }

    try {
        // 构建完整的prompt
        const fullPrompt = systemPrompt.replace('{{content}}', content);

        console.log('正在调用DeepSeek API生成标题...');
        
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-v3.1',
                messages: [
                    {
                        role: 'user',
                        content: fullPrompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000,
                top_p: 0.9
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60秒超时
            }
        );

        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            throw new Error('DeepSeek API返回数据格式错误');
        }

        const aiResponse = response.data.choices[0].message.content;
        console.log('DeepSeek API响应成功，开始解析标题...');
        
        // 解析AI返回的标题
        const titles = parseAIResponse(aiResponse);
        
        if (!titles || titles.length === 0) {
            throw new Error('无法从AI响应中解析出有效标题');
        }

        console.log(`成功生成 ${titles.length} 个标题`);
        return titles;

    } catch (error) {
        console.error('DeepSeek API调用错误:', error);
        
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error?.message || error.response.statusText;
            
            if (status === 401) {
                throw new Error('DeepSeek API密钥无效，请检查 DEEPSEEK_API_KEY 设置');
            } else if (status === 429) {
                throw new Error('API调用频率超限，请稍后重试');
            } else if (status === 500) {
                throw new Error('DeepSeek服务器内部错误，请稍后重试');
            } else {
                throw new Error(`DeepSeek API错误 (${status}): ${message}`);
            }
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('无法连接到DeepSeek API服务器');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('DeepSeek API请求超时，请稍后重试');
        } else {
            throw new Error(`DeepSeek API调用失败: ${error.message}`);
        }
    }
}

/**
 * 解析AI返回的标题响应
 * @param {string} aiResponse - AI的响应文本
 * @returns {Array} - 解析后的标题数组
 */
function parseAIResponse(aiResponse) {
    try {
        const titles = [];
        const lines = aiResponse.split('\n');
        
        let currentTitle = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 匹配标题行 (如: **标题1:《xxx》** 或 标题1: 或 1. )
            const titleMatch = trimmedLine.match(/^(?:\*\*)?(?:标题\s*)?(\d+)[:：.]?\s*(?:《(.+?)》|(.+?))(?:\*\*)?$/);
            if (titleMatch) {
                // 如果有之前的标题，先保存
                if (currentTitle) {
                    titles.push(currentTitle);
                }
                
                const titleNumber = titleMatch[1];
                const titleText = titleMatch[2] || titleMatch[3] || '';
                
                currentTitle = {
                    rank: parseInt(titleNumber),
                    title: titleText.replace(/^《|》$/g, ''), // 移除书名号
                    method: '',
                    analysis: ''
                };
                continue;
            }
            
            // 匹配法则行
            const methodMatch = trimmedLine.match(/^[-*]?\s*(?:\*\*)?法则(?:\*\*)?[:：]\s*(.+)$/);
            if (methodMatch && currentTitle) {
                currentTitle.method = methodMatch[1].replace(/\*\*/g, '').trim();
                continue;
            }
            
            // 匹配分析行
            const analysisMatch = trimmedLine.match(/^[-*]?\s*(?:\*\*)?分析(?:\*\*)?[:：]\s*(.+)$/);
            if (analysisMatch && currentTitle) {
                currentTitle.analysis = analysisMatch[1].replace(/\*\*/g, '').trim();
                continue;
            }
            
            // 如果是其他内容行，且当前有标题但没有分析，可能是分析的延续
            if (currentTitle && !currentTitle.analysis && trimmedLine && 
                !trimmedLine.startsWith('**') && !trimmedLine.includes('标题')) {
                currentTitle.analysis = trimmedLine;
                continue;
            }
        }
        
        // 保存最后一个标题
        if (currentTitle) {
            titles.push(currentTitle);
        }
        
        // 如果解析失败，尝试简单的数字开头模式
        if (titles.length === 0) {
            const simpleMatches = aiResponse.match(/\d+[.、:：]\s*[《"]?.+?[》"]?/g);
            if (simpleMatches) {
                simpleMatches.forEach((match, index) => {
                    const titleText = match.replace(/^\d+[.、:：]\s*[《"]*|[》"]*$/g, '');
                    if (titleText.trim()) {
                        titles.push({
                            rank: index + 1,
                            title: titleText.trim(),
                            method: '标题生成法则',
                            analysis: '基于咪蒙方法论生成的标题'
                        });
                    }
                });
            }
        }
        
        // 确保至少有一些标题
        if (titles.length === 0) {
            // 最后的备用方案：尝试提取任何看起来像标题的内容
            const possibleTitles = aiResponse.match(/[《"][^《》""]{10,50}[》"]/g) || 
                                 aiResponse.match(/^.{10,50}$/gm);
            
            if (possibleTitles) {
                possibleTitles.slice(0, 10).forEach((title, index) => {
                    titles.push({
                        rank: index + 1,
                        title: title.replace(/[《》""]/g, '').trim(),
                        method: '咪蒙标题法则',
                        analysis: '根据内容特点生成的标题'
                    });
                });
            }
        }
        
        // 验证和清理标题
        const validTitles = titles
            .filter(t => t.title && t.title.length > 5 && t.title.length < 100)
            .slice(0, 10) // 最多返回10个标题
            .map((title, index) => ({
                ...title,
                rank: index + 1,
                method: title.method || '咪蒙标题方法论',
                analysis: title.analysis || '运用咪蒙方法论生成的吸引眼球标题'
            }));
        
        return validTitles;
        
    } catch (error) {
        console.error('解析AI响应错误:', error);
        throw new Error('标题解析失败，请稍后重试');
    }
}

module.exports = {
    generateTitlesWithDeepSeek
};