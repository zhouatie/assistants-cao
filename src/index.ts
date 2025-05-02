/**
 * cao 公共API导出
 *
 * 这个文件作为库的主入口点，导出公共API
 */

// 导出主要配置和工具
export * from './config';
export * from './types';
export * from './ai_client';

// 导出UI组件 (可以被其他项目复用)
export * from './ui/theme';
export * from './ui/components';

// 导出命令行功能
import * as cli from './cli/main';
export { cli };

// 导出版本信息
export const version = '1.0.0';
