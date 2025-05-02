/**
 * UI 组件
 */
import inquirer from 'inquirer';
import { theme, createTitle, createSubTitle, createInfoBox, createTable } from './theme';

/**
 * 显示欢迎画面
 * @returns 渲染后的欢迎画面
 */
export function showWelcomeScreen(): string {
    const appTitle = `CAO 配置向导`;
    const appVersion = 'v1.0.0'; // 版本号应从package.json中获取
    
    const logoArt = `
    ██████╗ █████╗  ██████╗ 
   ██╔════╝██╔══██╗██╔═══██╗
   ██║     ███████║██║   ██║
   ██║     ██╔══██║██║   ██║
   ╚██████╗██║  ██║╚██████╔╝
    ╚═════╝╚═╝  ╚═╝ ╚═════╝ `;
    
    return `
${theme.primary(logoArt)}
${createTitle(appTitle)}
${theme.info(`${' '.repeat(Math.floor((appTitle.length - appVersion.length) / 2) + 15)}${appVersion}`)}

${theme.text('AI 配置管理工具 - 让您的 AI 工作流程更高效')}
`;
}

/**
 * 显示主菜单
 * @returns Promise 解析为用户选择的选项
 */
export async function showMainMenu(): Promise<string> {
    console.clear();
    console.log(showWelcomeScreen());
    
    const menuChoices = [
        {
            name: `${theme.primary('➕')} 添加/更新模型配置`,
            value: '1',
            short: '添加/更新模型'
        },
        {
            name: `${theme.danger('➖')} 删除模型配置`,
            value: '2',
            short: '删除模型'
        },
        {
            name: `${theme.info('⭐')} 设置默认模型`,
            value: '3',
            short: '设置默认模型'
        },
        new inquirer.Separator(theme.divider('─'.repeat(50))),
        {
            name: `${theme.success('📤')} 导出配置`,
            value: '5',
            short: '导出配置'
        },
        {
            name: `${theme.warning('📥')} 导入配置`,
            value: '6',
            short: '导入配置'
        },
        new inquirer.Separator(theme.divider('─'.repeat(50))),
        {
            name: `${theme.secondary('🚪')} 退出配置向导`,
            value: '4',
            short: '退出'
        }
    ];
    
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: theme.primary('请选择要执行的操作:'),
            choices: menuChoices,
            pageSize: 10
        }
    ]);
    
    return action;
}

/**
 * 显示模型列表
 * @param models 模型配置对象
 * @param defaultModel 默认模型名称
 * @returns 渲染后的模型列表
 */
export function showModelList(models: { [key: string]: any }, defaultModel: string): string {
    console.log(createSubTitle(' 已配置的模型 '));
    
    const headers = ['模型名称', '默认', 'API基础URL', '模型标识符'];
    
    const rows = Object.entries(models).map(([name, config]) => [
        name,
        name === defaultModel ? '✓' : '',
        config.api_base,
        config.model
    ]);
    
    return createTable(headers, rows);
}

/**
 * 添加模型表单
 * @returns Promise 解析为用户输入的模型数据
 */
export async function showAddModelForm() {
    console.clear();
    console.log(createTitle('添加/更新模型配置'));
    
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: theme.primary('供应商名称 (英文):'),
            prefix: '🏷️ ',
            validate: (input: string) => input.trim() !== '' ? true : '供应商名称不能为空'
        },
        {
            type: 'input',
            name: 'apiBase',
            message: theme.primary('API 基础 URL:'),
            prefix: '🔗 ',
            validate: (input: string) => {
                if (input.trim() === '') return 'API 基础 URL 不能为空';
                
                try {
                    new URL(input);
                    return true;
                } catch (e) {
                    return '请输入有效的 URL 格式';
                }
            }
        },
        {
            type: 'input',
            name: 'model',
            message: theme.primary('模型标识符:'),
            prefix: '🤖 ',
            validate: (input: string) => input.trim() !== '' ? true : '模型标识符不能为空'
        },
        {
            type: 'password',
            name: 'apiKey',
            message: theme.primary('API密钥 (可选，留空则使用环境变量):'),
            prefix: '🔑 ',
            mask: '*'
        }
    ]);
    
    return {
        name: answers.name.trim(),
        apiBase: answers.apiBase.trim(),
        model: answers.model.trim(),
        apiKey: answers.apiKey.trim() || undefined
    };
}

/**
 * 删除模型选择
 * @param models 可删除的模型列表
 * @returns Promise 解析为用户选择的模型名称，或取消操作
 */
