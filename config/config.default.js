'use strict';

const path = require('path');
const assert = require('assert');

const { middleware, middlewareMatch } = require('@jianghujs/jianghu/config/middlewareConfig');

const eggJianghuPathTemp = require.resolve('@jianghujs/jianghu');
const eggJianghuPath = path.join(eggJianghuPathTemp, '../');

module.exports = appInfo => {
  assert(appInfo);

  const appId = 'jianghu-webui';
  const uploadDir = path.join(appInfo.baseDir, 'upload');
  const downloadBasePath = `/${appId}/upload`;

  return {
    appId,
    appTitle: 'jianghu-ragflow-webui',
    appLogo: `${appId}/public/img/logo.png`,
    appType: 'single',
    appDirectoryLink: '/',
    indexPage: `/${appId}/page/index`,
    loginPage: `/${appId}/page/login`,
    helpPage: `/${appId}/page/help`,
    uploadDir,
    downloadBasePath,
    primaryColor: "#4caf50",
    primaryColorA80: "#EEF7EE",
    static: {
      maxAge: 0,
      buffer: false,
      preload: false,
      maxFiles: 0,
      dir: [
        { prefix: `/${appId}/public/`, dir: path.join(appInfo.baseDir, 'app/public') },
        { prefix: `/${appId}/public/`, dir: path.join(eggJianghuPath, 'app/public') },
        { prefix: `/${appId}/upload/`, dir: uploadDir },
      ],
    },
    ragflow: {
      baseUrl: 'https://xxx.com',
      apiKey: 'ragflow-xxxx',

      chatOptions: [
        {
          id: 'd380f780150411f0b2be0242c0a8b006',
          name: '江湖AI助手',
          description: '专业解答，江湖AI问题',
          hotTopics: [],
          models: ['Deepseek-V3', 'Deepseek-R1', 'Gemini2-Flash', 'Gemini2.5-Pro'],
          systemPrompts: [],
          knowledgeBaseId: '06f35b361f8b11f0a9786d2c3244c3ba',
        }
      ],
    },
    view: {
      defaultViewEngine: 'nunjucks',
      mapping: { '.html': 'nunjucks' },
      root: [
        path.join(appInfo.baseDir, 'app/view'),
        path.join(eggJianghuPath, 'app/view'),
      ].join(','),
    },
    middleware,
    ...middlewareMatch,
  };

};
