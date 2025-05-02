"use strict";
/**
 * 命令行参数解析模块
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
exports.parseArgs = parseArgs;
const config = __importStar(require("../config"));
/**
 * 解析命令行参数
 * @param program Commander程序实例
 */
function parseArgs(program) {
    // 获取用户配置的模型
    const SUPPORTED_MODELS = config.getSupportedModels();
    const DEFAULT_MODEL = config.getDefaultModel();
    program
        .version('1.0.0')
        .description('捕获终端错误并通过 AI 分析')
        .option('-m, --model <model>', `选择 AI 模型 (默认: ${DEFAULT_MODEL})`, DEFAULT_MODEL)
        .option('-d, --debug', '开启调试模式')
        .option('--config', '配置 AI 模型')
        .parse(process.argv);
}
