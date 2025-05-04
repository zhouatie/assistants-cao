/**
 * 谷歌日历服务模块
 * 提供对Google Calendar API的调用功能
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as process from 'process';

// 注意：这些导入需要先安装相应的npm包
// 如果运行出错，请先安装：npm install googleapis @google-cloud/local-auth --save
let authenticate: any;
let google: any;
let calendar_v3: CalendarV3 = { Schema$Event: {}, Params$Resource$Events$List: {} };

try {
    // 动态导入这些包，这样即使没有安装也不会立即崩溃
    const {authenticate: auth} = require('@google-cloud/local-auth');
    const {google: g, calendar_v3: cal} = require('googleapis');
    
    authenticate = auth;
    google = g;
    calendar_v3 = cal;
} catch (error) {
    console.error('未安装谷歌日历所需的依赖包，请运行: npm install googleapis @google-cloud/local-auth --save');
    // 提供一个模拟的google对象，避免运行时崩溃
    google = {
        auth: {
            fromJSON: () => null
        },
        calendar: () => ({
            events: {
                insert: () => Promise.reject(new Error('未安装谷歌日历API依赖')),
                list: () => Promise.reject(new Error('未安装谷歌日历API依赖')),
                get: () => Promise.reject(new Error('未安装谷歌日历API依赖')),
                update: () => Promise.reject(new Error('未安装谷歌日历API依赖')),
                delete: () => Promise.reject(new Error('未安装谷歌日历API依赖'))
            }
        })
    };
}

// 定义日历事件接口
// googleapis 和 @google-cloud/local-auth 需要安装，请运行：
// npm install googleapis @google-cloud/local-auth --save

export interface CalendarEvent {
    id?: string;
    title: string;
    date: string; // ISO 8601格式，例如 "2023-05-15T14:00:00"
    location?: string;
    description?: string;
    created?: string;
    updated?: string;
}

// 为了避免TypeScript编译错误，自定义calendar_v3类型
interface CalendarV3 {
    Schema$Event: any;
    Params$Resource$Events$List: any;
}

// 设置API访问范围，需要读写权限
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

// 存储token和凭证的文件路径
const TOKEN_PATH = path.join(process.cwd(), 'calendar_token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'calendar_credentials.json');

/**
 * 读取已保存的凭证
 * @returns Google OAuth2客户端
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content.toString());
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * 将凭证序列化到文件
 * @param client OAuth2客户端
 */
async function saveCredentials(client: any) {
    try {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content.toString());
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        await fs.writeFile(TOKEN_PATH, payload);
    } catch (err) {
        console.error('保存凭证失败:', err);
    }
}

/**
 * 获取授权客户端
 * @returns 授权的OAuth2客户端
 */
async function authorize() {
    try {
        // 检查是否已安装必要的依赖
        if (!authenticate) {
            throw new Error('未安装谷歌日历API依赖，请运行: npm install googleapis @google-cloud/local-auth --save');
        }

        // 检查凭证文件是否存在
        try {
            await fs.access(CREDENTIALS_PATH);
        } catch (error) {
            throw new Error(`未找到Google Calendar API凭证文件，请将凭证文件保存为 ${CREDENTIALS_PATH}`);
        }

        let client = await loadSavedCredentialsIfExist();
        if (client) {
            return client;
        }

        // 如果没有保存的凭证，则请求用户授权
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });

        if (client.credentials) {
            await saveCredentials(client);
        }
        return client;
    } catch (err) {
        console.error('授权失败:', err);
        throw new Error(`Google Calendar授权失败: ${(err as Error).message}`);
    }
}

/**
 * 创建新的日历事件
 * @param title 事件标题
 * @param date 事件日期时间（ISO 8601格式）
 * @param description 事件描述
 * @param location 事件地点
 * @returns 创建的事件对象
 */
export async function createCalendarEvent(
    title: string,
    date: string,
    description?: string,
    location?: string
): Promise<CalendarEvent> {
    try {
        // 验证日期格式
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new Error('日期格式无效，请使用有效的日期格式，例如 "2023-05-15 14:00"');
        }

        // 获取授权客户端
        const auth = await authorize();
        const calendar = google.calendar({version: 'v3', auth});

        // 创建事件
        const event = {
            summary: title,
            description: description,
            location: location,
            start: {
                dateTime: dateObj.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                // 默认事件持续1小时
                dateTime: new Date(dateObj.getTime() + 60 * 60 * 1000).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };

        // 调用Google Calendar API创建事件
        const response = await calendar.events.insert({
            calendarId: 'primary', // 使用用户的主日历
            requestBody: event,
        });

        if (!response.data) {
            throw new Error('事件创建失败');
        }

        // 将Google Calendar事件转换为本地事件格式
        return {
            id: response.data.id || undefined,
            title: response.data.summary || title,
            date: response.data.start?.dateTime || date,
            description: response.data.description || undefined,
            location: response.data.location || undefined,
            created: response.data.created || new Date().toISOString(),
            updated: response.data.updated || new Date().toISOString(),
        };
    } catch (error) {
        console.error('创建Google Calendar事件失败:', error);
        throw new Error(`创建日历事件失败: ${(error as Error).message}`);
    }
}

