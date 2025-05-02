"use strict";
/**
 * 统一的日志记录模块，提供调试和错误日志功能
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
exports.getLogger = getLogger;
exports.isDebugMode = isDebugMode;
exports.debug = debug;
exports.info = info;
exports.warning = warning;
exports.error = error;
exports.critical = critical;
const path = __importStar(require("path"));
const util = __importStar(require("util"));
// 日志级别映射
const LOG_LEVELS = {
    'DEBUG': 10,
    'INFO': 20,
    'WARNING': 30,
    'ERROR': 40,
    'CRITICAL': 50,
};
// 默认配置
const DEFAULT_LOG_LEVEL = 'INFO';
// 彩色日志配置
const COLORS = {
    'DEBUG': '\x1b[36m', // 青色
    'INFO': '\x1b[32m', // 绿色
    'WARNING': '\x1b[33m', // 黄色
    'ERROR': '\x1b[31m', // 红色
    'CRITICAL': '\x1b[35m', // 紫色
    'RESET': '\x1b[0m', // 重置
};
// 全局日志记录器字典
const loggers = {};
/**
 * 日志记录器类
 */
class Logger {
    constructor(name, level = 'info') {
        this.name = name;
        this.level = level;
    }
    /**
     * 记录日志消息
     * @param level 日志级别
     * @param message 日志消息
     * @param args 其他参数
     */
    log(level, message, ...args) {
        const levelUpper = level.toUpperCase();
        // 检查日志级别是否应该被记录
        if (LOG_LEVELS[levelUpper] < LOG_LEVELS[this.level.toUpperCase()]) {
            return;
        }
        // 格式化消息
        let formattedMessage = message;
        if (args.length > 0) {
            formattedMessage = util.format(message, ...args);
        }
        // 添加时间戳和颜色
        const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
        const color = COLORS[levelUpper] || '';
        const reset = COLORS.RESET;
        const isTTY = process.stdout.isTTY;
        // 构建日志行
        const logLine = `${now} [${isTTY ? color : ''}${levelUpper}${isTTY ? reset : ''}] ${this.name}: ${formattedMessage}`;
        // 根据日志级别输出到stdout或stderr
        if (LOG_LEVELS[levelUpper] >= LOG_LEVELS.ERROR) {
            console.error(logLine);
        }
        else {
            console.log(logLine);
        }
    }
    /**
     * 记录调试级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    debug(message, ...args) {
        this.log('debug', message, ...args);
    }
    /**
     * 记录信息级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    info(message, ...args) {
        this.log('info', message, ...args);
    }
    /**
     * 记录警告级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    warning(message, ...args) {
        this.log('warning', message, ...args);
    }
    /**
     * 记录错误级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    error(message, ...args) {
        this.log('error', message, ...args);
    }
    /**
     * 记录严重错误级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    critical(message, ...args) {
        this.log('critical', message, ...args);
    }
}
/**
 * 获取或创建一个命名的日志记录器
 * @param name 日志记录器名称
 * @returns 配置好的日志记录器
 */
function getLogger(name = 'root') {
    // 检查是否已经创建过这个logger
    if (name in loggers) {
        return loggers[name];
    }
    // 创建新的logger
    const logger = new Logger(name);
    // 读取环境变量中的日志级别设置
    const logLevelName = (process.env.CAO_LOG_LEVEL || DEFAULT_LOG_LEVEL).toUpperCase();
    const logLevel = logLevelName.toLowerCase() || 'info';
    // 设置日志级别
    logger.level = logLevel;
    // 保存日志记录器的引用
    loggers[name] = logger;
    return logger;
}
/**
 * 检查是否处于调试模式
 * @returns 是否启用了调试模式
 */
function isDebugMode() {
    return process.env.CAO_DEBUG_MODE === '1' ||
        process.env.CAO_LOG_LEVEL?.toUpperCase() === 'DEBUG';
}
/**
 * 记录调试级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
function debug(msg, ...args) {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).debug(msg, ...args);
}
/**
 * 记录信息级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
function info(msg, ...args) {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).info(msg, ...args);
}
/**
 * 记录警告级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
function warning(msg, ...args) {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).warning(msg, ...args);
}
/**
 * 记录错误级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
function error(msg, ...args) {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).error(msg, ...args);
}
/**
 * 记录严重错误级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
function critical(msg, ...args) {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).critical(msg, ...args);
}
/**
 * 获取调用者的模块名称
 * @returns 模块名称
 */
function getCallerModuleName() {
    // 获取调用栈
    const stackLines = new Error().stack?.split('\n') || [];
    // 从调用栈中找到第一个非logger.ts的文件
    let callerFile = '';
    for (let i = 1; i < stackLines.length; i++) {
        const match = stackLines[i].match(/at\s+(.+?)\s+\((.+?):[0-9]+:[0-9]+\)/);
        if (match && !match[2].includes('logger.ts')) {
            callerFile = match[2];
            break;
        }
    }
    if (!callerFile) {
        return 'root';
    }
    // 提取模块名称（去掉扩展名和路径）
    const parsedPath = path.parse(callerFile);
    return parsedPath.name || 'root';
}
