/**
 * Configuration command-line interface for cao
 */

import * as fs from 'fs';
import inquirer from 'inquirer';
import * as config from './config';

/**
 * 列出所有配置的模型
 */
export function listModels(): void {
    // 强制重新从文件加载配置，确保获取最新数据
    const models = config.getSupportedModels();
    const defaultModel = config.getDefaultModel();

    console.log('\n现有配置的模型:');
    console.log('-'.repeat(60));
    console.log(
        `${'模型名称'.padEnd(15)} ${'默认'.padEnd(8)} ${'API基础URL'.padEnd(25)} ${'模型名'}`
    );
    console.log('-'.repeat(60));

    for (const [name, modelConfig] of Object.entries(models)) {
        const isDefault = name === defaultModel ? '✓' : '';
        console.log(
            `${name.padEnd(15)} ${isDefault.padEnd(8)} ${modelConfig.api_base.padEnd(25)} ${modelConfig.model}`
        );
    }

    console.log('-'.repeat(60));
}

/**
 * 交互式配置模式
 */
export async function interactiveConfig(): Promise<void> {
    console.log('\n欢迎使用 cao 配置向导！');
    console.log('='.repeat(50));

    // 列出当前模型
    listModels();

    let continueLoop = true;
    while (continueLoop) {
        // 主菜单选项
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: '请选择操作:',
                choices: [
                    { name: '添加/更新模型', value: '1' },
                    { name: '删除模型', value: '2' },
                    { name: '设置默认模型', value: '3' },
                    { name: '退出', value: '4' }
                ]
            }
        ]);

        switch (action) {
            case '1': {
                // 添加/更新模型
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: '输入供应商名称(英文):',
                        validate: (input: string) => input.trim() !== '' ? true : '供应商名称不能为空'
                    },
                    {
                        type: 'input',
                        name: 'apiBase',
                        message: '输入 API 基础 URL:',
                        validate: (input: string) => input.trim() !== '' ? true : 'API 基础 URL 不能为空'
                    },
                    {
                        type: 'input',
                        name: 'model',
                        message: '输入模型名称:',
                        validate: (input: string) => input.trim() !== '' ? true : '模型名称不能为空'
                    },
                    {
                        type: 'input',
                        name: 'apiKey',
                        message: '输入API密钥 (可选，留空则使用环境变量):',
                    }
                ]);

                // 如果API密钥为空，传递undefined
                const result = config.addModel(
                    answers.name.trim(),
                    answers.apiBase.trim(),
                    answers.model.trim(),
                    answers.apiKey.trim() || undefined
                );
                
                if (result) {
                    console.log(`已成功添加/更新模型 '${answers.name}'`);
                } else {
                    console.log(`添加/更新模型 '${answers.name}' 失败`);
                }
                break;
            }

            case '2': {
                // 删除模型
                const models = config.getSupportedModels();
                const defaultModel = config.getDefaultModel();
                
                // 过滤掉默认模型，不允许删除
                const availableModels = Object.keys(models)
                    .filter(name => name !== defaultModel);
                
                if (availableModels.length === 0) {
                    console.log('没有可以删除的模型（不能删除默认模型）');
                    break;
                }
                
                // 添加一个取消选项
                const choices = [
                    ...availableModels,
                    new inquirer.Separator(),
                    '返回'
                ];
                
                const { modelToRemove } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'modelToRemove',
                        message: '选择要删除的模型:',
                        choices: choices
                    }
                ]);
                
                if (modelToRemove === '返回') {
                    break;
                }
                
                const { confirmRemove } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmRemove',
                        message: `确认删除模型 '${modelToRemove}'?`,
                        default: false
                    }
                ]);
                
                if (confirmRemove) {
                    const removeResult = config.removeModel(modelToRemove);
                    if (removeResult) {
                        console.log(`已成功删除模型 '${modelToRemove}'`);
                    } else {
                        console.log(`删除模型 '${modelToRemove}' 失败`);
                    }
                } else {
                    console.log('操作已取消');
                }
                break;
            }

            case '3': {
                // 设置默认模型
                const availableModels = Object.keys(config.getSupportedModels());
                const currentDefault = config.getDefaultModel();
                
                // 为模型添加标记，显示当前默认
                const choices = availableModels.map(name => ({
                    name: name === currentDefault ? `${name} (当前默认)` : name,
                    value: name,
                    short: name
                }));
                
                const { newDefault } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'newDefault',
                        message: '选择要设为默认的模型:',
                        choices: choices,
                        default: currentDefault
                    }
                ]);
                
                if (newDefault === currentDefault) {
                    console.log(`'${newDefault}' 已经是默认模型`);
                    break;
                }
                
                const setDefaultResult = config.setDefaultModel(newDefault);
                if (setDefaultResult) {
                    console.log(`已将 '${newDefault}' 设置为默认模型`);
                } else {
                    console.log(`设置默认模型失败`);
                }
                break;
            }

            case '4': {
                console.log('配置已保存，退出配置向导');
                continueLoop = false;
                break;
            }
        }
    }
}

/**
 * 运行配置CLI
 * @param args 命令行参数
 */
export function runConfigCli(args: string[]): void {
    // 简易参数解析
    if (args.length === 0 || args[0] === 'list') {
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
    } else if (args[0] === 'interactive') {
        interactiveConfig();
    } else {
        console.log('用法:');
        console.log('  cao-config list                    - 列出所有配置的模型');
        console.log('  cao-config add NAME URL MODEL      - 添加或更新模型');
        console.log('  cao-config remove NAME             - 删除模型');
        console.log('  cao-config default NAME            - 设置默认模型');
        console.log('  cao-config export [FILE]           - 导出配置');
        console.log('  cao-config import FILE             - 导入配置');
        console.log('  cao-config path                    - 显示配置文件路径');
        console.log('  cao-config interactive             - 交互式配置');
    }
}
