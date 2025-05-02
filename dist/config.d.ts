/**
 * Configuration management for cao tool
 */
import { ModelConfig } from './types';
interface Config {
    models: {
        [key: string]: ModelConfig;
    };
    default_model: string;
}
/**
 * 获取配置目录路径
 * @returns 配置目录路径
 */
export declare function getConfigDir(): string;
/**
 * 获取配置文件路径
 * @returns 配置文件路径
 */
export declare function getConfigFile(): string;
/**
 * 加载配置，如果配置文件不存在则返回默认配置
 * @returns 配置对象
 */
export declare function loadConfig(): Config;
/**
 * 保存配置到文件
 * @param config 要保存的配置
 * @returns 是否保存成功
 */
export declare function saveConfig(config: Config): boolean;
/**
 * 添加或更新模型配置
 * @param name 模型名称
 * @param api_base API基础URL
 * @param model 模型标识符
 * @param api_key 可选的API密钥
 * @returns 是否成功添加/更新
 */
export declare function addModel(name: string, api_base: string, model: string, api_key?: string): boolean;
/**
 * 从配置中删除模型
 * @param name 要删除的模型名称
 * @returns 是否成功删除
 */
export declare function removeModel(name: string): boolean;
/**
 * 设置默认模型
 * @param name 要设为默认的模型名称
 * @returns 是否设置成功
 */
export declare function setDefaultModel(name: string): boolean;
/**
 * 获取所有支持的模型列表
 * @returns 模型配置对象
 */
export declare function getSupportedModels(): {
    [key: string]: ModelConfig;
};
/**
 * 获取默认模型名称
 * @returns 默认模型名称
 */
export declare function getDefaultModel(): string;
export {};
