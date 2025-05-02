/**
 * 统一的日志记录模块，提供调试和错误日志功能
 */


import * as path from 'path';
import * as util from 'util';

// 日志级别类型
type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

// 日志级别映射
const LOG_LEVELS: Record<string, number> = {
    DEBUG: 10,
    INFO: 20,
    WARNING: 30,
    ERROR: 40,
    CRITICAL: 50,
};

// 默认配置
const DEFAULT_LOG_LEVEL = 'INFO';

// 彩色日志配置
const COLORS = {
    DEBUG: '\x1b[36m', // 青色
    INFO: '\x1b[32m', // 绿色
    WARNING: '\x1b[33m', // 黄色
    ERROR: '\x1b[31m', // 红色
    CRITICAL: '\x1b[35m', // 紫色
    RESET: '\x1b[0m', // 重置
};

// 全局日志记录器字典
const loggers: Record<string, Logger> = {};

/**
 * 日志记录器类
 */
class Logger {
    name: string;
    level: LogLevel;

    constructor(name: string, level: LogLevel = 'info') {
        this.name = name;
        this.level = level;
    }

    /**
     * 记录日志消息
     * @param level 日志级别
     * @param message 日志消息
     * @param args 其他参数
     */
    log(level: LogLevel, message: string, ...args: unknown[]): void {
        const levelUpper = level.toUpperCase() as keyof typeof LOG_LEVELS;

        // 检查日志级别是否应该被记录
        if (
            LOG_LEVELS[levelUpper] < LOG_LEVELS[this.level.toUpperCase() as keyof typeof LOG_LEVELS]
        ) {
            return;
        }

        // 格式化消息
        let formattedMessage = message;
        if (args.length > 0) {
            formattedMessage = util.format(message, ...args);
        }

        // 添加时间戳和颜色
        const now = new Date().toISOString().replace('T', ' ').substr(0, 19);
        const color = COLORS[levelUpper as keyof typeof COLORS] || '';
        const reset = COLORS.RESET;
        const isTTY = process.stdout.isTTY;

        // 构建日志行
        const logLine = `${now} [${isTTY ? color : ''}${levelUpper}${isTTY ? reset : ''}] ${this.name}: ${formattedMessage}`;

        // 根据日志级别输出到stdout或stderr
        if (LOG_LEVELS[levelUpper] >= LOG_LEVELS.ERROR) {
            console.error(logLine);
        } else {
            console.log(logLine);
        }
    }

    /**
     * 记录调试级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, ...args);
    }

    /**
     * 记录信息级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    /**
     * 记录警告级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    warning(message: string, ...args: unknown[]): void {
        this.log('warning', message, ...args);
    }

    /**
     * 记录错误级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }

    /**
     * 记录严重错误级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    critical(message: string, ...args: unknown[]): void {
        this.log('critical', message, ...args);
    }
}

/**
 * 获取或创建一个命名的日志记录器
 * @param name 日志记录器名称
 * @returns 配置好的日志记录器
 */
export function getLogger(name: string = 'root'): Logger {
    // 检查是否已经创建过这个logger
    if (name in loggers) {
        return loggers[name];
    }

    // 创建新的logger
    const logger = new Logger(name);

    // 读取环境变量中的日志级别设置
    const logLevelName = (process.env.CAO_LOG_LEVEL || DEFAULT_LOG_LEVEL).toUpperCase();
    const logLevel = (logLevelName.toLowerCase() as LogLevel) || 'info';

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
export function isDebugMode(): boolean {
    return (
        process.env.CAO_DEBUG_MODE === '1' || process.env.CAO_LOG_LEVEL?.toUpperCase() === 'DEBUG'
    );
}

/**
 * 记录调试级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export function debug(msg: string, ...args: unknown[]): void {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).debug(msg, ...args);
}

/**
 * 记录信息级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export function info(msg: string, ...args: unknown[]): void {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).info(msg, ...args);
}

/**
 * 记录警告级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export function warning(msg: string, ...args: unknown[]): void {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).warning(msg, ...args);
}

/**
 * 记录错误级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export function error(msg: string, ...args: unknown[]): void {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).error(msg, ...args);
}

/**
 * 记录严重错误级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export function critical(msg: string, ...args: unknown[]): void {
    // 获取调用模块名称
    const callerModule = getCallerModuleName();
    getLogger(callerModule).critical(msg, ...args);
}

/**
 * 获取调用者的模块名称
 * @returns 模块名称
 */
function getCallerModuleName(): string {
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
