# 小训AI聊天项目开发规范

## 项目信息
- 项目名称：小训AI神学助手（_xiaoxun_chat_jianghu）
- 项目描述：基于RAGFlow构建的神学问答助手，提供神学知识查询与解答
- 项目结构：Egg.js框架，使用@jianghujs/jianghu作为底层框架

## 技术栈
- 后端框架：Egg.js + @jianghujs/jianghu，knex
- 数据库：MySQL
- HTTP客户端：axios
- 流处理：Node.js stream (PassThrough)
- API集成：RAGFlow API

## 编码规范

### 命名规范
- 文件命名：使用kebab-case（如agent-param.js）
- 类命名：使用PascalCase（如AgentParamController）
- 变量/方法命名：使用camelCase（如getDeviceId）
- 常量命名：使用全大写下划线分隔（如API_KEY）

### 代码风格
- 使用单引号（'）而非双引号（"）定义字符串
- 使用async/await处理异步操作，避免回调地狱
- 使用解构赋值简化代码（如const { ctx, app } = this）
- 适当使用注释解释复杂逻辑
- 使用try/catch处理潜在异常

### 目录结构规范
- app/controller：处理HTTP请求，调用service层完成业务逻辑
- app/service：包含核心业务逻辑，处理数据和外部API交互
- app/public：存放静态资源
- app/view：存放视图模板
- config：应用配置文件
- doc：文档

## 开发流程

### 功能开发流程
1. 明确需求和API设计
2. 在controller中添加新方法处理请求
3. 在service中实现业务逻辑
4. 在router.js中添加路由
5. 编写测试并进行调试

### 代码提交规范
- 每次提交关注单一功能或修复
- 提交信息清晰描述变更内容
- 提交前确保代码可运行且无明显错误

### 配置管理
- 核心配置位于config/config.default.js
- 敏感配置（如API密钥）应使用环境变量或单独的配置文件

## 错误处理与日志

### 错误处理规范
- 使用try/catch捕获并处理异常
- 使用适当的HTTP状态码返回错误
- 统一错误返回格式：{ code: 错误码, message: 错误信息 }

### 日志规范
- 使用app.logger记录关键操作和错误
- 错误日志包含详细上下文信息
- 对于重要操作记录操作人和操作时间
- 敏感信息不应出现在日志中

## RAGFlow集成规范
- 遵循RAGFlow API的调用规范
- 保持一致的参数传递方式
- 处理好流式响应与普通响应的差异
- 注意处理API限流和错误

## 文档规范
- 关键功能需有代码注释
- API接口需明确参数和返回值
- 复杂业务逻辑应有流程说明
- 重要配置项需有说明
