/**
 * 命令执行和错误信息获取相关函数
 */
import { ErrorInfo } from '../types';
/**
 * 执行命令并捕获错误
 * @param command 要执行的命令数组
 * @returns 错误信息对象，如果成功执行则返回null
 */
export declare function executeCommand(command: string[]): Promise<ErrorInfo | null>;
