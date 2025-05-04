/**
 * 日历服务模块
 * 提供日历API调用功能
 */

// 定义日历事件接口
export interface CalendarEvent {
    id?: string;
    title: string;
    date: string; // ISO 8601格式，例如 "2023-05-15T14:00:00"
    location?: string;
    description?: string;
    created?: string;
    updated?: string;
}

// 模拟日历存储
// 在实际应用中，这应该连接到真实的日历API，如Google Calendar
let mockEvents: CalendarEvent[] = [];

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

        // 创建事件对象
        const now = new Date().toISOString();
        const newEvent: CalendarEvent = {
            id: `event-${mockEvents.length + 1}-${now}`,
            title,
            date: dateObj.toISOString(),
            description,
            location,
            created: now,
            updated: now,
        };

        // 添加到存储
        mockEvents.push(newEvent);

        // TODO: 在此处添加实际日历API调用代码

        return newEvent;
    } catch (error) {
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
        let filteredEvents = [...mockEvents];

        // 如果提供了时间范围，则进行过滤
        if (startDate) {
            const startTime = new Date(startDate).getTime();
            if (!isNaN(startTime)) {
                filteredEvents = filteredEvents.filter(
                    event => new Date(event.date).getTime() >= startTime
                );
            }
        }

        if (endDate) {
            const endTime = new Date(endDate).getTime();
            if (!isNaN(endTime)) {
                filteredEvents = filteredEvents.filter(
                    event => new Date(event.date).getTime() <= endTime
                );
            }
        }

        // 按日期排序
        filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // TODO: 在此处添加实际日历API调用代码

        return filteredEvents;
    } catch (error) {
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
        const eventIndex = mockEvents.findIndex(event => event.id === eventId);
        if (eventIndex === -1) {
            throw new Error(`未找到ID为 ${eventId} 的事件`);
        }

        // 更新事件
        const updatedEvent = {
            ...mockEvents[eventIndex],
            ...updateData,
            updated: new Date().toISOString(),
        };

        mockEvents[eventIndex] = updatedEvent;

        // TODO: 在此处添加实际日历API调用代码

        return updatedEvent;
    } catch (error) {
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
        const initialLength = mockEvents.length;
        mockEvents = mockEvents.filter(event => event.id !== eventId);

        // TODO: 在此处添加实际日历API调用代码

        return mockEvents.length < initialLength;
    } catch (error) {
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
