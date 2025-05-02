const { Controller } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class ChatController extends Controller {

  async getDeviceId() {
    const { ctx } = this;
    const userAgent = ctx.request.headers['user-agent'] || '';
    const deviceId = require('crypto')
        .createHash('md5')
        .update(userAgent)
        .digest('hex')
        .substring(8, 24);  // 取中间16位
    return `U_${deviceId}`;
  }

  async index() {
    const { ctx } = this;
    await ctx.render('index.html');
  }

  // 获取聊天选项
  async getChatOptions() {
    const { ctx, app } = this;
    const { chatOptions } = app.config.ragflow;
    
    ctx.body = { chatOptions };
  }

  async createSession() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const deviceId = await this.getDeviceId();
    
    // 从请求中获取agentId，如果没有则使用默认值
    const { agentId } = ctx.request.body;

    const response = await axios.post(`${baseUrl}/chats/${agentId}/sessions`, {
      name: "新建聊天",
      user_id: deviceId
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const { id, messages } = response.data.data;

    this.ctx.body = { id };
  }

  async updateSession() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const { sessionId, md_sessionName, agentId } = ctx.request.body;

    await axios.put(`${baseUrl}/chats/${agentId}/sessions/${sessionId}`, {
      name: md_sessionName
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.ctx.body = { id: sessionId };
  }

  async deleteSession() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const { sessionId, agentId } = ctx.request.body;
    const deviceId = await this.getDeviceId();

    await axios.delete(`${baseUrl}/chats/${agentId}/sessions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        ids: [sessionId]
      }
    });

    this.ctx.body = {};
  }

  async getSessionList() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const deviceId = await this.getDeviceId();
    const shortDeviceId = deviceId.slice(-6);
    
    // 从请求中获取agentId，如果没有则使用默认值
    const { agentId } = ctx.request.body;
    const { page = 1, page_size = 1000 } = ctx.query;

    const response = await axios.get(`${baseUrl}/chats/${agentId}/sessions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: {
        user_id: deviceId,
        orderby: 'create_time',
        desc: true,
        page,
        page_size
      }
    });

    // 只返回必要的会话信息
    const sessionList = response.data.data.map(session => ({
      id: session.id,
      name: session.name,
      create_time: session.create_time,
      create_date: session.create_date,
      md_sessionName: session.messages.find(message => message.role === 'user')?.content
    }));
    
    this.ctx.body = { deviceName: `游客${shortDeviceId}`, rows: sessionList };
  }

  async getSessionDetail() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const deviceId = await this.getDeviceId();
    
    // 从请求中获取agentId和sessionId
    const { agentId, sessionId } = ctx.request.body;

    if (!sessionId) {
      ctx.status = 400;
      ctx.body = { error: 'sessionId is required' };
      return;
    }

    const response = await axios.get(`${baseUrl}/chats/${agentId}/sessions`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      params: {
        user_id: deviceId,
        id: sessionId
      }
    });

    this.ctx.body = response.data.data[0] || {};
  }

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
    const { message, sessionId, model, agentId } = ctx.request.body;

    const ragflowConfig = app.config.ragflow;
    const { baseUrl, apiKey } = ragflowConfig;
    const currentagentId = agentId || defaultagentId;
    
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    const deviceId = await this.getDeviceId();

    // 创建请求体，如果model参数存在，则添加到llm_config中
    const requestBody = { 
      lang: "Chinese", 
      question: `${message}`, 
      stream: true, 
      session_id: sessionId, 
      user_id: deviceId, 
      sync_dsl: true 
    };
    
    // 如果指定了模型，添加llm_config参数
    if (model) {
      requestBody.model = model;
    }

    const response = await axios.post(`${baseUrl}/chats/${currentagentId}/completions`, 
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