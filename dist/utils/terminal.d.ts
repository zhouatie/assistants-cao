/**
 * 终端相关的辅助函数
 */
/**
 * 获取终端窗口大小
 * @returns [宽度, 高度] 元组
 */
export declare function getTerminalSize(): [number, number];
/**
 * 获取字符串在终端中的显示宽度，考虑中文等宽字符
 * @param s 字符串
 * @returns 显示宽度
 */
export declare function getStringDisplayWidth(s: string): number;
/**
 * 打印文本，添加边框或前缀
 * @param text 要打印的文本
 * @param mode 打印模式，可选值：normal(标准模式), chat(聊天模式)
 * @param role 消息角色，可选值: assistant(小草消息), user(用户消息)
 */
export declare function printWithBorders(text: string, mode?: string, role?: string): void;
