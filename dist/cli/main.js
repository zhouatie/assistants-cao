#!/usr/bin/env node
"use strict";
/**
 * 命令行主逻辑模块
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const commander_1 = require("commander");
const config = __importStar(require("../config"));
const logger_1 = require("../utils/logger");
const parser_1 = require("./parser");
const interactive_1 = require("./interactive");
// 获取日志记录器
const logger = (0, logger_1.getLogger)('cli/main');
// 主函数
function main() {
    const program = new commander_1.Command();
    (0, parser_1.parseArgs)(program);
    const options = program.opts();
    // 如果用户请求配置，则运行配置界面
    if (options.config) {
        const configCli = require('../config_cli');
        configCli.interactiveConfig();
        process.exit(0);
    }
    // 如果设置了调试标志，则设置环境变量以便在整个执行过程中使用
    if (options.debug) {
        process.env.CAO_DEBUG_MODE = '1';
        process.env.CAO_LOG_LEVEL = 'DEBUG';
        logger.level = 'debug';
        (0, logger_1.debug)('调试模式已启用');
    }
    let errorInfo = null;
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
        (0, logger_1.debug)(`选择的模型配置: ${JSON.stringify(modelConfig)}`);
    }
    // 直接进入持续会话模式
    (0, interactive_1.handleInteractiveSession)(modelConfig);
}
// 如果直接运行此文件，则执行主函数
if (require.main === module) {
    main();
}