/**
 * 获取日历事件列表
 * @param startDate 开始日期（可选）
 * @param endDate 结束日期（可选）
 * @returns 符合条件的日历事件列表
 */
export async function listCalendarEvents(
    startDate?: string,
    endDate?: string
): Promise<CalendarEvent[]> {
    try {
        // 获取授权客户端
        const auth = await authorize();
        const calendar = google.calendar({version: 'v3', auth});

        // 设置查询参数
        const queryParams: any = {
            calendarId: 'primary',
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 20, // 最多返回20个事件
        };

        // 如果提供了时间范围，添加到查询参数
        if (startDate) {
            const startTime = new Date(startDate);
            if (!isNaN(startTime.getTime())) {
                queryParams.timeMin = startTime.toISOString();
            }
        } else {
            // 默认查询从当前时间开始的事件
            queryParams.timeMin = new Date().toISOString();
        }

        if (endDate) {
            const endTime = new Date(endDate);
            if (!isNaN(endTime.getTime())) {
                queryParams.timeMax = endTime.toISOString();
            }
        }

        // 调用Google Calendar API获取事件列表
        const response = await calendar.events.list(queryParams);

        // 将Google Calendar事件转换为本地事件格式
        return (response.data.items || []).map((item: any) => {
            return {
                id: item.id,
                title: item.summary || '未命名事件',
                date: item.start?.dateTime || item.start?.date || new Date().toISOString(),
                description: item.description,
                location: item.location,
                created: item.created,
                updated: item.updated,
            };
        });
    } catch (error) {
        console.error('获取Google Calendar事件列表失败:', error);
        throw new Error(`获取日历事件失败: ${(error as Error).message}`);
    }
}

/**
 * 更新现有的日历事件
 * @param eventId 事件ID
 * @param updateData 更新的数据
 * @returns 更新后的事件对象
 */
export async function updateCalendarEvent(
    eventId: string,
    updateData: Partial<CalendarEvent>
): Promise<CalendarEvent> {
    try {
        // 获取授权客户端
        const auth = await authorize();
        const calendar = google.calendar({version: 'v3', auth});

        // 首先获取现有的事件
        const response = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });

        if (!response.data) {
            throw new Error(`未找到ID为 ${eventId} 的事件`);
        }

        // 准备更新数据
        const updatedEvent = {
            ...response.data,
        };

        // 更新字段
        if (updateData.title) {
            updatedEvent.summary = updateData.title;
        }
        if (updateData.description) {
            updatedEvent.description = updateData.description;
        }
        if (updateData.location) {
            updatedEvent.location = updateData.location;
        }
        if (updateData.date) {
            const dateObj = new Date(updateData.date);
            if (!isNaN(dateObj.getTime())) {
                updatedEvent.start = {
                    dateTime: dateObj.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                };
                
                // 如果有结束时间，则保持事件持续时间不变
                if (response.data.end && response.data.start && response.data.end.dateTime && response.data.start.dateTime) {
                    const originalDuration = new Date(response.data.end.dateTime).getTime() - 
                                             new Date(response.data.start.dateTime).getTime();
                    updatedEvent.end = {
                        dateTime: new Date(dateObj.getTime() + originalDuration).toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    };
                } else {
                    // 默认1小时时长
                    updatedEvent.end = {
                        dateTime: new Date(dateObj.getTime() + 60 * 60 * 1000).toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    };
                }
            }
        }

        // 更新事件
        const updateResponse = await calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: updatedEvent,
        });

        if (!updateResponse.data) {
            throw new Error('事件更新失败');
        }

        // 将Google Calendar事件转换为本地事件格式
        return {
            id: updateResponse.data.id,
            title: updateResponse.data.summary || '未命名事件',
            date: updateResponse.data.start?.dateTime || updateResponse.data.start?.date || new Date().toISOString(),
            description: updateResponse.data.description,
            location: updateResponse.data.location,
            created: updateResponse.data.created,
            updated: updateResponse.data.updated,
        };
    } catch (error) {
        console.error('更新Google Calendar事件失败:', error);
        throw new Error(`更新日历事件失败: ${(error as Error).message}`);
    }
}

