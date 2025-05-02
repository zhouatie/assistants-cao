/**
 * 命令执行和错误信息获取相关函数
 */

import * as child_process from 'child_process';
import { ErrorInfo } from '../types';

/**
 * 执行命令并捕获错误
 * @param command 要执行的命令数组
 * @returns 错误信息对象，如果成功执行则返回null
 */
export function executeCommand(command: string[]): Promise<ErrorInfo | null> {
    // 对所有命令统一处理，不再区分ls命令
    const cmd = command.join(' ');

    try {
        const process = child_process.spawn(cmd, {
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', data => {
            stdout += data.toString();
        });

        process.stderr.on('data', data => {
            stderr += data.toString();
        });

        return new Promise<ErrorInfo | null>(resolve => {
            process.on('close', code => {
                if (code !== 0) {
                    resolve({
                        command: cmd,
                        error: stderr || stdout,
                        returncode: code || 1,
                        original_command: cmd, // 保存完整的原始命令
                    });
                } else {
                    console.log(stdout);
                    resolve(null); // 成功执行，无需分析
                }
            });
        });
    } catch (e) {
        return Promise.resolve({
            command: cmd,
            error: (e as Error).message,
            returncode: 1,
            original_command: cmd,
        });
    }
}
