/**
 * 增强版配置命令行界面
 */

import * as fs from 'fs';
import * as config from './config';
import { 
    showWelcomeScreen, 
    showMainMenu, 
    showModelList, 
    showAddModelForm,
    showDeleteModelMenu,
    showDefaultModelMenu,
    showExportForm,
    showImportForm,
    showResult,
    promptContinue
} from './ui/components';

/**
 * 列出所有配置的模型
 */
export function listModels(): void {
    // 直接调用新的列出模型命令
    const { listAllModels } = require('./commands/list_models');
    listAllModels();
}

/**
 * 增强交互式配置模式
 */
export async function interactiveConfig(): Promise<void> {
    console.clear();
    console.log(showWelcomeScreen());
    
    let continueLoop = true;
    while (continueLoop) {
        // 显示主菜单并获取用户选择
        const action = await showMainMenu();

        switch (action) {
            case '1': {
                // 添加/更新模型
                const modelData = await showAddModelForm();
                
                // 使用API密钥为undefined时，表示留空使用环境变量
                const result = config.addModel(
                    modelData.name,
                    modelData.apiBase,
                    modelData.model,
                    modelData.apiKey
                );
                
                if (result) {
                    showResult(`已成功添加/更新模型 '${modelData.name}'`, 'success');
                } else {
                    showResult(`添加/更新模型 '${modelData.name}' 失败`, 'error');
                }
                
                await promptContinue();
                break;
            }

            case '2': {
                // 删除模型
                const models = config.getSupportedModels();
                const defaultModel = config.getDefaultModel();
                
                // 过滤掉默认模型，不允许删除
                const availableModels = Object.keys(models)
                    .filter(name => name !== defaultModel);
                
                const modelToRemove = await showDeleteModelMenu(availableModels);
                
                if (modelToRemove) {
                    const removeResult = config.removeModel(modelToRemove);
                    
                    if (removeResult) {
                        showResult(`已成功删除模型 '${modelToRemove}'`, 'success');
                    } else {
                        showResult(`删除模型 '${modelToRemove}' 失败`, 'error');
                    }
                    
                    await promptContinue();
                }
                break;
            }

            case '3': {
                // 设置默认模型
                const models = config.getSupportedModels();
                const currentDefault = config.getDefaultModel();
                
                const newDefault = await showDefaultModelMenu(models, currentDefault);
                
                if (newDefault === currentDefault) {
                    showResult(`'${newDefault}' 已经是默认模型`, 'info');
                    await promptContinue();
                    break;
                }
                
                const setDefaultResult = config.setDefaultModel(newDefault);
                
                if (setDefaultResult) {
                    showResult(`已将 '${newDefault}' 设置为默认模型`, 'success');
                } else {
                    showResult(`设置默认模型失败`, 'error');
                }
                
                await promptContinue();
                break;
            }

            case '4': {
                // 退出
                console.clear();
                showResult('配置已保存，感谢使用 CAO 配置向导', 'info');
                continueLoop = false;
                break;
            }
            
            case '5': {
                // 导出配置
                const filepath = await showExportForm();
                
                if (filepath === undefined) {
                    break;
                }
                
                const configData = config.loadConfig();
                
                if (filepath === '') {
                    // 导出到屏幕
                    console.clear();
                    console.log('\n配置内容:\n');
                    console.log(JSON.stringify(configData, null, 2));
                    console.log('\n');
                    await promptContinue();
                } else {
                    // 导出到文件
                    try {
                        fs.writeFileSync(filepath, JSON.stringify(configData, null, 2));
                        showResult(`配置已成功导出到 ${filepath}`, 'success');
                    } catch (e) {
                        showResult(`导出配置失败: ${(e as Error).message}`, 'error');
                    }
                    
                    await promptContinue();
                }
                break;
            }
            
            case '6': {
                // 导入配置
                const filepath = await showImportForm();
                
                if (filepath === undefined) {
                    break;
                }
                
                try {
                    const configData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

                    // 验证配置格式
                    if (!('models' in configData) || typeof configData.models !== 'object') {
                        showResult("导入的配置文件格式不正确。必须包含 'models' 字典。", 'error');
                        await promptContinue();
                        break;
                    }

                    if (!('default_model' in configData) || typeof configData.default_model !== 'string') {
                        showResult("导入的配置文件格式不正确。必须包含 'default_model' 字符串。", 'error');
                        await promptContinue();
                        break;
                    }

                    // 保存导入的配置
                    const result = config.saveConfig(configData);
                    
                    if (result) {
                        showResult('配置已成功导入', 'success');
                    } else {
                        showResult('导入配置失败', 'error');
                    }
                    
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        showResult('导入的文件不是有效的 JSON 格式', 'error');
                    } else {
                        showResult(`导入配置失败: ${(e as Error).message}`, 'error');
                    }
                }
                
                await promptContinue();
                break;
            }
        }
    }
}

