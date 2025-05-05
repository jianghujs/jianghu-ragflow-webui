const { Controller } = require('egg');

class CommonController extends Controller {
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
    return `U_${deviceId}`;
  }

  async getUserInfo() {
    const { ctx, app } = this;
    const knex = app.knex;
    const userId = await this.getUserId();
    const userInfo = await knex('_user').where({ userId }).first();
    return userInfo || { userId, username: `游客${userId}` };
  }
}

module.exports = CommonController; 