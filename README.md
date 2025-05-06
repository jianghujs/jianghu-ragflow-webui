# jianghu-ragflow-webui

## 项目简介

jianghu-ragflow-webui 是一个基于 RAGFlow 的 Web 界面应用，提供了人工智能对话和智能问答的功能。该项目集成了 RAGFlow 的核心能力，允许用户与基于知识库的 AI 助手进行对话交互。

## 技术栈

- 后端：基于 jianghujs（eggjs） 框架
- 前端：Vue.js + Vuetify
- 数据库：MySQL + knex
- AI 集成：RAGFlow API

## 安装与配置

### 环境需求

- Node.js (推荐 v14 或更高版本)
- MySQL 数据库

### 安装步骤

1. 克隆项目并安装依赖
   ```bash
   git clone https://github.com/jianghujs/jianghu-ragflow-webui.git
   cd jianghu-ragflow-webui
   npm install
   ```

2. 配置文件设置
   ```bash
   # 复制配置文件模板
   cp config/config.local.example.js config/config.local.js
   ```

3. 修改数据库配置
   打开 `config/config.local.js` 文件，将数据库配置修改为你自己的：
   ```javascript
   host: '127.0.0.1',
   port: 3306,
   user: 'root',
   password: '123456',
   database: 'ragflow_webui'
   ```

4. 修改 RAGFlow 配置
   在同一配置文件中，设置 RAGFlow 的相关参数：
   ```javascript
   ragflow: {
     baseUrl: 'https://你的RAGFlow服务地址',
     apiKey: '你的API密钥',
     chatOptions: [
       {
         id: '你的聊天ID',
         name: '江湖AI助手',
         description: '专业解答，江湖AI问题',
         isChat: false,
         // 其他配置...
       },
     ],
   },
   ```

## 数据库初始化

1. 创建数据库
   ```sql
   # 数据库初始化
   create database `ragflow_webui` default character set utf8mb4 collate utf8mb4_bin;
   use ragflow_xiaoxun;
   ```

2. 导入表结构和初始数据
   ```bash
   # 执行以下SQL文件以初始化数据库
   mysql -u用户名 -p密码 ragflow_xiaoxun < sql/ragflow-webui.sql
   ```

3. 数据库主要表结构
   - 会话历史标题更新表 (session_history_title_update)：记录对话会话的标题修改历史

## 启动应用

### 开发环境

```bash
npm run dev
```
应用将在端口 7708 上运行，可通过 http://localhost:7708 访问。

### 生产环境

```bash
npm start
```

## 系统功能

### 用户认证

- 登录/登出功能
- 访客模式（无需登录也可使用基本功能）
- 默认测试账号：admin/123456

### 核心功能

1. **AI 对话**
   - 支持多种 AI 模型的智能对话
   - 流式响应（打字机效果）
   - 会话记录保存与管理

2. **知识库集成**
   - 支持访问 RAGFlow 的知识库资源
   - 基于知识库的智能问答

3. **会话管理**
   - 会话历史记录查看
   - 会话重命名与删除
   - 按日期分组显示历史会话

4. **用户界面**
   - 响应式设计，支持移动端和桌面端
   - 深色/浅色主题切换
   - 侧边栏折叠/展开功能

## API 接口

系统提供以下核心 API：

1. `/api/chat/message` - 发送聊天消息到 RAGFlow Chat
2. `/api/agent/message` - 发送消息到 RAGFlow Agent

## 技术支持与问题反馈

如有问题或建议，请通过 GitHub Issues 提交反馈。