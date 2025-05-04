/**
 * 交互式会话处理模块
 */

import * as readline from 'readline';
import chalk from 'chalk';
import { ModelConfig, Message } from '../types';
import { debug, error } from '../utils/logger';
import { printWithBorders } from '../utils/terminal';
import { callAiApi } from '../ai_client';
import * as calendarService from '../services/calendar';

// 定义角色配置接口
interface RoleConfig {
    name: string;
    emoji: string;
    system_prompt: string;
    greeting: string;
}

interface Roles {
    [key: string]: RoleConfig;
}

/**
 * 处理交互式对话会话
 * @param modelConfig AI模型配置
 */
export function handleInteractiveSession(modelConfig: ModelConfig): void {
    // 创建readline接口
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '',
        terminal: true,
    });

    // 会话上下文，用于保持与AI的对话历史
    const conversationContext: Message[] = [];

    // 当前角色类型
    let currentRole = 'default';

    // 可用角色配置
    const roles: Roles = {
        default: {
            name: '小草',
            emoji: '🌱',
            system_prompt: `你是小草 (cao)，一个友好、幽默的编程助手。
      你的性格特点：
      1. 轻松幽默，善于活跃气氛
      2. 对编程知识了如指掌，但表达方式轻松不严肃
      3. 能理解程序员的苦恼和笑话
      4. 善于用比喻和例子解释复杂概念
      5. 有时会开一些程序员才懂的玩笑

      请以轻松自然的口吻与用户交流，像朋友一样陪伴他们编程。如果用户提出技术问题，请提供准确但不呆板的解答。
      `,
            greeting:
                '嗨！我是小草 🌱，你的编程闲聊伙伴！今天想聊点什么？技术问题、开发困扰，还是只是想放松一下大脑？我随时准备陪你唠嗑～',
        },
        frontend: {
            name: '前端专家',
            emoji: '🧑‍💻',
            system_prompt: `你是一位资深前端开发工程师，拥有多年的前端开发经验。
      你精通：
      1. 现代JavaScript框架(React, Vue, Angular等)
      2. CSS预处理器和现代布局技术
      3. 前端性能优化和最佳实践
      4. 响应式设计和移动端开发
      5. 前端工程化和构建工具

      请以专业、有深度但友好的方式回答用户关于前端开发的所有问题，提供具体的代码示例和实用建议。
      `,
            greeting:
                '你好！我是前端专家 🧑‍💻，很高兴能协助你解决前端开发问题。无论是React组件设计、CSS布局难题，还是性能优化建议，我都能提供专业支持。有什么我能帮到你的吗？',
        },
        backend: {
            name: '后端专家',
            emoji: '🧑‍💻',
            system_prompt: `你是一位资深后端开发工程师，拥有丰富的系统架构和API设计经验。
      你精通：
      1. 服务器端编程语言(Python, Java, Go等)
      2. 数据库设计和优化(SQL和NoSQL)
      3. 微服务架构和API设计
      4. 高并发、高可用系统设计
      5. 安全最佳实践和性能调优

      请以专业、有深度但友好的方式回答用户关于后端开发的所有问题，提供具体的代码示例和实用建议。
      `,
            greeting:
                '你好！我是后端专家 🔧，很高兴能协助你解决后端开发问题。无论是系统架构设计、数据库优化，还是API接口规范，我都能提供专业支持。有什么技术难题需要我帮助吗？',
        },
        secretary: {
            name: '智能秘书',
            emoji: '📝',
            system_prompt: `你是一位高效、贴心的智能秘书，擅长帮助用户管理生活与工作。
      你的专长：
      1. 日程安排和时间管理
      2. 任务分解和优先级排序
      3. 信息整理和总结
      4. 提供生活和工作建议
      5. 情感支持和积极鼓励

      当用户要求你创建日程时，你应该提取以下信息：
      - 日程标题/主题
      - 日期和时间
      - 地点(如有)
      - 描述/备注(如有)
      
      然后你会调用系统的日历API来创建日程。创建成功后，向用户确认日程已创建。
      
      当用户询问日程时，你应该调用系统的日历API来查询符合条件的日程，并以清晰易读的方式展示给用户。

      请以体贴、专业、高效的方式帮助用户处理各种生活和工作上的事务，提供实用的建议和解决方案。
      `,
            greeting:
                '你好！我是你的智能秘书 📝，随时准备帮你安排日程、整理任务、提供建议。无论是工作计划还是生活安排，我都能为你提供贴心的支持。今天有什么我可以帮到你的吗？',
        },
    };

    // 设置初始角色
    // 使用友好的聊天模式人设
    conversationContext.push({
        role: 'system',
        content: roles[currentRole].system_prompt,
    });

    conversationContext.push({
        role: 'assistant',
        content: roles[currentRole].greeting,
    });

    // 准备角色切换提示信息
    let roleSwitchGuide = '💡 角色切换指令:\n';
    for (const [cmd, roleInfo] of Object.entries(roles)) {
        if (cmd !== 'default') {
            roleSwitchGuide += `/${cmd} - 与${roleInfo.name} ${roleInfo.emoji} 沟通\n`;
        }
    }

    // 打印初始欢迎消息和角色切换指南
    const welcomeMessage = `${roles[currentRole].greeting}\n\n${roleSwitchGuide}`;
    printWithBorders(welcomeMessage, 'chat');

    // 设置信号处理，优雅地处理Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n退出对话模式');
        process.exit(0);
    });

    // 让控制台显示提示符
    function displayPrompt() {
        // 使用ANSI转义序列设置光标位置和文本
        const prompt = chalk.cyan.bold(`cao ${roles[currentRole].emoji} > `);

        // 清除当前行并显示提示符
        process.stdout.write('\r\x1b[K' + prompt);

        // 为了防止用户删除提示符，使用readline的setPrompt功能
        rl.setPrompt(prompt);
    }

    // 显示加载动画
    function showLoadingAnimation(done: { value: boolean }) {
        const loadingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;

        process.stdout.write('\r');

        const interval = setInterval(() => {
            if (done.value) {
                clearInterval(interval);
                process.stdout.write('\r' + ' '.repeat(50) + '\r');
                return;
            }

            process.stdout.write(`\r${loadingChars[i % loadingChars.length]} `);
            i++;
        }, 100);
    }

    // 显示AI响应，采用逐字打印效果
    function displayAiResponse(response: string, roleName: string, roleEmoji: string) {
        // 清理当前行，确保显示完整
        process.stdout.write('\r\x1b[K');
        console.log(`\n\x1b[1;32m${roleName}${roleEmoji}\x1b[0m:`);

        // 确保响应不为空，避免显示不完整
        if (!response) {
            console.log('无响应内容');
            console.log('\n'); // 额外的空行
            displayPrompt();
            return;
        }

        // 关闭打印动画效果，直接打印全部内容，避免前面的字符丢失
        console.log(response);
        console.log(''); // 额外的空行

        // 确保显示提示符
        setTimeout(() => {
            displayPrompt();
        }, 100); // 添加短暂延时确保提示符正确显示

        /* 注释掉逐字打印效果，因为它可能导致内容截断问题
        // 逐字打印
        const chars = response.split('');
        let i = 0;
        let buffer = ''; // 用于累积已显示的内容，确保完整显示

        function printNextChar() {
            if (i < chars.length) {
                const char = chars[i];
                process.stdout.write(char);
                buffer += char;
                i++;
                setTimeout(printNextChar, 5); // 每个字符间隔5毫秒
            } else {
                // 检查显示是否完整
                if (buffer.length < response.length) {
                    // 如果不完整，直接打印剩余内容
                    const remaining = response.substring(buffer.length);
                    process.stdout.write(remaining);
                }
                console.log('\n'); // 额外的空行
                // 确保在显示完AI响应后重新显示提示符
                displayPrompt();
            }
        }

        printNextChar();
        */
    }

    // 处理用户输入
    displayPrompt();
    rl.on('line', async input => {
        const userInput = input.trim();

        // 检查退出命令
        if (['exit', 'quit', '/exit', '/quit'].includes(userInput.toLowerCase())) {
            console.log('\n退出对话模式');
            process.exit(0);
        }

        // 检查角色切换命令或直接发送给特定角色的内容
        if (userInput.startsWith('/')) {
            // 检查是否是 "/角色 内容" 格式
            const parts = userInput.substring(1).split(' ', 1);
            const cmd = parts[0].toLowerCase();

            // 如果是 "/角色 内容" 格式
            if (cmd in roles && userInput.length > cmd.length + 1) {
                const content = userInput.substring(cmd.length + 2).trim();
                if (!content) {
                    // 如果内容为空，则只切换角色
                    console.log(`\n请在命令后输入内容，例如：/${cmd} 你好\n`);
                    displayPrompt();
                    return;
                }

                // 切换角色
                currentRole = cmd;

                // 更新系统提示
                for (let i = 0; i < conversationContext.length; i++) {
                    if (conversationContext[i].role === 'system') {
                        conversationContext[i] = {
                            role: 'system',
                            content: roles[currentRole].system_prompt,
                        };
                        break;
                    }
                }

                // 添加用户消息到上下文
                conversationContext.push({ role: 'user', content: content });

                // 调用AI API获取响应
                const loadingStatus = { value: false };
                showLoadingAnimation(loadingStatus);

                try {
                    const aiResponse = await callAiApi(modelConfig, conversationContext);
                    loadingStatus.value = true;

                    // 添加AI响应到上下文
                    conversationContext.push({ role: 'assistant', content: aiResponse });

                    // 打印当前角色名称和AI响应，采用聊天风格显示
                    displayAiResponse(
                        aiResponse,
                        roles[currentRole].name,
                        roles[currentRole].emoji
                    );
                    // 注意: displayPrompt() 已经在 displayAiResponse 函数中调用
                } catch (e) {
                    loadingStatus.value = true;
                    error(`AI API调用出错: ${(e as Error).toString()}`);
                    console.error(`抱歉，我遇到了一些问题: ${(e as Error).toString()}`);
                    // 添加 displayPrompt() 确保错误后也显示提示符
                    displayPrompt();
                }
                return;
            } else if (cmd in roles) {
                // 纯切换角色命令，只显示切换通知，不调用AI API
                currentRole = cmd;

                // 更新系统提示
                for (let i = 0; i < conversationContext.length; i++) {
                    if (conversationContext[i].role === 'system') {
                        conversationContext[i] = {
                            role: 'system',
                            content: roles[currentRole].system_prompt,
                        };
                        break;
                    }
                }

                // 添加角色切换通知
                printWithBorders(
                    `已切换到 ${roles[currentRole].name} ${roles[currentRole].emoji} 模式`,
                    'chat'
                );

                displayPrompt();
                return;
            } else {
                console.log(`\n未知命令: ${userInput}\n`);
                displayPrompt();
                return;
            }
        }

        // 如果输入为空，则跳过
        if (!userInput) {
            displayPrompt();
            return;
        }

        // 添加用户消息到上下文
        conversationContext.push({ role: 'user', content: userInput });

        // 调用AI API获取响应
        const loadingStatus = { value: false };
        showLoadingAnimation(loadingStatus);

        try {
            const aiResponse = await callAiApi(modelConfig, conversationContext);
            loadingStatus.value = true;

            // 检查是否与secretary角色对话，且响应中包含日历操作意图
            let finalResponse = aiResponse;
            if (currentRole === 'secretary') {
                // 简单的意图检测
                if (
                    userInput.toLowerCase().includes('创建日程') ||
                    userInput.toLowerCase().includes('添加日程')
                ) {
                    // 尝试从用户输入中提取日程信息
                    const eventInfo = calendarService.extractEventInfo(userInput);
                    if (eventInfo) {
                        try {
                            // 调用日历服务创建事件
                            await calendarService.createCalendarEvent(
                                eventInfo.title,
                                eventInfo.date,
                                eventInfo.description,
                                eventInfo.location
                            );
                            // 将创建结果附加到AI响应
                            finalResponse += `\n\n✅ 日程已创建：${eventInfo.title} (${new Date(eventInfo.date).toLocaleString('zh-CN')})`;
                            if (eventInfo.location) {
                                finalResponse += ` 地点：${eventInfo.location}`;
                            }
                        } catch (error) {
                            finalResponse += `\n\n❌ 日程创建失败：${(error as Error).message}`;
                        }
                    }
                } else if (
                    userInput.toLowerCase().includes('查看日程') ||
                    userInput.toLowerCase().includes('我的日程')
                ) {
                    try {
                        // 获取日历事件
                        const events = await calendarService.listCalendarEvents();
                        if (events && events.length > 0) {
                            finalResponse += '\n\n📅 您的日程安排：\n';
                            events.forEach(event => {
                                finalResponse += `- ${event.title}: ${new Date(event.date).toLocaleString('zh-CN')}`;
                                if (event.location) {
                                    finalResponse += ` (地点: ${event.location})`;
                                }
                                if (event.description) {
                                    finalResponse += ` [${event.description}]`;
                                }
                                finalResponse += '\n';
                            });
                        } else {
                            finalResponse += '\n\n📅 您近期没有日程安排。';
                        }
                    } catch (error) {
                        finalResponse += `\n\n❌ 获取日程失败：${(error as Error).message}`;
                    }
                }
            }

            // 添加AI响应到上下文
            conversationContext.push({ role: 'assistant', content: finalResponse });

            // 打印当前角色名称和AI响应，采用聊天风格显示
            displayAiResponse(finalResponse, roles[currentRole].name, roles[currentRole].emoji);
        } catch (e) {
            loadingStatus.value = true;
            error(`AI API调用出错: ${(e as Error).toString()}`);
            console.error(`抱歉，我遇到了一些问题: ${(e as Error).toString()}`);
            // 添加显示提示符确保错误后也能看到提示符
            displayPrompt();
        }

        // 如果对话历史太长，清理最早的对话（保留system消息）
        if (conversationContext.length > 20) {
            // 保留system消息和最近的对话
            const systemMessages = conversationContext.filter(msg => msg.role === 'system');
            const recentMessages = conversationContext.slice(-10);
            conversationContext.length = 0;
            conversationContext.push(...systemMessages, ...recentMessages);
            debug('对话历史已清理，保留system消息和最近10条对话');
        }

        displayPrompt();
    });
}
