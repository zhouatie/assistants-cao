/**
 * Configuration management for cao tool
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ModelConfig } from './types';

// 配置接口
interface Config {
    models: {
        [key: string]: ModelConfig;
    };
    default_model: string;
}

// 默认配置
const DEFAULT_CONFIG: Config = {
    models: {
        deepseek: {
            api_base: 'https://api.deepseek.com/v1',
            model: 'deepseek-coder',
            provider: 'deepseek',
        },
        openai: { api_base: 'https://api.openai.com/v1', model: 'gpt-4o', provider: 'openai' },
        ollama: {
            api_base: 'http://localhost:11434/v1',
            model: 'qwen2.5-coder:7b',
            provider: 'ollama',
        },
    },
    default_model: 'deepseek',
};

/**
 * 获取配置目录路径
 * @returns 配置目录路径
 */
export function getConfigDir(): string {
    // Use XDG_CONFIG_HOME if available, otherwise use ~/.cao
    const xdgConfigHome = process.env.XDG_CONFIG_HOME;
    const configDir = xdgConfigHome
        ? path.join(xdgConfigHome, 'cao')
        : path.join(os.homedir(), '.cao');

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    return configDir;
}

/**
 * 获取配置文件路径
 * @returns 配置文件路径
 */
export function getConfigFile(): string {
    return path.join(getConfigDir(), 'config.json');
}

/**
 * 加载配置，如果配置文件不存在则返回默认配置
 * @returns 配置对象
 */
export function loadConfig(): Config {
    const configFile = getConfigFile();

    if (fs.existsSync(configFile)) {
        try {
            const userConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));

            // 合并默认配置与用户配置
            const config = { ...DEFAULT_CONFIG };

            if ('models' in userConfig) {
                config.models = { ...config.models, ...userConfig.models };
            }

            if ('default_model' in userConfig && userConfig.default_model in config.models) {
                config.default_model = userConfig.default_model;
            }

            return config;
        } catch (e) {
            console.error(`加载配置文件错误: ${(e as Error).message}`);
            return DEFAULT_CONFIG;
        }
    } else {
        // 如果配置文件不存在，创建默认配置
        saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }
}

/**
 * 保存配置到文件
 * @param config 要保存的配置
 * @returns 是否保存成功
 */
export function saveConfig(config: Config): boolean {
    const configFile = getConfigFile();

    try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        return true;
    } catch (e) {
        console.error(`保存配置文件错误: ${(e as Error).message}`);
        return false;
    }
}

/**
 * 添加或更新模型配置
 * @param name 模型名称
 * @param api_base API基础URL
 * @param model 模型标识符
 * @param api_key 可选的API密钥
 * @returns 是否成功添加/更新
 */
export function addModel(name: string, api_base: string, model: string, api_key?: string): boolean {
    const config = loadConfig();

    // 更新或添加模型
    const modelConfig: ModelConfig = {
        api_base,
        model,
        provider: name, // 添加provider字段，默认与模型名称相同
    };

    // 如果提供了API密钥，也添加到配置中
    if (api_key) {
        modelConfig.api_key = api_key;
    }

    config.models[name] = modelConfig;

    return saveConfig(config);
}

/**
 * 从配置中删除模型
 * @param name 要删除的模型名称
 * @returns 是否成功删除
 */
export function removeModel(name: string): boolean {
    const config = loadConfig();

    // 检查模型是否存在
    if (!(name in config.models)) {
        return false;
    }

    // 检查是否是默认模型
    if (name === config.default_model) {
        return false;
    }

    // 删除模型
    delete config.models[name];
    return saveConfig(config);
}

/**
 * 设置默认模型
 * @param name 要设为默认的模型名称
 * @returns 是否设置成功
 */
export function setDefaultModel(name: string): boolean {
    const config = loadConfig();

    // 检查模型是否存在
    if (!(name in config.models)) {
        return false;
    }

    // 设为默认
    config.default_model = name;
    return saveConfig(config);
}

/**
 * 获取所有支持的模型列表
 * @returns 模型配置对象
 */
export function getSupportedModels(): { [key: string]: ModelConfig } {
    const config = loadConfig();
    return config.models;
}

/**
 * 获取默认模型名称
 * @returns 默认模型名称
 */
export function getDefaultModel(): string {
    const config = loadConfig();
    return config.default_model;
}
