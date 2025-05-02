/**
 * 统一的日志记录模块，提供调试和错误日志功能
 */
type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
/**
 * 日志记录器类
 */
declare class Logger {
    name: string;
    level: LogLevel;
    constructor(name: string, level?: LogLevel);
    /**
     * 记录日志消息
     * @param level 日志级别
     * @param message 日志消息
     * @param args 其他参数
     */
    log(level: LogLevel, message: string, ...args: any[]): void;
    /**
     * 记录调试级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    debug(message: string, ...args: any[]): void;
    /**
     * 记录信息级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    info(message: string, ...args: any[]): void;
    /**
     * 记录警告级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    warning(message: string, ...args: any[]): void;
    /**
     * 记录错误级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    error(message: string, ...args: any[]): void;
    /**
     * 记录严重错误级别的消息
     * @param message 日志消息
     * @param args 其他参数
     */
    critical(message: string, ...args: any[]): void;
}
/**
 * 获取或创建一个命名的日志记录器
 * @param name 日志记录器名称
 * @returns 配置好的日志记录器
 */
export declare function getLogger(name?: string): Logger;
/**
 * 检查是否处于调试模式
 * @returns 是否启用了调试模式
 */
export declare function isDebugMode(): boolean;
/**
 * 记录调试级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export declare function debug(msg: string, ...args: any[]): void;
/**
 * 记录信息级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export declare function info(msg: string, ...args: any[]): void;
/**
 * 记录警告级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export declare function warning(msg: string, ...args: any[]): void;
/**
 * 记录错误级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export declare function error(msg: string, ...args: any[]): void;
/**
 * 记录严重错误级别的消息
 * @param msg 日志消息
 * @param args 其他参数
 */
export declare function critical(msg: string, ...args: any[]): void;
export {};
