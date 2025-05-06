const { Service } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class ChatService extends Service {

  async createSession({ agentId: chatId, userId }) {
    const { app } = this;
    const { baseUrl } = app.config.ragflow;
    const apiKey = await this.ctx.service.common.getChatApiKey(chatId);

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/chats/${chatId}/sessions`,
        { name: "新建聊天", user_id: userId },
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }}
      );

      return { id: response.data.data.id };
    } catch (error) {
      this.ctx.logger.error(`创建会话失败: ${error.message}`, error);
      throw new Error('创建会话失败');
    }
  }

  async updateSession({ sessionId, md_sessionName, agentId: chatId }) {
    const { app } = this;
    const { baseUrl } = app.config.ragflow;
    const apiKey = await this.ctx.service.common.getChatApiKey(chatId);

    try {
      await axios.put(
        `${baseUrl}/api/v1/chats/${chatId}/sessions/${sessionId}`,
        { name: md_sessionName },
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }}
      );

      return { id: sessionId };
    } catch (error) {
      this.ctx.logger.error(`更新会话失败: ${error.message}`, error);
      throw new Error('更新会话失败');
    }
  }

  async deleteSession({ sessionId, chatId }) {
    const { app } = this;
    const { baseUrl } = app.config.ragflow;
    const apiKey = await this.ctx.service.common.getChatApiKey(chatId);

    try {
      await axios.delete(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        data: { ids: [sessionId] }
      });

      return {};
    } catch (error) {
      this.ctx.logger.error(`删除会话失败: ${error.message}`, error);
      throw new Error('删除会话失败');
    }
  }

  async getSessionList({ agentId: chatId, userId, page = 1, page_size = 1000 }) {
    const { app } = this;
    const { baseUrl } = app.config.ragflow;
    const apiKey = await this.ctx.service.common.getChatApiKey(chatId);

    try {
      const response = await axios.get(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: { user_id: userId, orderby: 'create_time', desc: true, page, page_size }
      });

      const sessionList = response.data.data.map(session => ({
        id: session.id,
        name: session.name,
        create_time: session.create_time,
        create_date: session.create_date,
        md_sessionName: session.name,
      }));
      
      return { deviceName: `游客${userId}`, rows: sessionList };
    } catch (error) {
      this.ctx.logger.error(`获取会话列表失败: ${error.message}`, error);
      throw new Error('获取会话列表失败');
    }
  }

  async getSessionDetail({ agentId: chatId, sessionId, userId }) {
    const { app } = this;
    const { baseUrl } = app.config.ragflow;
    const apiKey = await this.ctx.service.common.getChatApiKey(chatId);

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    try {
      const response = await axios.get(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        params: { user_id: userId, id: sessionId }
      });

      return response.data.data[0] || {};
    } catch (error) {
      this.ctx.logger.error(`获取会话详情失败: ${error.message}`, error);
      throw new Error('获取会话详情失败');
    }
  }

  async sendMessage({ message, sessionId, model, agentId: chatId, userId }) {
    const resStream = new PassThrough();
    const { app } = this;
    const { baseUrl } = app.config.ragflow;
    const apiKey = await this.ctx.service.common.getChatApiKey(chatId);

    this.ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const requestBody = { 
      lang: "Chinese", 
      question: message, 
      stream: true, 
      session_id: sessionId, 
      user_id: userId, 
      sync_dsl: true 
    };
    
    if (model) {
      requestBody.model = model;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/chats/${chatId}/completions`, 
        requestBody, 
        { 
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, 
          responseType: 'stream', 
          timeout: 180 * 1000 
        }
      );
        
      response.data.on('data', chunk => resStream?.write(chunk.toString('utf8')));
      response.data.on('end', () => resStream?.end());
    } catch (error) {
      this.ctx.logger.error(`发送消息失败: ${error.message}`, error);
      resStream?.write(JSON.stringify({ error: '发送消息失败' }));
      resStream?.end();
    }
  }
}

module.exports = ChatService; 