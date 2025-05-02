const { Controller } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class AgentController extends Controller {


  async index() {
    const { ctx } = this;
    await ctx.render('index.html');
  }

  async createSession() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const { agentId, userId } = ctx.request.body;
    try {
      const response = await axios.post(`${baseUrl}/agents/${agentId}/sessions`, {
        lang: "Chinese",
        user_id: userId
      }, { 
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      const id = response.data.data.id;
      this.ctx.body = { id };
    } catch (error) {
      this.ctx.logger.error(`创建会话失败: ${error.message}`, error);
      this.ctx.status = 500;
      this.ctx.body = { error: '创建会话失败' };
    }
  }

  async updateSession() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const { sessionId, md_sessionName, agentId } = ctx.request.body;

    try {
      await axios.put(`${baseUrl}/agents/${agentId}/sessions/${sessionId}`, {
        name: md_sessionName
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.ctx.body = { id: sessionId };
    } catch (error) {
      this.ctx.logger.error(`更新会话失败: ${error.message}`, error);
      this.ctx.status = 500;
      this.ctx.body = { error: '更新会话失败' };
    }
  }

  async deleteSession() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const { sessionId, agentId } = ctx.request.body;

    try {
      await axios.delete(`${baseUrl}/agents/${agentId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          ids: [sessionId]
        }
      });

      this.ctx.body = {};
    } catch (error) {
      this.ctx.logger.error(`删除会话失败: ${error.message}`, error);
      this.ctx.status = 500;
      this.ctx.body = { error: '删除会话失败' };
    }
  }

  async getSessionList() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    
    // 从请求中获取agentId参数
    const { agentId, userId } = ctx.request.body;
    const { page = 1, page_size = 1000 } = ctx.query;

    try {
      const response = await axios.get(`${baseUrl}/agents/${agentId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        params: {
          user_id: userId,
          orderby: 'update_time',
          desc: true,
          page,
          page_size
        }
      });

      // 处理响应数据，提取需要的会话信息
      const sessionList = response.data.data.map(session => ({
        id: session.id,
        md_sessionName: session.message?.[0]?.content || "新建聊天",
        create_time: session.create_time,
        create_date: session.create_date,
        dialog_id: agentId,
        user_id: userId,
        message: JSON.stringify(session.message || [])
      }));
      
      this.ctx.body = { rows: sessionList };
    } catch (error) {
      this.ctx.logger.error(`获取会话列表失败: ${error.message}`, error);
      this.ctx.status = 500;
      this.ctx.body = { error: '获取会话列表失败' };
    }
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
    const { message, sessionId, beginParams } = ctx.request.body;
    const { baseUrl, apiKey } = app.config.ragflow;
    const { agentId, userId } = ctx.request.body;

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
  
    try {
      const response = await axios.post(`${baseUrl}/agents/${agentId}/completions`, 
        { 
          lang: "Chinese", 
          question: `${message}`, 
          stream: true, 
          session_id: sessionId, 
          user_id: userId 
        }, 
        { 
          headers: { 
            'Authorization': `Bearer ${apiKey}`, 
            'Content-Type': 'application/json' 
          }, 
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

  async getSessionDetail() {
    const { ctx, app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    
    // 从请求中获取agentId和sessionId
    const { agentId, id, userId } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = { error: 'id is required' };
      return;
    }

    try {
      const response = await axios.get(`${baseUrl}/agents/${agentId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        params: {
          user_id: userId,
          id: id
        }
      });

      if (!response.data.data || response.data.data.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Session not found' };
        return;
      }

      const session = response.data.data[0];
      
      // 转换会话对象为前端期望的格式
      const sessionObj = {
        id: session.id,
        md_sessionName: session.messages?.[0]?.content || "新建聊天",
        create_time: session.create_time,
        create_date: session.create_date,
        dialog_id: agentId,
        user_id: userId,
        message: JSON.stringify(session.messages || []),
        reference: '[]'
      };

      this.ctx.body = sessionObj;
    } catch (error) {
      this.ctx.logger.error(`获取会话详情失败: ${error.message}`, error);
      this.ctx.status = 500;
      this.ctx.body = { error: '获取会话详情失败' };
    }
  }
}

module.exports = AgentController; 