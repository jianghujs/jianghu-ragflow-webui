'use strict';

const path = require('path');

module.exports = appInfo => {

  return {
    ragflow: {
      baseUrl: 'http://127.0.0.1:9380/api/v1',
    },
    static: {
      maxAge: 0,
      buffer: false,
      preload: false,
      maxFiles: 0,
    },
    logger: {
      outputJSON: true,
      level: 'INFO',
      // level: 'DEBUG',
      // allowDebugAtProd: true,
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
          port: '3306',
          user: 'root',
          password: '123456',
          database: 'ragflow_xiaoxun'
        },
        pool: { min: 0, max: 10 },
        acquireConnectionTimeout: 30000
      },
      app: true
    }
  };
};
