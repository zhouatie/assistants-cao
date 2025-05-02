/**
 * 终端相关的辅助函数
 */

import chalk from 'chalk';

/**
 * 获取终端窗口大小
 * @returns [宽度, 高度] 元组
 */
export function getTerminalSize(): [number, number] {
    // 获取终端窗口大小
    if (process.stdout.columns && process.stdout.rows) {
        return [process.stdout.columns, process.stdout.rows];
    }
    return [80, 24]; // 默认大小
}

/**
 * 获取字符串在终端中的显示宽度，考虑中文等宽字符和ANSI颜色代码
 * @param s 字符串
 * @returns 显示宽度
 */
export function getStringDisplayWidth(s: string): number {
    // 去除所有ANSI颜色代码
    // eslint-disable-next-line no-control-regex
    const cleanString = s.replace(/\u001b\[\d+(;\d+)*m/g, '');

    let width = 0;
    for (const char of cleanString) {
        // 中文字符宽字符通常显示宽度为2
        if (char.charCodeAt(0) > 127) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

/**
 * 处理文本换行，将文本按照指定宽度拆分成多行
 * @param text 要处理的文本
 * @param contentWidth 内容区域宽度
 * @returns 拆分后的文本行列表
 */
function processTextToLines(text: string, contentWidth: number): string[] {
    const lines: string[] = [];
    for (const line of text.split('\n')) {
        if (getStringDisplayWidth(line) <= contentWidth) {
            lines.push(line);
        } else {
            // 长行分割
            const isCJKText = Array.from(line).some(c => c.charCodeAt(0) > 127);

            if (isCJKText) {
                // 中文文本按字符拆分
                let currentLine = '';
                for (const char of line) {
                    const testLine = currentLine + char;
                    if (getStringDisplayWidth(testLine) <= contentWidth) {
                        currentLine = testLine;
                    } else {
                        lines.push(currentLine);
                        currentLine = char;
                    }
                }
                if (currentLine) {
                    lines.push(currentLine);
                }
            } else {
                // 英文文本按单词拆分
                const words = line.split(' ');
                let currentLine = '';
                for (const word of words) {
                    const testLine = currentLine + (currentLine ? ' ' : '') + word;
                    if (getStringDisplayWidth(testLine) <= contentWidth) {
                        currentLine = testLine;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                if (currentLine) {
                    lines.push(currentLine);
                }
            }
        }
    }
    return lines;
}

/**
 * 以标准模式（带边框）打印文本
 * @param text 要打印的文本
 */
function printNormalMode(text: string): void {
    const [terminalWidth] = getTerminalSize();
    const contentWidth = terminalWidth - 4; // 左右各2个字符的边框

    // 处理文本换行
    const lines = processTextToLines(text, contentWidth);

    // 绘制边框和内容
    const horizontalBorder = '─'.repeat(terminalWidth - 2);
    console.log(`┌${horizontalBorder}┐`);

    // 添加小草标题行
    const title = chalk.green.bold('小草 🌱');
    // 计算标题文本的实际显示宽度（不包括ANSI颜色代码）
    const titleDisplayWidth = getStringDisplayWidth('小草 🌱');
    const titlePadding = ' '.repeat(contentWidth - titleDisplayWidth);
    console.log(`│ ${title}${titlePadding} │`);

    // 添加分隔线
    console.log(`├${horizontalBorder}┤`);

    // 打印正文内容
    for (const line of lines) {
        const padding = ' '.repeat(contentWidth - getStringDisplayWidth(line));
        console.log(`│ ${line}${padding} │`);
    }

    console.log(`└${horizontalBorder}┘`);
}

/**
 * 以聊天模式（带前缀）打印文本
 * @param text 要打印的文本
 */
function printChatMode(text: string): void {
    const [terminalWidth] = getTerminalSize();

    // 处理文本换行
    const lines = processTextToLines(text, terminalWidth);

    console.log();

    // 小草消息使用绿色前缀
    const prefix = chalk.green.bold('小草🌱') + ': ';
    console.log(prefix);
    for (const line of lines) {
        console.log(line);
    }

    console.log();
}

/**
 * 打印文本，添加边框或前缀
 * @param text 要打印的文本
 * @param mode 打印模式，可选值：normal(标准模式), chat(聊天模式)
 * @param role 消息角色，可选值: assistant(小草消息), user(用户消息)
 */
export function printWithBorders(
    text: string,
    mode: string = 'normal',
    role: string = 'assistant'
): void {
    // 用户消息不需要显示，因为CLI中已经有"cao 🌿 > "前缀
    if (role !== 'assistant') {
        return;
    }

    // 根据模式选择相应的打印函数
    if (mode === 'normal') {
        printNormalMode(text);
    } else {
        printChatMode(text);
    }
}
