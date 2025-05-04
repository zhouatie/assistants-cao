#!/usr/bin/env node

/**
 * 命令行主逻辑模块
 */

import { Command } from 'commander';
import * as config from '../config';
import { getLogger, debug } from '../utils/logger';
import { parseArgs } from './parser';
import { handleInteractiveSession } from './interactive';
import { handleSinglePrompt } from './single_prompt';

// 获取日志记录器
const logger = getLogger('cli/main');

// 主函数
export function main(): void {
    // 创建命令行程序
    const program = new Command();
    parseArgs(program);
    const options = program.opts();

    // 如果设置了调试标志，则设置环境变量以便在整个执行过程中使用
    if (options.debug) {
        process.env.CAO_DEBUG_MODE = '1';
        process.env.CAO_LOG_LEVEL = 'DEBUG';
        logger.level = 'debug';
        debug('调试模式已启用');
    }

    // 如果用户请求列出模型，则显示所有配置的模型
    if (options.listModels) {
        import('../commands/list_models').then(modelsList => {
            modelsList.listAllModels();
            process.exit(0);
        });
        return;
    }

    // 如果用户请求配置，则运行增强版配置界面
    if (options.config) {
        // 使用import语法替代require
        import('../config_cli').then(async configCli => {
            await configCli.interactiveConfig();
            process.exit(0);
        });
        return;
    }

    // 如果用户提供了直接提示，则处理单次AI交互
    if (options.prompt) {
        // 初始化模型配置
        const SUPPORTED_MODELS = config.getSupportedModels();
        const modelName = options.model;
        const modelConfig = SUPPORTED_MODELS[modelName];
        if (!modelConfig.provider) {
            modelConfig.provider = modelName;
        }

        // 处理单次提示并退出
        handleSinglePrompt(options.prompt, modelConfig)
            .then(() => process.exit(0))
            .catch(err => {
                console.error(`处理提示时出错: ${err.message}`);
                process.exit(1);
            });
        return;
    }

    // 初始化配置

    // 选择 AI 模型
    const SUPPORTED_MODELS = config.getSupportedModels();
    const modelName = options.model;
    if (!Object.keys(SUPPORTED_MODELS).includes(modelName)) {
        console.log(`错误: 不支持的模型 '${modelName}'`);
        console.log(`支持的模型: ${Object.keys(SUPPORTED_MODELS).join(', ')}`);
        process.exit(1);
    }

    const modelConfig = SUPPORTED_MODELS[modelName];
    if (!modelConfig.provider) {
        modelConfig.provider = modelName;
    }

    // 调试模式下打印模型信息
    if (options.debug) {
        debug(`选择的模型配置: ${JSON.stringify(modelConfig)}`);
    }

    // 直接进入持续会话模式
    handleInteractiveSession(modelConfig);
}

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main();
}
