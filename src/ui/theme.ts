/**
 * UI 主题配置
 */
import chalk from 'chalk';

export const theme = {
    // 主要颜色
    primary: chalk.hex('#4299E1'),    // 蓝色
    secondary: chalk.hex('#805AD5'),  // 紫色
    success: chalk.hex('#48BB78'),    // 绿色
    danger: chalk.hex('#F56565'),     // 红色
    warning: chalk.hex('#ECC94B'),    // 黄色
    info: chalk.hex('#4FD1C5'),       // 青色
    
    // 背景色
    bgPrimary: chalk.bgHex('#4299E1').black,
    bgSecondary: chalk.bgHex('#805AD5').white,
    bgSuccess: chalk.bgHex('#48BB78').black,
    bgDanger: chalk.bgHex('#F56565').white,
    bgWarning: chalk.bgHex('#ECC94B').black,
    bgInfo: chalk.bgHex('#4FD1C5').black,
    
    // 文本样式
    title: chalk.bold.hex('#2D3748'),       // 大标题
    subtitle: chalk.hex('#4A5568'),         // 小标题
    heading: chalk.bold.hex('#2D3748'),     // 标题
    text: chalk.hex('#4A5568'),             // 正文
    dimmed: chalk.hex('#718096'),           // 弱化文本
    highlight: chalk.bold.hex('#4299E1'),   // 高亮文本
    
    // 框架元素
    border: chalk.hex('#CBD5E0'),
    divider: chalk.hex('#E2E8F0'),
};

/**
 * 创建标题
 * @param text 标题文本
 * @returns 格式化后的标题
 */
export function createTitle(text: string): string {
    const line = '═'.repeat(text.length + 8);
    return `
${theme.primary(line)}
${theme.primary('═══')} ${theme.title(text)} ${theme.primary('═══')}
${theme.primary(line)}`;
}

/**
 * 创建副标题
 * @param text 副标题文本
 * @returns 格式化后的副标题
 */
export function createSubTitle(text: string): string {
    return `${theme.heading('┌' + '─'.repeat(text.length + 2) + '┐')}
${theme.heading('│')} ${theme.subtitle(text)} ${theme.heading('│')}
${theme.heading('└' + '─'.repeat(text.length + 2) + '┘')}`;
}

/**
 * 创建信息框
 * @param text 信息文本
 * @param type 信息类型
 * @returns 格式化后的信息框
 */
export function createInfoBox(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
    let icon = '●';
    let colorFn = theme.info;
    
    switch (type) {
        case 'success':
            icon = '✓';
            colorFn = theme.success;
            break;
        case 'warning':
            icon = '⚠';
            colorFn = theme.warning;
            break;
        case 'error':
            icon = '✗';
            colorFn = theme.danger;
            break;
        default:
            icon = 'ℹ';
            colorFn = theme.info;
    }
    
    const lines = text.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    const border = '─'.repeat(maxLength + 4);
    
    return `${colorFn('┌' + border + '┐')}
${colorFn('│')}  ${icon} ${lines[0].padEnd(maxLength, ' ')}  ${colorFn('│')}
${lines.slice(1).map(line => `${colorFn('│')}    ${line.padEnd(maxLength, ' ')}  ${colorFn('│')}`).join('\n')}
${colorFn('└' + border + '┘')}`;
}

/**
 * 创建表格
 * @param headers 表头
 * @param rows 行数据
 * @param options 表格选项
 * @returns 格式化后的表格
 */
export function createTable(
    headers: string[], 
    rows: string[][], 
    options: { 
        highlightIndex?: number, 
        highlightValue?: string 
    } = {}
): string {
    // 计算每列宽度
    const widths = headers.map((header, i) => 
        Math.max(
            header.length,
            ...rows.map(row => row[i]?.toString().length || 0)
        )
    );
    
    // 创建分隔线
    const divider = '+' + widths.map(w => '─'.repeat(w + 2)).join('+') + '+';
    
    // 创建表头
    const headerRow = '│ ' + headers.map((h, i) => theme.heading(h.padEnd(widths[i]))).join(' │ ') + ' │';
    
    // 创建数据行
    const dataRows = rows.map((row, rowIndex) => {
        return '│ ' + row.map((cell, colIndex) => {
            const value = cell?.toString() || '';
            
            // 根据配置高亮特定行或值
            if (
                (options.highlightIndex !== undefined && rowIndex === options.highlightIndex) ||
                (options.highlightValue !== undefined && value === options.highlightValue)
            ) {
                return theme.highlight(value.padEnd(widths[colIndex]));
            }
            
            return theme.text(value.padEnd(widths[colIndex]));
        }).join(' │ ') + ' │';
    });
    
    return [
        theme.border(divider),
        theme.border(headerRow),
        theme.border(divider),
        ...dataRows.map(row => theme.border(row)),
        theme.border(divider)
    ].join('\n');
}

/**
 * 创建进度条
 * @param current 当前值
 * @param total 总值
 * @param width 进度条宽度
 * @returns 格式化后的进度条
 */
export function createProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.min(100, Math.floor((current / total) * 100));
    const filledWidth = Math.floor((width * percentage) / 100);
    const emptyWidth = width - filledWidth;
    
    const filledPart = theme.primary('█'.repeat(filledWidth));
    const emptyPart = theme.dimmed('░'.repeat(emptyWidth));
    
    return `${filledPart}${emptyPart} ${theme.text(percentage + '%')}`;
}
