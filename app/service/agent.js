const { Service } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class AgentService extends Service {

  async createSession(actionData) {
    const { agentId, userId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    try {
      const response = await axios.post(`${baseUrl}/api/v1/agents/${agentId}/sessions?user_id=${userId}`, {
        lang: "Chinese",
      }, { 
        headers: { 
          'Authorization': `Bearer ${apiKey}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      const id = response.data.data.id;
      return { id };
    } catch (error) {
      this.ctx.logger.error(`创建会话失败: ${error.message}`, error);
      throw new Error('创建会话失败');
    }
  }

  async updateSession(actionData) {
    const { sessionId, md_sessionName, agentId, userId } = actionData;
    const { app, ctx } = this;
    const knex = app.knex;
    
    const userInfo = await ctx.service.common.getUserInfo();
    // raglfow agent session没有更新的api，使用扩展表来实现
    const updateSessionHistory = async () => {
      try {
        const existingSession = await knex('session_history_title_update').where('sessionId', sessionId).first();
        if (existingSession) {
          await knex('session_history_title_update').update({
            title: md_sessionName,
            operation: 'update',
            operationByUserId: userId,
            operationByUser: userInfo.username,
            operationAt: new Date().toISOString()
          }).where('sessionId', sessionId);
        } else {
          await knex('session_history_title_update').insert({
            sessionId: sessionId,
            title: md_sessionName,
            operation: 'insert',
            operationByUserId: userId,
            operationByUser: userInfo.username,
            operationAt: new Date().toISOString()
          });
        }
      } catch (error) {
        this.ctx.logger.error(`更新会话历史失败: ${error.message}`, error);
        throw error;
      }
    };

    await updateSessionHistory();
    try {
      return { id: sessionId };
    } catch (error) {
      this.ctx.logger.error(`更新会话失败: ${error.message}`, error);
      throw new Error('更新会话失败');
    }
  }

  async deleteSession(actionData) {
    const { sessionId, agentId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    try {
      await axios.delete(`${baseUrl}/api/v1/agents/${agentId}/sessions`, {
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
    const { agentId, userId, page = 1, page_size = 1000 } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;
    const knex = app.knex;

    try {
      const response = await axios.get(`${baseUrl}/api/v1/agents/${agentId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        params: {
          user_id: userId,
          orderby: 'update_time',
          desc: true,
          dsl: false,
          page,
          page_size
        }
      });

      const data = response.data.data || [];

      const sessionIdList = data.map(item => item.id);
      const sessionTitleList = await knex('session_history_title_update').whereIn('sessionId', sessionIdList).select();
      
      // 处理响应数据，提取需要的会话信息
      const sessionList = data.map(session => {
        const sessionTitleItem = sessionTitleList.find(item => item.sessionId === session.id) || {};
        const md_sessionName = sessionTitleItem.title || "新建聊天";
        return ({
          id: session.id,
          md_sessionName,
          create_time: session.create_time,
          create_date: session.create_date,
          dialog_id: agentId,
          user_id: userId,
        });
      });
      
      return { rows: sessionList, total: data.length };
    } catch (error) {
      this.ctx.logger.error(`获取会话列表失败: ${error.message}`, error);
      throw new Error('获取会话列表失败');
    }
  }

  async sendMessage(actionData) {
    const resStream = new PassThrough();

    const { message, sessionId, agentId, userId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    this.ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
  
    try {
      const response = await axios.post(`${baseUrl}/api/v1/agents/${agentId}/completions`, 
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

  async getSessionDetail(actionData) {
    const { agentId, sessionId, userId } = actionData;
    const { app } = this;
    const { baseUrl, apiKey } = app.config.ragflow;

    if (!sessionId) {
      throw new Error('id is required');
    }

    try {
      const response = await axios.get(`${baseUrl}/api/v1/agents/${agentId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        params: {
          user_id: userId,
          id: sessionId
        }
      });

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('Session not found');
      }

      const session = response.data.data[0];
      
      // 转换会话对象为前端期望的格式
      const userFirstMessage = session.messages.find(item => item.role === 'user');
      const sessionObj = {
        id: session.id,
        md_sessionName: userFirstMessage ? userFirstMessage.content : "新建聊天",
        create_time: session.create_time,
        create_date: session.create_date,
        dialog_id: agentId,
        user_id: userId,
        messages: session.messages || [],
        reference: session.dsl.reference || []
      };

      return sessionObj;
    } catch (error) {
      this.ctx.logger.error(`获取会话详情失败: ${error.message}`, error);
      throw new Error('获取会话详情失败');
    }
  }
}

module.exports = AgentService; 