'use strict';

const path = require('path');
const assert = require('assert');

const { middleware, middlewareMatch } = require('@jianghujs/jianghu/config/middlewareConfig');

const eggJianghuPathTemp = require.resolve('@jianghujs/jianghu');
const eggJianghuPath = path.join(eggJianghuPathTemp, '../');

module.exports = appInfo => {
  assert(appInfo);

  const appId = 'ragflow-tudi';
  const uploadDir = path.join(appInfo.baseDir, 'upload');
  const downloadBasePath = `/${appId}/upload`;

  return {
    appId,
    appTitle: '土地应用',
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
      baseUrl: 'https://ai02.jhxf.org',
      apiKey: 'ragflow-A1YTRjZGU4ZjhkZDExZWY4YTQ0MDI0Mm',

      chatOptions: [
        {
          id: 'a07fad5a03f611f08c390242ac180006',
          name: '土地法规机器人',
          description: '专业解答，土地法规问题',
          hotTopics: [
            "农用地有什么政策",
            "耕地有什么政策",
            "建设用地有什么政策",
            "土地征收有什么政策",
          ],
          models: [],
          isChat: true,
        },
        {
          id: '1ba3b7fc066711f09ebf0242ac190006',
          name: '土地公告机器人',
          description: '专业解答，土地公告问题',
          hotTopics: [
            "查询八里桥地块信息",
            "查询深圳地块信息",
            "查询上海地块信息",
            "查询广州地块信息",
          ],
          models: [],
          isChat: true,
        },
        {
          id: '10e60d260ec111f0b9030242c0a8a006',
          name: '土地统计机器人',
          description: '专业解答，土地统计问题',
          hotTopics: [],
          models: [],
          isChat: false,
        },
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
