/**
 * Configuration command-line interface for cao
 * 导入增强版配置界面
 */

import * as fs from 'fs';
import inquirer from 'inquirer';
import * as config from './config';
import { runConfigCli as runNewConfigCli } from './config_cli_new';

// 使用增强版配置CLI替代当前版本
export function runConfigCli(args: string[]): void {
    // 直接使用新的增强版配置CLI
    runNewConfigCli(args);
}

// 为了保持兼容性，保留旧的导出函数
export { listModels } from './config_cli_new';
export { interactiveConfig } from './config_cli_new';
