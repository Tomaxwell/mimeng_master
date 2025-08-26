const axios = require('axios');
require('dotenv').config();

async function debugAPI() {
    console.log('🔍 详细API调试信息');
    console.log('========================');
    
    // 检查环境变量
    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log('API Key存在:', !!apiKey);
    console.log('API Key长度:', apiKey ? apiKey.length : 0);
    console.log('API Key前10个字符:', apiKey ? apiKey.substring(0, 10) + '...' : '无');
    console.log('API Key格式检查:', apiKey && apiKey.startsWith('sk-') ? '✅' : '❌');
    
    // 检查特殊字符
    if (apiKey) {
        const hasInvalidChars = /[^\w-]/.test(apiKey);
        console.log('含有特殊字符:', hasInvalidChars ? '❌' : '✅');
        if (hasInvalidChars) {
            console.log('特殊字符位置:', apiKey.split('').map((c, i) => /[^\w-]/.test(c) ? `位置${i}: "${c}"` : null).filter(x => x));
        }
    }
    
    console.log('========================\n');
    
    if (!apiKey) {
        console.error('❌ API密钥未配置');
        return;
    }
    
    // 简单API测试
    console.log('🧪 测试简单API调用...');
    try {
        const response = await axios.post(
            'https://api.deepseek.com/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: '说"测试成功"'
                }],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`, // 去除可能的空格
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('✅ 简单API调用成功');
        console.log('响应:', response.data.choices[0].message.content);
        
    } catch (error) {
        console.error('❌ 简单API调用失败');
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        
        if (error.response) {
            console.error('HTTP状态:', error.response.status);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
            console.error('响应头:', JSON.stringify(error.response.headers, null, 2));
        }
        
        if (error.request) {
            console.error('请求配置:', {
                url: error.request.path,
                method: error.request.method,
                headers: error.request.getHeaders ? error.request.getHeaders() : 'N/A'
            });
        }
        return;
    }
    
    // 测试完整标题生成
    console.log('\n🎯 测试完整标题生成...');
    const testContent = '最近，一项关于年轻人消费习惯的调查引起了社会的广泛关注。调查显示，90后和00后在消费观念上呈现出截然不同的特点。他们更愿意为品质和体验买单，而不是盲目追求名牌。这种消费观念的转变，反映了新一代年轻人的价值观念变化。专家认为，这将对未来的消费市场产生深远影响。';
    
    try {
        const { generateTitlesWithDeepSeek } = require('./utils/deepseekApi');
        const titles = await generateTitlesWithDeepSeek(testContent);
        
        console.log('✅ 标题生成成功');
        console.log('生成数量:', titles.length);
        console.log('第一个标题:', titles[0]?.title);
        
    } catch (error) {
        console.error('❌ 标题生成失败');
        console.error('错误:', error.message);
        console.error('完整错误:', error);
    }
}

// 测试服务器API端点
async function testServerAPI() {
    console.log('\n🌐 测试服务器API端点...');
    
    const testData = {
        content: '最近，一项关于年轻人消费习惯的调查引起了社会的广泛关注。调查显示，90后和00后在消费观念上呈现出截然不同的特点。他们更愿意为品质和体验买单，而不是盲目追求名牌。这种消费观念的转变，反映了新一代年轻人的价值观念变化。专家认为，这将对未来的消费市场产生深远影响。'
    };
    
    try {
        const response = await axios.post('http://localhost:3000/api/generate-titles', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });
        
        console.log('✅ 服务器API调用成功');
        console.log('返回数据类型:', typeof response.data);
        console.log('是否包含titles:', 'titles' in response.data);
        console.log('标题数量:', response.data.titles?.length || 0);
        
    } catch (error) {
        console.error('❌ 服务器API调用失败');
        console.error('错误状态:', error.response?.status);
        console.error('错误数据:', error.response?.data);
        console.error('错误消息:', error.message);
    }
}

async function main() {
    await debugAPI();
    await testServerAPI();
}

main().catch(console.error);