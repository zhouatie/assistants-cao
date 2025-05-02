"use strict";
/**
 * 交互式会话处理模块
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteractiveSession = handleInteractiveSession;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
const terminal_1 = require("../utils/terminal");
const ai_client_1 = require("../ai_client");
/**
 * 处理交互式对话会话
 * @param modelConfig AI模型配置
 */
function handleInteractiveSession(modelConfig) {
    // 创建readline接口
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '',
        terminal: true
    });
    // 会话上下文，用于保持与AI的对话历史
    const conversationContext = [];
    // 当前角色类型
    let currentRole = 'default';
    // 可用角色配置
    const roles = {
        'default': {
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
            greeting: '嗨！我是小草 🌱，你的编程闲聊伙伴！今天想聊点什么？技术问题、开发困扰，还是只是想放松一下大脑？我随时准备陪你唠嗑～',
        },
        'frontend': {
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
            greeting: '你好！我是前端专家 🧑‍💻，很高兴能协助你解决前端开发问题。无论是React组件设计、CSS布局难题，还是性能优化建议，我都能提供专业支持。有什么我能帮到你的吗？',
        },
        'backend': {
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
            greeting: '你好！我是后端专家 🔧，很高兴能协助你解决后端开发问题。无论是系统架构设计、数据库优化，还是API接口规范，我都能提供专业支持。有什么技术难题需要我帮助吗？',
        },
        'secretary': {
            name: '智能秘书',
            emoji: '📝',
            system_prompt: `你是一位高效、贴心的智能秘书，擅长帮助用户管理生活与工作。
      你的专长：
      1. 日程安排和时间管理
      2. 任务分解和优先级排序
      3. 信息整理和总结
      4. 提供生活和工作建议
      5. 情感支持和积极鼓励

      请以体贴、专业、高效的方式帮助用户处理各种生活和工作上的事务，提供实用的建议和解决方案。
      `,
            greeting: '你好！我是你的智能秘书 📝，随时准备帮你安排日程、整理任务、提供建议。无论是工作计划还是生活安排，我都能为你提供贴心的支持。今天有什么我可以帮到你的吗？',
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
    let roleSwitchGuide = "💡 角色切换指令:\n";
    for (const [cmd, roleInfo] of Object.entries(roles)) {
        if (cmd !== "default") {
            roleSwitchGuide += `/${cmd} - 与${roleInfo.name} ${roleInfo.emoji} 沟通\n`;
        }
    }
    // 打印初始欢迎消息和角色切换指南
    const welcomeMessage = `${roles[currentRole].greeting}\n\n${roleSwitchGuide}`;
    (0, terminal_1.printWithBorders)(welcomeMessage, "chat");
    // 设置信号处理，优雅地处理Ctrl+C
    process.on('SIGINT', () => {
        console.log("\n退出对话模式");
        process.exit(0);
    });
    // 让控制台显示提示符
    function displayPrompt() {
        process.stdout.write(chalk_1.default.cyan.bold(`cao ${roles[currentRole].emoji} > `));
    }
    // 显示加载动画
    function showLoadingAnimation(done) {
        const loadingChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
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
    function displayAiResponse(response, roleName, roleEmoji) {
        console.log(`\n\x1b[1;32m${roleName}${roleEmoji}\x1b[0m:`);
        // 逐字打印
        const chars = response.split('');
        let i = 0;
        function printNextChar() {
            if (i < chars.length) {
                process.stdout.write(chars[i]);
                i++;
                setTimeout(printNextChar, 5); // 每个字符间隔5毫秒
            }
            else {
                console.log('\n'); // 额外的空行
            }
        }
        printNextChar();
    }
    // 处理用户输入
    displayPrompt();
    rl.on('line', async (input) => {
        const userInput = input.trim();
        // 检查退出命令
        if (['exit', 'quit', '/exit', '/quit'].includes(userInput.toLowerCase())) {
            console.log("\n退出对话模式");
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
                if (!content) { // 如果内容为空，则只切换角色
                    console.log(`\n请在命令后输入内容，例如：/${cmd} 你好\n`);
                    displayPrompt();
                    return;
                }
                // 切换角色
                const oldRole = currentRole;
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
                    const aiResponse = await (0, ai_client_1.callAiApi)(modelConfig, conversationContext);
                    loadingStatus.value = true;
                    // 添加AI响应到上下文
                    conversationContext.push({ role: 'assistant', content: aiResponse });
                    // 打印当前角色名称和AI响应，采用聊天风格显示
                    displayAiResponse(aiResponse, roles[currentRole].name, roles[currentRole].emoji);
                }
                catch (e) {
                    loadingStatus.value = true;
                    (0, logger_1.error)(`AI API调用出错: ${e.toString()}`);
                    console.error(`抱歉，我遇到了一些问题: ${e.toString()}`);
                }
                displayPrompt();
                return;
            }
            else if (cmd in roles) {
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
                (0, terminal_1.printWithBorders)(`已切换到 ${roles[currentRole].name} ${roles[currentRole].emoji} 模式`, "chat");
                displayPrompt();
                return;
            }
            else {
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
            const aiResponse = await (0, ai_client_1.callAiApi)(modelConfig, conversationContext);
            loadingStatus.value = true;
            // 添加AI响应到上下文
            conversationContext.push({ role: 'assistant', content: aiResponse });
            // 打印当前角色名称和AI响应，采用聊天风格显示
            displayAiResponse(aiResponse, roles[currentRole].name, roles[currentRole].emoji);
        }
        catch (e) {
            loadingStatus.value = true;
            (0, logger_1.error)(`AI API调用出错: ${e.toString()}`);
            console.error(`抱歉，我遇到了一些问题: ${e.toString()}`);
        }
        // 如果对话历史太长，清理最早的对话（保留system消息）
        if (conversationContext.length > 20) {
            // 保留system消息和最近的对话
            const systemMessages = conversationContext.filter(msg => msg.role === 'system');
            const recentMessages = conversationContext.slice(-10);
            conversationContext.length = 0;
            conversationContext.push(...systemMessages, ...recentMessages);
            (0, logger_1.debug)("对话历史已清理，保留system消息和最近10条对话");
        }
        displayPrompt();
    });
}
