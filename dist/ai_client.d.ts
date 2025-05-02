/**
 * AI API 客户端
 */
import { Message, ModelConfig } from './types';
/**
 * 调用 AI API 分析错误或处理会话消息
 * @param modelConfig 模型配置信息
 * @param messages 会话消息列表
 * @returns AI响应内容
 */
export declare function callAiApi(modelConfig: ModelConfig, messages: Message[]): Promise<string>;
