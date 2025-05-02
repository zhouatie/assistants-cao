"use strict";
/**
 * 命令执行和错误信息获取相关函数
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommand = executeCommand;
const child_process = __importStar(require("child_process"));
/**
 * 执行命令并捕获错误
 * @param command 要执行的命令数组
 * @returns 错误信息对象，如果成功执行则返回null
 */
function executeCommand(command) {
    // 对所有命令统一处理，不再区分ls命令
    const cmd = command.join(' ');
    try {
        const process = child_process.spawn(cmd, {
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        return new Promise((resolve) => {
            process.on('close', (code) => {
                if (code !== 0) {
                    resolve({
                        command: cmd,
                        error: stderr || stdout,
                        returncode: code || 1,
                        original_command: cmd, // 保存完整的原始命令
                    });
                }
                else {
                    console.log(stdout);
                    resolve(null); // 成功执行，无需分析
                }
            });
        });
    }
    catch (e) {
        return Promise.resolve({
            command: cmd,
            error: e.message,
            returncode: 1,
            original_command: cmd,
        });
    }
}
