/**
 * AI API 客户端
 */

import axios from 'axios';
import { URL } from 'url';
import * as process from 'process';
import { Message, ModelConfig } from './types';
import { getLogger, debug, error } from './utils/logger';

// 初始化日志
getLogger('ai_client');

/**
 * 过滤掉模型响应中的 <think>...</think> 标签及其内容
 * @param content 原始模型响应内容
 * @returns 过滤、整理后的内容
 */
function filterThinkTags(content: string): string {
    // 使用正则表达式移除开头的 <think>...</think> 标签及其内容
    const filtered = content.replace(/^<think>.*?<\/think>\s*/s, '');

    // 去除前后多余的空格和换行
    return filtered.trim();
}

/**
 * 调用 AI API 分析错误或处理会话消息
 * @param modelConfig 模型配置信息
 * @param messages 会话消息列表
 * @returns AI响应内容
 */
export async function callAiApi(modelConfig: ModelConfig, messages: Message[]): Promise<string> {
    // 根据选择的模型获取对应的 API KEY
    // 处理不同的API提供商
    let apiKey = null;
    let apiProvider = modelConfig.provider?.toLowerCase() || ''; // 优先使用provider字段
    const apiBase = modelConfig.api_base;

    // 如果未指定provider，尝试从api_base推断
    if (!apiProvider) {
        // 检查本地模型
        if (apiBase.includes('localhost') || apiBase.includes('127.0.0.1')) {
            apiProvider = 'ollama';
            debug(`检测到本地模型: ${apiProvider}`);
        } else {
            // 从URL中提取可能的提供商名称
            try {
                const parsedUrl = new URL(apiBase);
                const domain = parsedUrl.hostname;
                debug(`从URL提取域名: ${domain}`);

                // 提取域名中的主要部分，如 api.openai.com -> openai
                const domainParts = domain.split('.');
                if (domainParts.length >= 2) {
                    // 尝试找到主域名部分
                    if (
                        !['com', 'org', 'net', 'io'].includes(domainParts[domainParts.length - 2])
                    ) {
                        apiProvider = domainParts[domainParts.length - 2];
                    } else if (domainParts.length > 2) {
                        // 如果是二级域名，尝试获取子域名部分
                        apiProvider = domainParts[domainParts.length - 3];
                    }
                    debug(`从域名提取的提供商: ${apiProvider}`);
                }

                // 如果无法从域名提取，尝试从路径中提取
                if (!apiProvider && parsedUrl.pathname) {
                    const pathParts = parsedUrl.pathname.replace(/^\/|\/$/g, '').split('/');
                    if (pathParts.length > 0 && !['v1', 'v2', 'v3', 'api'].includes(pathParts[0])) {
                        apiProvider = pathParts[0];
                        debug(`从路径提取的提供商: ${apiProvider}`);
                    }
                }

                // 如果仍然无法确定提供商，使用完整域名
                if (!apiProvider) {
                    apiProvider = domain.replace(/\./g, '_');
                    debug(`使用完整域名作为提供商: ${apiProvider}`);
                }
            } catch (e) {
                error(`解析API基础URL失败: ${(e as Error).message}`);
                apiProvider = 'unknown';
            }
        }
    }

    // 检查是否为不需要API密钥的本地模型
    if (
        apiProvider === 'ollama' ||
        apiBase.includes('localhost') ||
        apiBase.includes('127.0.0.1')
    ) {
        // 本地模型不需要API key
        debug('本地模型不需要API密钥');
        apiKey = null;
    } else if (apiProvider) {
        // 任何其他提供商，统一从环境变量获取API密钥
        const envVarName = `${apiProvider.toUpperCase()}_API_KEY`;
        apiKey = process.env[envVarName];
        debug(`尝试从环境变量获取API密钥: ${envVarName}`);
        debug(`API提供商: ${apiProvider}`);

        // 尝试从配置中获取API密钥
        if (!apiKey && 'api_key' in modelConfig) {
            apiKey = modelConfig.api_key;
            debug('从模型配置中获取API密钥');
        }

        // 如果存在兼容性标识符（如dashscope通过compatible-mode提供的OpenAI兼容接口）
        if (!apiKey && apiBase.includes('compatible-mode')) {
            // 从URL中提取实际提供商名称
            let compatProvider = null;
            if (apiBase.includes('dashscope')) {
                compatProvider = 'DASHSCOPE';
            } else if (apiBase.includes('baichuan')) {
                compatProvider = 'BAICHUAN';
            }

            if (compatProvider) {
                const compatEnvVar = `${compatProvider}_API_KEY`;
                apiKey = process.env[compatEnvVar];
                debug(`检测到兼容模式，尝试从环境变量获取API密钥: ${compatEnvVar}`);

                if (apiKey) {
                    debug(`从兼容模式环境变量成功获取API密钥`);
                }
            }
        }

        if (!apiKey) {
            const errorMsg = `未设置 ${envVarName} 环境变量，也未在配置中提供API密钥`;
            error(errorMsg);
            return `错误: ${errorMsg}`;
        }
    } else {
        const errorMsg = '无法确定API提供商';
        error(errorMsg);
        return `错误: ${errorMsg}，请在配置中指定provider字段或使用标准URL格式`;
    }

    const model = modelConfig.model;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 直接使用提供的消息内容
    const payloadMessages = messages;

    const payload = {
        model: model,
        messages: payloadMessages,
        temperature: 0.7,
    };

    try {
        debug(`发送请求到 ${apiBase}/chat/completions`);

        // 打印请求头时对Authorization进行脱敏处理
        const debugHeaders = { ...headers };
        if ('Authorization' in debugHeaders) {
            const authValue = debugHeaders['Authorization'];
            if (authValue.startsWith('Bearer ')) {
                const token = authValue.substring(7); // 移除 "Bearer " 前缀
                if (token.length > 10) {
                    // 保留前4位和后4位，中间用****替换
                    const maskedToken =
                        token.substring(0, 4) + '****' + token.substring(token.length - 4);
                    debugHeaders['Authorization'] = `Bearer ${maskedToken}`;
                } else {
                    debugHeaders['Authorization'] = 'Bearer ****';
                }
            }
        }
        debug(`请求头: ${JSON.stringify(debugHeaders)}`);

        const response = await axios.post(`${apiBase}/chat/completions`, payload, {
            headers,
            timeout: 30000,
        });

        debug(`API响应状态码: ${response.status}`);

        if (response.status === 200) {
            const result = response.data;
            debug('API请求成功，解析响应');

            // Ollama API 与 OpenAI API 有稍微不同的响应格式
            if (apiBase.includes('localhost') || apiBase.includes('127.0.0.1')) {
                debug('检测到本地 Ollama API 格式');
                // Ollama 响应格式
                if ('message' in result && 'content' in result.message) {
                    debug('成功从 Ollama 响应中提取内容');
                    const content = result.message.content;
                    return filterThinkTags(content);
                } else {
                    // 兜底处理
                    debug('使用兜底逻辑处理 Ollama 响应');
                    const content =
                        (result.choices || [{}])[0]?.message?.content || '无法解析 Ollama API 响应';
                    return filterThinkTags(content);
                }
            } else {
                // OpenAI/DeepSeek 响应格式
                debug('使用标准 OpenAI 格式解析响应');
                const content = result.choices[0].message.content;
                return filterThinkTags(content);
            }
        } else {
            const errorMsg = `API 请求失败 (状态码: ${response.status}): ${JSON.stringify(response.data)}`;
            error(errorMsg);
            return errorMsg;
        }
    } catch (e) {
        const errorMsg = `调用 AI API 时出错: ${(e as Error).toString()}`;
        error(errorMsg);
        return errorMsg;
    }
}
