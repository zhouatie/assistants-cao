/**
 * 类型定义文件
 */
/**
 * AI 模型配置接口
 */
export interface ModelConfig {
    api_base: string;
    model: string;
    provider?: string;
    api_key?: string;
}
/**
 * 错误信息接口
 */
export interface ErrorInfo {
    command: string;
    error: string;
    returncode: number | null;
    original_command: string;
}
/**
 * 消息接口
 */
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
