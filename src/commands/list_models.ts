/**
 * 列出所有配置的模型命令
 */
import * as config from '../config';
import { ModelConfig } from '../types';
import { createTitle, createTable } from '../ui/theme';

/**
 * 格式化模型配置输出
 * 标记默认模型并按表格形式显示
 */
export function formatModelsList(models: { [key: string]: ModelConfig }, defaultModel: string): string {
    const headers = ['模型名称', '默认', 'API基础URL', '模型标识符', '提供商'];
    
    const rows = Object.entries(models).map(([name, modelConfig]) => [
        name,
        name === defaultModel ? '✓' : '',
        modelConfig.api_base,
        modelConfig.model,
        modelConfig.provider || name
    ]);
    
    return createTable(headers, rows);
}

/**
 * 列出所有配置的模型，并以美观的方式呈现
 */
export function listAllModels(): void {
    console.log(createTitle('已配置的 AI 模型'));
    console.log('');
    
    // 获取所有模型和默认模型
    const models = config.getSupportedModels();
    const defaultModel = config.getDefaultModel();
    
    if (Object.keys(models).length === 0) {
        console.log('没有找到配置的模型。请使用 `cao-config` 添加模型。');
        return;
    }
    
    // 格式化并输出模型列表
    console.log(formatModelsList(models, defaultModel));
    
    // 添加使用说明
    console.log('\n使用指南:');
    console.log(' - 使用特定模型: cao --model <模型名称> <其他参数>');
    console.log(' - 管理模型配置: cao-config');
    console.log('');
}
