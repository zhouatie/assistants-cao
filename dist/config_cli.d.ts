/**
 * Configuration command-line interface for cao
 */
/**
 * 列出所有配置的模型
 */
export declare function listModels(): void;
/**
 * 交互式配置模式
 */
export declare function interactiveConfig(): Promise<void>;
/**
 * 运行配置CLI
 * @param args 命令行参数
 */
export declare function runConfigCli(args: string[]): void;
