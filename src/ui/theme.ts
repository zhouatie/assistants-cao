/**
 * UI 主题配置
 */
import chalk from 'chalk';
import Table from 'cli-table3';
import { stdout } from 'process';

/**
 * 获取终端窗口宽度
 * @returns 当前终端宽度
 */
export function getTerminalWidth(): number {
    return stdout.columns || 80; // 默认为80，如果无法获取
}

export const theme = {
    // 主要颜色
    primary: chalk.hex('#4299E1'), // 蓝色
    secondary: chalk.hex('#805AD5'), // 紫色
    success: chalk.hex('#48BB78'), // 绿色
    danger: chalk.hex('#F56565'), // 红色
    warning: chalk.hex('#ECC94B'), // 黄色
    info: chalk.hex('#4FD1C5'), // 青色

    // 背景色
    bgPrimary: chalk.bgHex('#4299E1').black,
    bgSecondary: chalk.bgHex('#805AD5').white,
    bgSuccess: chalk.bgHex('#48BB78').black,
    bgDanger: chalk.bgHex('#F56565').white,
    bgWarning: chalk.bgHex('#ECC94B').black,
    bgInfo: chalk.bgHex('#4FD1C5').black,

    // 文本样式
    title: chalk.bold.hex('#2D3748'), // 大标题
    subtitle: chalk.hex('#4A5568'), // 小标题
    heading: chalk.bold.hex('#2D3748'), // 标题
    text: chalk.hex('#4A5568'), // 正文
    dimmed: chalk.hex('#718096'), // 弱化文本
    highlight: chalk.bold.hex('#4299E1'), // 高亮文本

    // 框架元素
    border: chalk.hex('#CBD5E0'),
    divider: chalk.hex('#E2E8F0'),
};

// cli-table3 表格样式配置
export const tableStyle = {
    chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
    },
    style: {
        'padding-left': 1,
        'padding-right': 1,
        head: ['bold'],
        border: [theme.border('')],
    },
};

/**
 * 创建标题
 * @param text 标题文本
 * @returns 格式化后的标题
 */
export function createTitle(text: string): string {
    const line = '─'.repeat(text.length + 8);
    return `
${theme.primary(line)}
${theme.primary('───')} ${theme.title(text)} ${theme.primary('───')}
${theme.primary(line)}`;
}

/**
 * 创建副标题
 * @param text 副标题文本
 * @returns 格式化后的副标题
 */
export function createSubTitle(text: string): string {
    const table = new Table({
        chars: {
            top: '─',
            'top-mid': '─',
            'top-left': '┌',
            'top-right': '┐',
            bottom: '─',
            'bottom-mid': '─',
            'bottom-left': '└',
            'bottom-right': '┘',
            left: '│',
            'left-mid': '│',
            mid: '─',
            'mid-mid': '─',
            right: '│',
            'right-mid': '│',
            middle: ' ',
        },
        style: {
            head: [],
            border: [theme.heading('')],
            'padding-left': 1,
            'padding-right': 1,
        },
        colWidths: [text.length * 2],
    });

    table.push([theme.subtitle(text)]);
    return table.toString();
}

/**
 * 创建信息框
 * @param text 信息文本
 * @param type 信息类型
 * @returns 格式化后的信息框
 */
export function createInfoBox(
    text: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
): string {
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

    const table = new Table({
        chars: {
            top: '─',
            'top-mid': '─',
            'top-left': '┌',
            'top-right': '┐',
            bottom: '─',
            'bottom-mid': '─',
            'bottom-left': '└',
            'bottom-right': '┘',
            left: '│',
            'left-mid': '│',
            mid: '─',
            'mid-mid': '─',
            right: '│',
            'right-mid': '│',
            middle: ' ',
        },
        style: {
            head: [],
            border: [colorFn('')],
            'padding-left': 1,
            'padding-right': 1,
        },
        colWidths: [maxLength + 4],
    });

    // 添加第一行带有图标
    table.push([`${icon} ${lines[0]}`]);

    // 添加其余行
    lines.slice(1).forEach(line => {
        table.push([`  ${line}`]);
    });

    return table.toString();
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
        highlightIndex?: number;
        highlightValue?: string;
        width?: number;
        noTruncate?: string[]; // 不需要截断的列名
    } = {}
): string {
    // 计算表格宽度
    const terminalWidth = options.width || getTerminalWidth();
    const availableWidth = Math.max(40, terminalWidth - 4); // 预留一些边距

    // 根据列数平均分配宽度，同时考虑内容长度
    const colCount = headers.length;
    const colWidths: number[] = [];

    // 默认情况下所有列都显示完整内容，只有 API基础URL 列允许截断
    const truncateColumns = ['API基础URL'];

    if (colCount > 0) {
        // 计算每列内容的最大长度
        const contentLengths = headers.map((header, index) => {
            const headerLength = header.length;
            const maxContentLength = rows.reduce((max, row) => {
                const cellContent = (row[index] || '').toString();
                return Math.max(max, cellContent.length);
            }, 0);
            return Math.max(headerLength, maxContentLength);
        });

        // 只有 API基础URL 列需要自适应，其他列使用完整内容宽度
        const apiBaseIndex = headers.findIndex(h => h === 'API基础URL');

        // 计算固定列宽度总和（除了允许截断的列）
        let fixedColumnsWidth = 0;
        headers.forEach((header, index) => {
            if (!truncateColumns.includes(header)) {
                fixedColumnsWidth += contentLengths[index] + 4; // +4 是考虑边距
                colWidths[index] = contentLengths[index] + 2; // 内容长度加2个字符的内边距
            }
        });

        // 为可截断列分配剩余宽度
        if (apiBaseIndex !== -1) {
            const apiColumnWidth = availableWidth - fixedColumnsWidth;
            colWidths[apiBaseIndex] = Math.max(10, apiColumnWidth); // 至少10个字符宽度
        }

        // 确保所有列都有宽度
        headers.forEach((header, index) => {
            if (colWidths[index] === undefined) {
                // 对于可截断列，分配动态宽度
                if (truncateColumns.includes(header)) {
                    // 这些列已经在上面的逻辑中处理了
                } else {
                    // 对于其他未处理的列，使用内容长度
                    colWidths[index] = Math.max(5, contentLengths[index] + 2);
                }
            }
        });
    }

    // 设置表格选项
    const tableOptions: any = {
        head: headers.map(header => theme.heading(header)),
        colWidths: colWidths.length > 0 ? colWidths : undefined,
        ...tableStyle,
    };

    // 创建表格实例
    const table = new Table(tableOptions);

    // 添加数据行
    rows.forEach((row, rowIndex) => {
        const formattedRow = row.map(cell => {
            const value = cell?.toString() || '';

            // 根据配置高亮特定行或值
            if (
                (options.highlightIndex !== undefined && rowIndex === options.highlightIndex) ||
                (options.highlightValue !== undefined && value === options.highlightValue)
            ) {
                return theme.highlight(value);
            }

            return theme.text(value);
        });

        table.push(formattedRow);
    });

    return table.toString();
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
