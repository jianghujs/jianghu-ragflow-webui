const { Service } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class ChatService extends Service {

  async createSession(actionData) {
    const { agentId: chatId, userId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    try {
      const response = await axios.post(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        name: "新建聊天",
        user_id: userId
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const { id } = response.data.data;
      return { id };
    } catch (error) {
      this.ctx.logger.error(`创建会话失败: ${error.message}`, error);
      throw new Error('创建会话失败');
    }
  }

  async updateSession(actionData) {
    const { sessionId, md_sessionName, chatId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    
    try {
      await axios.put(`${baseUrl}/api/v1/chats/${chatId}/sessions/${sessionId}`, {
        name: md_sessionName
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return { id: sessionId };
    } catch (error) {
      this.ctx.logger.error(`更新会话失败: ${error.message}`, error);
      throw new Error('更新会话失败');
    }
  }

  async deleteSession(actionData) {
    const { sessionId, chatId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    try {
      await axios.delete(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          ids: [sessionId]
        }
      });

      return {};
    } catch (error) {
      this.ctx.logger.error(`删除会话失败: ${error.message}`, error);
      throw new Error('删除会话失败');
    }
  }

  async getSessionList(actionData) {
    const { agentId: chatId, userId, page = 1, page_size = 1000 } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    try {
      const response = await axios.get(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        params: {
          user_id: userId,
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
        md_sessionName: session.name,
      }));
      
      return { deviceName: `游客${userId}`, rows: sessionList };
    } catch (error) {
      this.ctx.logger.error(`获取会话列表失败: ${error.message}`, error);
      throw new Error('获取会话列表失败');
    }
  }

  async getSessionDetail(actionData) {
    const { agentId: chatId, sessionId, userId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    try {
      const response = await axios.get(`${baseUrl}/api/v1/chats/${chatId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        params: {
          user_id: userId,
          id: sessionId
        }
      });

      const data = response.data.data[0] || {};
      return data;
    } catch (error) {
      this.ctx.logger.error(`获取会话详情失败: ${error.message}`, error);
      throw new Error('获取会话详情失败');
    }
  }

  async sendMessage(actionData) {
    const resStream = new PassThrough();

    const { message, sessionId, model, agentId: chatId, userId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    
    this.ctx.set({
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
    
    // 如果指定了模型，添加model参数
    if (model) {
      requestBody.model = model;
    }

    try {
      const response = await axios.post(`${baseUrl}/api/v1/chats/${chatId}/completions`, 
        requestBody, 
        { 
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, 
          responseType: 'stream', 
          timeout: 180 * 1000 
        });
        
      response.data.on('data', chunk => {
        const text = chunk.toString('utf8');
        resStream?.write(text);
      });
      
      response.data.on('end', () => {
        resStream?.end();
      });
    } catch (error) {
      this.ctx.logger.error(`发送消息失败: ${error.message}`, error);
      resStream?.write(JSON.stringify({ error: '发送消息失败' }));
      resStream?.end();
    }
  }
}

module.exports = ChatService; 