/**
 * 运行增强版配置CLI
 * @param args 命令行参数
 */
export function runConfigCli(args: string[]): void {
    // 如果没有参数，或者指定interactive模式，使用增强界面
    if (args.length === 0 || args[0] === 'interactive') {
        interactiveConfig();
        return;
    }
    
    // 其他命令行参数继续使用旧版处理逻辑
    if (args[0] === 'list') {
        listModels();
    } else if (args[0] === 'add' && args.length >= 4) {
        const [, name, apiBase, model, apiKey] = args;
        const result = config.addModel(name, apiBase, model, apiKey);
        if (result) {
            console.log(`已成功添加/更新模型 '${name}'`);
        } else {
            console.log(`添加/更新模型 '${name}' 失败`);
        }
    } else if (args[0] === 'remove' && args.length >= 2) {
        const name = args[1];
        const result = config.removeModel(name);
        if (result) {
            console.log(`已成功删除模型 '${name}'`);
        } else {
            console.log(`无法删除模型 '${name}'。它可能是默认模型或不存在。`);
        }
    } else if (args[0] === 'default' && args.length >= 2) {
        const name = args[1];
        const result = config.setDefaultModel(name);
        if (result) {
            console.log(`已将 '${name}' 设置为默认模型`);
        } else {
            console.log(`无法将 '${name}' 设置为默认模型。请确认该模型已配置。`);
        }
    } else if (args[0] === 'export') {
        const configData = config.loadConfig();
        if (args.length >= 2) {
            try {
                fs.writeFileSync(args[1], JSON.stringify(configData, null, 2));
                console.log(`配置已导出到 ${args[1]}`);
            } catch (e) {
                console.error(`导出配置失败: ${(e as Error).message}`);
            }
        } else {
            console.log(JSON.stringify(configData, null, 2));
        }
    } else if (args[0] === 'import' && args.length >= 2) {
        try {
            const configData = JSON.parse(fs.readFileSync(args[1], 'utf8'));

            // 验证配置格式
            if (!('models' in configData) || typeof configData.models !== 'object') {
                console.log("错误: 导入的配置文件格式不正确。必须包含 'models' 字典。");
                return;
            }

            if (!('default_model' in configData) || typeof configData.default_model !== 'string') {
                console.log("错误: 导入的配置文件格式不正确。必须包含 'default_model' 字符串。");
                return;
            }

            // 保存导入的配置
            const result = config.saveConfig(configData);
            if (result) {
                console.log('配置已成功导入');
            } else {
                console.log('导入配置失败');
            }
        } catch (e) {
            if (e instanceof SyntaxError) {
                console.log('错误: 导入的文件不是有效的 JSON 格式');
            } else {
                console.log(`导入配置失败: ${(e as Error).message}`);
            }
        }
    } else if (args[0] === 'path') {
        const configFile = config.getConfigFile();
        console.log(`配置文件路径: ${configFile}`);
    } else {
        console.log('用法:');
        console.log('  cao-config                       - 启动交互式配置向导');
        console.log('  cao-config interactive           - 启动交互式配置向导');
        console.log('  cao-config list                  - 列出所有配置的模型');
        console.log('  cao-config add NAME URL MODEL    - 添加或更新模型');
        console.log('  cao-config remove NAME           - 删除模型');
        console.log('  cao-config default NAME          - 设置默认模型');
        console.log('  cao-config export [FILE]         - 导出配置');
        console.log('  cao-config import FILE           - 导入配置');
        console.log('  cao-config path                  - 显示配置文件路径');
    }
}
