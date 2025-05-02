const { Service } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class AgentService extends Service {

  async getUserId() {
    const { ctx } = this;
    const { userId } = ctx.userInfo || {};

    if (userId) {
      return userId;
    }

    const userAgent = ctx.request.headers['user-agent'] || '';
    const deviceId = require('crypto')
      .createHash('md5')
      .update(userAgent)
      .digest('hex')
      .substring(8, 24);  // 取中间16位
    return `XSV3_U_${deviceId}`;
  }

  async createSession(actionData) {
    const { ctx, app } = this;
    const knex = app.knex;
    const { agentId } = actionData;
    const { baseUrl, apiKey } = app.config.ragflow;
    const userId = await this.getUserId();

    const response = await axios.post(`${baseUrl}/agents/${agentId}/sessions?user_id=${userId}`, {
      lang: "Chinese",
    }, { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });

    const id = response.data.data.id;

    return { id };
  }

  async getUserInfo() {
    const { ctx, app } = this;
    const knex = app.knex;
    const userId = await this.getUserId();
    const userInfo = await knex('_user').where({ userId }).first();
    return userInfo || { userId, username: `游客${userId}` };
  }
}

module.exports = AgentService; 