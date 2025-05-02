/**
 * Configuration command-line interface for cao
 */

import * as fs from 'fs';

import * as readline from 'readline';
import * as config from './config';

/**
 * 列出所有配置的模型
 */
export function listModels(): void {
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
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // 封装readline的question方法为Promise
    function question(query: string): Promise<string> {
        return new Promise(resolve => {
            rl.question(query, answer => {
                resolve(answer);
            });
        });
    }

    console.log('\n欢迎使用 cao 配置向导！');
    console.log('='.repeat(50));

    // 列出当前模型
    listModels();

    let continueLoop = true;
    while (continueLoop) {
        console.log('\n可用操作:');
        console.log('1. 添加/更新模型');
        console.log('2. 删除模型');
        console.log('3. 设置默认模型');
        console.log('4. 退出');

        const choice = await question('\n请选择操作 [1-4]: ');

        switch (choice.trim()) {
            case '1': {
                const name = await question('输入供应商名称(英文): ');
                const apiBase = await question('输入 API 基础 URL: ');
                const model = await question('输入模型名称: ');
                const apiKey = await question('输入API密钥 (可选，留空则使用环境变量): ');

                if (name && apiBase && model) {
                    // 如果API密钥为空，传递undefined
                    const result = config.addModel(
                        name.trim(),
                        apiBase.trim(),
                        model.trim(),
                        apiKey.trim() || undefined
                    );
                    if (result) {
                        console.log(`已成功添加/更新模型 '${name}'`);
                    } else {
                        console.log(`添加/更新模型 '${name}' 失败`);
                    }
                } else {
                    console.log('错误: 供应商名称、API基础URL和模型名称都必须填写');
                }
                break;
            }

            case '2': {
                const models = config.getSupportedModels();
                const defaultModel = config.getDefaultModel();

                console.log('\n可移除的模型:');
                for (const modelName of Object.keys(models)) {
                    if (modelName !== defaultModel) {
                        console.log(`- ${modelName}`);
                    }
                }

                const modelToRemove = await question('\n输入要删除的模型名称 (或按回车返回): ');
                if (!modelToRemove.trim()) {
                    continue;
                }

                if (modelToRemove.trim() === defaultModel) {
                    console.log(`错误: 无法删除默认模型 '${modelToRemove}'`);
                    continue;
                }

                if (!(modelToRemove.trim() in models)) {
                    console.log(`错误: 模型 '${modelToRemove}' 不存在`);
                    continue;
                }

                const confirmRemove = await question(`确认删除模型 '${modelToRemove}'? [y/N]: `);
                if (confirmRemove.trim().toLowerCase() === 'y') {
                    const removeResult = config.removeModel(modelToRemove.trim());
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
                const availableModels = Object.keys(config.getSupportedModels());
                const currentDefault = config.getDefaultModel();

                console.log('\n可用模型:');
                for (const modelName of availableModels) {
                    const mark = modelName === currentDefault ? ' (当前默认)' : '';
                    console.log(`- ${modelName}${mark}`);
                }

                const newDefault = await question('\n输入要设为默认的模型名称 (或按回车返回): ');
                if (!newDefault.trim()) {
                    continue;
                }

                if (!(newDefault.trim() in config.getSupportedModels())) {
                    console.log(`错误: 模型 '${newDefault}' 不存在`);
                    continue;
                }

                if (newDefault.trim() === currentDefault) {
                    console.log(`'${newDefault}' 已经是默认模型`);
                    continue;
                }

                const setDefaultResult = config.setDefaultModel(newDefault.trim());
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

            default:
                console.log('无效的选择，请输入 1-4 之间的数字');
                break;
        }
    }

    rl.close();
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
