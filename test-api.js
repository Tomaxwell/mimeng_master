const axios = require('axios');
require('dotenv').config();

async function testDeepSeekAPI() {
    console.log('🧪 测试DeepSeek API连接...');
    console.log('API Key:', process.env.DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置');
    
    if (!process.env.DEEPSEEK_API_KEY) {
        console.error('❌ 请在.env文件中设置DEEPSEEK_API_KEY');
        return;
    }
    
    try {
        console.log('🔄 发送测试请求...');
        
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: '请说"API连接测试成功"'
                    }
                ],
                temperature: 0.7,
                max_tokens: 100
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('✅ API连接成功！');
        console.log('响应内容:', response.data.choices[0].message.content);
        console.log('模型:', response.data.model);
        console.log('使用的token数:', response.data.usage);
        
    } catch (error) {
        console.error('❌ API连接失败:');
        
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误信息:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('💡 解决方案: API密钥无效，请检查DEEPSEEK_API_KEY设置');
            } else if (error.response.status === 429) {
                console.log('💡 解决方案: API调用频率超限，请稍后重试');
            } else if (error.response.status === 402) {
                console.log('💡 解决方案: 账户余额不足，请充值');
            }
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 解决方案: 网络连接问题，请检查网络设置');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('💡 解决方案: 请求超时，请稍后重试');
        } else {
            console.error('详细错误:', error.message);
        }
    }
}

async function testTitleGeneration() {
    console.log('\n🎯 测试标题生成功能...');
    
    const testContent = `
    最近，一项关于年轻人消费习惯的调查引起了社会的广泛关注。
    调查显示，90后和00后在消费观念上呈现出截然不同的特点。
    他们更愿意为品质和体验买单，而不是盲目追求名牌。
    这种消费观念的转变，反映了新一代年轻人的价值观念变化。
    专家认为，这将对未来的消费市场产生深远影响。
    `;
    
    try {
        const { generateTitlesWithDeepSeek } = require('./utils/deepseekApi');
        const titles = await generateTitlesWithDeepSeek(testContent);
        
        console.log('✅ 标题生成成功！');
        console.log('生成的标题数量:', titles.length);
        
        titles.forEach((title, index) => {
            console.log(`\n标题${index + 1}: ${title.title}`);
            console.log(`方法: ${title.method}`);
            console.log(`分析: ${title.analysis}`);
        });
        
    } catch (error) {
        console.error('❌ 标题生成失败:', error.message);
    }
}

// 运行测试
async function runTests() {
    await testDeepSeekAPI();
    await testTitleGeneration();
}

runTests();