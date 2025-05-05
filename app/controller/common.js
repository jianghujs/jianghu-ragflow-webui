const { Controller } = require('egg');
const axios = require('axios');
const { PassThrough } = require('stream');

class CommonController extends Controller {
  async index() {
    const { ctx } = this;
    await ctx.render('index.html');
  }
}

module.exports = CommonController; 