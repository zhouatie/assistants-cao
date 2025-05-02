# cao🌿

一个命令行工具，程序员编程伴侣。TypeScript 版本。

## 功能

- 支持与多种角色对话（可以向他们寻求帮助）
- 支持多种 AI 模型（ollama、deepseek、openai）

## 系统要求

- Node.js 18+

## 安装

### 通过 npm 全局安装

```bash
npm install -g assistants-cao
```

## 使用方法

```bash
# 在终端执行 cao，即可唤醒你的编程伴侣
cao
```

### 指定使用的 AI 模型

```bash
cao -m ollama
```

支持的模型:

- ollama (默认)(本地运行)
- deepseek
- openai
- 以及任何支持OpenAI兼容API的模型，如:
    - anthropic
    - 等更多通过自定义配置添加的模型

### 配置 AI 模型

```bash
cao --config
```

这将启动交互式配置界面，您可以在其中:

- 添加/更新模型配置
- 删除不需要的模型
- 设置默认模型
- 查看当前配置的所有模型

### 开启调试模式

```bash
cao -d
```

## 环境变量和API密钥

设置API密钥的两种方式:

1. **环境变量** (推荐):

    - 自动根据API提供商命名规则使用相应环境变量
    - 命名规则: `<PROVIDER名称大写>_API_KEY`
    - 举例:
        - `OPENAI_API_KEY` - OpenAI模型
        - `DEEPSEEK_API_KEY` - DeepSeek模型
        - `DASHSCOPE_API_KEY` - 阿里云DashScope模型
        - `ANTHROPIC_API_KEY` - Anthropic模型

2. **配置文件**:
    - 通过`cao --config`命令进行配置
    - 支持在配置中直接设置API密钥

注意：

- 使用Ollama模型不需要设置API密钥，因为它在本地运行
- API提供商名称会自动从API基础URL中提取，例如`api.openai.com` → 使用`OPENAI_API_KEY`

## 本地开发与调试

```bash
# 克隆仓库
git clone <repository-url>
cd cao

# 安装依赖
npm install

# 构建项目
npm run build

# 开发模式运行
npm run dev

# 或使用 ts-node 直接运行
npx ts-node src/cli/main.ts
```

## 功能

- [x] 自定义配置 AI 模型
- [x] 支持与ai持续性对话

## 许可证

[MIT](LICENSE)
