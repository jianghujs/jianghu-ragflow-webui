'use strict';

const path = require('path');

module.exports = appInfo => {

  return {
    ragflow: {
      baseUrl: 'https://xxx',
      apiKey: 'ragflow-xxx',
      chatOptions: [
        {
          id: 'd380f780150411f0b2be0242c0a8b006',
          name: '江湖AI助手',
          description: '专业解答，江湖AI问题',
          hotTopics: [],
          models: [],
          systemPrompts: [],
          isChat: false,
        },
      ],
    },
    static: {
      maxAge: 0,
      buffer: false,
      preload: false,
      maxFiles: 0,
    },
    logger: {
      outputJSON: true,
      consoleLevel: 'DEBUG',
      level: 'DEBUG',
      dir: path.join(appInfo.baseDir, 'logs'),
      contextFormatter(meta) {
        return `[${meta.date}] [${meta.level}] [${meta.ctx.method} ${meta.ctx.url}] ${meta.message}`;
      }
    },
    knex: {
      client: {
        dialect: 'mysql',
        connection: {
          host: '127.0.0.1',
          port: 3306,
          user: 'root',
          password: '123456',
          database: 'ragflow_webui'
        },
        pool: { min: 0, max: 10 },
        acquireConnectionTimeout: 30000
      },
      app: true
    }
  };

};
