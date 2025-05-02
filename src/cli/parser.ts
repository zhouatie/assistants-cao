/**
 * 命令行参数解析模块
 */

import { Command } from 'commander';
import * as config from '../config';

/**
 * 解析命令行参数
 * @param program Commander程序实例
 */
export function parseArgs(program: Command): void {
    // 获取用户配置的模型
    const DEFAULT_MODEL = config.getDefaultModel();

    program
        .version('1.0.0')
        .description('捕获终端错误并通过 AI 分析')
        .option('-m, --model <model>', `选择 AI 模型 (默认: ${DEFAULT_MODEL})`, DEFAULT_MODEL)
        .option('-d, --debug', '开启调试模式')
        .option('--config', '配置 AI 模型')
        .parse(process.argv);
}