export async function showDeleteModelMenu(models: string[]): Promise<string | null> {
    if (models.length === 0) {
        console.log(createInfoBox('没有可以删除的模型（不能删除默认模型）', 'warning'));
        await promptContinue();
        return null;
    }
    
    console.clear();
    console.log(createTitle('删除模型配置'));
    
    // 为模型添加图标
    const choices = [
        ...models.map(name => ({
            name: `${theme.danger('🗑️')} ${name}`,
            value: name,
            short: name
        })),
        new inquirer.Separator(),
        {
            name: `${theme.secondary('↩️')} 返回主菜单`,
            value: 'cancel',
            short: '返回'
        }
    ];
    
    const { modelToRemove } = await inquirer.prompt([
        {
            type: 'list',
            name: 'modelToRemove',
            message: theme.primary('选择要删除的模型:'),
            choices: choices,
            pageSize: 10
        }
    ]);
    
    if (modelToRemove === 'cancel') {
        return null;
    }
    
    // 显示确认对话框
    const { confirmRemove } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmRemove',
            message: theme.warning(`确认删除模型 '${modelToRemove}'?`),
            default: false,
            prefix: '⚠️ '
        }
    ]);
    
    return confirmRemove ? modelToRemove : null;
}

/**
 * 设置默认模型选择
 * @param models 模型列表
 * @param currentDefault 当前默认模型
 * @returns Promise 解析为用户选择的模型名称
 */
export async function showDefaultModelMenu(
    models: { [key: string]: any }, 
    currentDefault: string
): Promise<string> {
    console.clear();
    console.log(createTitle('设置默认模型'));
    
    // 显示当前默认模型
    console.log(createInfoBox(`当前默认模型: ${theme.highlight(currentDefault)}`, 'info'));
    console.log('');
    
    // 为模型添加标记，显示当前默认
    const choices = Object.keys(models).map(name => ({
        name: name === currentDefault ? 
            `${theme.success('✓')} ${name} ${theme.info('(当前默认)')}` : 
            `${theme.info('○')} ${name}`,
        value: name,
        short: name
    }));
    
    const { newDefault } = await inquirer.prompt([
        {
            type: 'list',
            name: 'newDefault',
            message: theme.primary('选择要设为默认的模型:'),
            choices: choices,
            default: currentDefault,
            pageSize: 10
        }
    ]);
    
    return newDefault;
}

/**
 * 导出配置表单
 * @returns Promise 解析为用户输入的文件路径或undefined
 */
export async function showExportForm(): Promise<string | undefined> {
    console.clear();
    console.log(createTitle('导出配置'));
    
    const { exportType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'exportType',
            message: theme.primary('请选择导出方式:'),
            choices: [
                { 
                    name: `${theme.info('📄')} 导出到屏幕`, 
                    value: 'screen',
                    short: '导出到屏幕'
                },
                { 
                    name: `${theme.success('💾')} 导出到文件`, 
                    value: 'file',
                    short: '导出到文件'
                },
                { 
                    name: `${theme.secondary('↩️')} 返回主菜单`, 
                    value: 'cancel',
                    short: '返回'
                }
            ]
        }
    ]);
    
    if (exportType === 'cancel') {
        return undefined;
    }
    
    if (exportType === 'screen') {
        return '';
    }
    
    // 导出到文件，询问文件路径
    const { filePath } = await inquirer.prompt([
        {
            type: 'input',
            name: 'filePath',
            message: theme.primary('请输入导出文件路径:'),
            prefix: '📂 ',
            validate: (input: string) => input.trim() !== '' ? true : '文件路径不能为空',
            default: './cao-config.json'
        }
    ]);
    
    return filePath.trim();
}

/**
 * 导入配置表单
 * @returns Promise 解析为用户输入的文件路径或undefined
 */
export async function showImportForm(): Promise<string | undefined> {
    console.clear();
    console.log(createTitle('导入配置'));
    
    const { filePath } = await inquirer.prompt([
        {
            type: 'input',
            name: 'filePath',
            message: theme.primary('请输入导入文件路径:'),
            prefix: '📂 ',
            validate: (input: string) => input.trim() !== '' ? true : '文件路径不能为空'
        }
    ]);
    
    // 询问确认
    const { confirmImport } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmImport',
            message: theme.warning('导入将覆盖现有配置，确认继续?'),
            default: false,
            prefix: '⚠️ '
        }
    ]);
    
    return confirmImport ? filePath.trim() : undefined;
}

/**
 * 显示操作结果
 * @param message 消息内容
 * @param type 消息类型
 */
export function showResult(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    console.log('\n' + createInfoBox(message, type) + '\n');
}

/**
 * 提示按任意键继续
 * @returns Promise
 */
export async function promptContinue(): Promise<void> {
    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: theme.secondary('按 Enter 键继续...'),
            prefix: '👉'
        }
    ]);
}
