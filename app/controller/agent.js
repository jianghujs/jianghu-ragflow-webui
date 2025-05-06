const { Controller } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class AgentController extends Controller {
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
}

module.exports = AgentController; 