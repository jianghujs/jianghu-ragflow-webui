const { Controller } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class ChatController extends Controller {
  async sendMessage() {
    const { logger } = this;
    const resStream = new PassThrough();
    this.ctx.body = resStream;
    try {
      await this.handleSendMessage({ resStream });
    } catch (error) {
      logger.error("[handleSendMessage] error", error);
      resStream.end();
    }
  }

  async handleSendMessage({ resStream }) {
    const { ctx, app } = this;
    const knex = app.knex;
    const { message, sessionId, model, agentId: chatId, userId } = ctx.request.body;

    const ragflowConfig = app.config.ragflow;
    const { baseUrl, apiKey } = ragflowConfig;
    
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // 创建请求体，如果model参数存在，则添加到llm_config中
    const requestBody = { 
      lang: "Chinese", 
      question: `${message}`, 
      stream: true, 
      session_id: sessionId, 
      user_id: userId, 
      sync_dsl: true 
    };
    
    // 如果指定了模型，添加llm_config参数
    if (model) {
      requestBody.model = model;
    }

    const response = await axios.post(`${baseUrl}/api/v1/chats/${chatId}/completions`, 
      requestBody, 
      { 
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, 
        responseType: 'stream', timeout: 180 * 1000 
      });
    response.data.on('data', chunk => {
        const text = chunk.toString('utf8');
        resStream?.write(text);
    });
    response.data.on('end', () => {
        resStream?.end();
    });
  }
}

module.exports = ChatController; 