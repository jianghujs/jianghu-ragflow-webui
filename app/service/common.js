const { Service } = require('egg');
const crypto = require('crypto');

class CommonService extends Service {
  async getChatApiKey(id) {
    const { app } = this;
    const { chatOptions, apiKey } = app.config.ragflow;
    const chatOption = chatOptions.find(option => option.id === id) || {};
    return chatOption.apiKey || apiKey;
  }

  async getUserId() {
    const { ctx } = this;
    const { userId } = ctx.userInfo || {};

    if (userId) return userId;

    const userAgent = ctx.request.headers['user-agent'] || '';
    const deviceId = crypto
      .createHash('md5')
      .update(userAgent)
      .digest('hex')
      .substring(8, 24);  // 取中间16位
    
    return `tudi_${deviceId}`;
  }

  async getUserInfo() {
    const { ctx, app } = this;
    const knex = app.knex;
    const userId = await this.getUserId();
    const userInfo = await knex('_user').where({ userId }).first();
    
    return userInfo || { userId, username: `游客${userId}` };
  }
}

module.exports = CommonService; 