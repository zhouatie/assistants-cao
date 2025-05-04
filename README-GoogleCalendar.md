# Google Calendar 集成配置指南

此文档指导您如何设置 Google Calendar API 凭证以便与 cao CLI 工具集成。

## 前提条件

1. 拥有 Google 账户
2. 已安装 Node.js 和 npm

## 设置步骤

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目

### 2. 启用 Google Calendar API

1. 在 Google Cloud Console 中，进入 "APIs & Services" > "Library"
2. 搜索 "Google Calendar API" 并启用它

### 3. 配置 OAuth 同意屏幕

1. 在 Google Cloud Console 中，进入 "APIs & Services" > "OAuth consent screen"
2. 选择用户类型 (内部/外部)，填写必要信息
3. 添加所需的范围: `https://www.googleapis.com/auth/calendar` 和 `https://www.googleapis.com/auth/calendar.events`
4. 完成配置

### 4. 创建 OAuth 客户端 ID

1. 在 Google Cloud Console 中，进入 "APIs & Services" > "Credentials"
2. 点击 "Create Credentials" > "OAuth client ID"
3. 应用类型选择 "Desktop app"
4. 输入名称，如 "cao CLI Calendar Integration"
5. 创建后，下载 JSON 格式的凭证文件

### 5. 配置应用程序

1. 将从Google Cloud Console下载的凭证文件重命名为 `calendar_credentials.json`
   - 这个文件包含了您应用程序的客户端ID和密钥
   - 注意：这个文件只是应用程序的身份标识，还不包含访问您日历的权限
2. 将该文件放到 cao CLI 的根目录

## 首次运行

首次使用日历功能时，系统会使用上述凭证文件进行如下操作：

1. 打开浏览器窗口，要求您登录Google账户并授权应用访问您的日历
2. 当您点击"允许"后，Google会提供访问令牌
3. 应用程序会自动在本地生成并保存 `calendar_token.json` 文件
   - 这个文件包含了访问您Google日历所需的OAuth令牌
   - 有了这个文件，后续使用时就不需要重复授权了

## 注意事项

- 请勿将凭证文件提交到公共代码仓库
- 如果遇到授权问题，删除 `calendar_token.json` 文件并重新运行授权流程
- 默认情况下，应用程序访问的是您的主日历

## 功能使用

成功配置后，您可以通过智能秘书角色使用以下功能：

- 创建日程: "创建一个标题为会议的日程，时间是明天下午3点，地点在会议室"
- 查看日程: "查看我的日程" 或 "我今天有什么安排"
- 更新和删除日程功能也已实现，可以通过API调用