/**
 * 删除日历事件
 * @param eventId 事件ID
 * @returns 是否成功删除
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
        // 获取授权客户端
        const auth = await authorize();
        const calendar = google.calendar({version: 'v3', auth});

        // 调用Google Calendar API删除事件
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        return true;
    } catch (error) {
        console.error('删除Google Calendar事件失败:', error);
        throw new Error(`删除日历事件失败: ${(error as Error).message}`);
    }
}

/**
 * 从用户输入中提取事件信息
 * @param userInput 用户输入文本
 * @returns 提取的事件信息或null
 */
export function extractEventInfo(userInput: string): CalendarEvent | null {
    // 简单的正则匹配示例
    // 实际应用中可能需要更复杂的NLP处理
    try {
        // 尝试匹配"标题"
        const titleMatch = userInput.match(
            /(?:标题|主题|名称|叫做|为)[\s:：]*[""]?([^"""]+)[""]?/i
        );

        // 尝试匹配日期和时间
        const dateMatch = userInput.match(
            /(?:日期|时间|在|于)[\s:：]*[""]?(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?\s*(?:\d{1,2}[:：]\d{1,2}(?:[:：]\d{1,2})?)?)/
        );

        // 尝试匹配地点
        const locationMatch = userInput.match(/(?:地点|位置|在)[\s:：]*[""]?([^"""]+)[""]?/i);

        // 尝试匹配描述
        const descMatch = userInput.match(/(?:描述|详情|内容|备注)[\s:：]*[""]?([^"""]+)[""]?/i);

        // 如果没有找到足够的信息，返回null
        if (!titleMatch && !dateMatch) {
            return null;
        }

        // 构建事件对象
        const event: CalendarEvent = {
            title: titleMatch ? titleMatch[1].trim() : '未命名事件',
            date: dateMatch ? parseChineseDateToISO(dateMatch[1].trim()) : new Date().toISOString(),
        };

        if (locationMatch) {
            event.location = locationMatch[1].trim();
        }

        if (descMatch) {
            event.description = descMatch[1].trim();
        }

        return event;
    } catch (error) {
        console.error('提取事件信息失败:', error);
        return null;
    }
}

/**
 * 将中文日期格式转换为ISO 8601格式
 * @param chineseDate 中文日期字符串，如 "2023年05月15日 14:00"
 * @returns ISO 8601格式的日期字符串
 */
function parseChineseDateToISO(chineseDate: string): string {
    try {
        // 替换中文年月日
        const normalizedDate = chineseDate
            .replace(/年/g, '-')
            .replace(/月/g, '-')
            .replace(/日/g, ' ');

        // 处理日期部分
        const dateParts = normalizedDate.split(/\s+/);
        let dateStr = dateParts[0];
        let timeStr = dateParts[1] || '00:00';

        // 确保日期格式正确
        const dateRegex = /(\d{4})-(\d{1,2})-(\d{1,2})/;
        const dateMatches = dateStr.match(dateRegex);

        if (dateMatches) {
            const year = parseInt(dateMatches[1]);
            const month = parseInt(dateMatches[2]).toString().padStart(2, '0');
            const day = parseInt(dateMatches[3]).toString().padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        }

        // 处理时间部分
        if (timeStr) {
            // 确保时间格式正确
            const timeRegex = /(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/;
            const timeMatches = timeStr.match(timeRegex);

            if (timeMatches) {
                const hour = parseInt(timeMatches[1]).toString().padStart(2, '0');
                const minute = parseInt(timeMatches[2]).toString().padStart(2, '0');
                const second = timeMatches[3]
                    ? parseInt(timeMatches[3]).toString().padStart(2, '0')
                    : '00';
                timeStr = `${hour}:${minute}:${second}`;
            }
        } else {
            timeStr = '00:00:00';
        }

        // 组合日期和时间
        const dateTimeStr = `${dateStr}T${timeStr}`;
        const dateObj = new Date(dateTimeStr);

        if (isNaN(dateObj.getTime())) {
            throw new Error('无法解析日期: ' + chineseDate);
        }

        return dateObj.toISOString();
    } catch (error) {
        console.error('解析日期失败:', error);
        // 返回当前时间
        return new Date().toISOString();
    }
}
