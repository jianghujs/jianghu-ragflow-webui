/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.post('/api/chat/message', controller.chat.sendMessage);
  router.post('/api/agent/message', controller.agent.sendMessage);
};
