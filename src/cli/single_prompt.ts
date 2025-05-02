/**
 * 单次提示处理模块
 */

import { ModelConfig, Message } from '../types';
import { callAiApi } from '../ai_client';
import { debug, error } from '../utils/logger';
import { printWithBorders } from '../utils/terminal';

/**
 * 处理单次AI提示交互
 * @param prompt 用户提示内容
 * @param modelConfig AI模型配置
 */
export async function handleSinglePrompt(prompt: string, modelConfig: ModelConfig): Promise<void> {
    // 创建会话上下文
    const conversationContext: Message[] = [
        {
            role: 'system',
            content: `你是小草 (cao)，一个友好、幽默的编程助手。
            你的性格特点：
            1. 轻松幽默，善于活跃气氛
            2. 对编程知识了如指掌，但表达方式轻松不严肃
            3. 能理解程序员的苦恼和笑话
            4. 善于用比喻和例子解释复杂概念
            5. 有时会开一些程序员才懂的玩笑
            
            请以轻松自然的口吻与用户交流，像朋友一样陪伴他们编程。如果用户提出技术问题，请提供准确但不呆板的解答。`
        },
        {
            role: 'user',
            content: prompt
        }
    ];

    try {
        debug(`处理单次提示: ${prompt}`);
        
        // 显示用户输入的提示
        console.log(`\n你: ${prompt}\n`);
        
        // 显示加载信息
        process.stdout.write('AI思考中... ');
        
        // 调用AI API获取响应
        const aiResponse = await callAiApi(modelConfig, conversationContext);
        
        // 清除加载信息
        process.stdout.write('\r' + ' '.repeat(30) + '\r');
        
        // 显示AI响应，使用边框突出显示
        printWithBorders(aiResponse, 'chat');
        
    } catch (e) {
        error(`AI API调用出错: ${(e as Error).toString()}`);
        console.error(`\n抱歉，我遇到了一些问题: ${(e as Error).toString()}\n`);
    }
}
