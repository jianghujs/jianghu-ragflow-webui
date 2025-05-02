/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;

  router.post('/api/chat/message', controller.chat.sendMessage);
  router.post('/api/chat/createSession', controller.chat.createSession);
  router.post('/api/chat/updateSession', controller.chat.updateSession);
  router.post('/api/chat/getSessionList', controller.chat.getSessionList);
  router.post('/api/chat/deleteSession', controller.chat.deleteSession);
  router.post('/api/chat/getSessionDetail', controller.chat.getSessionDetail);

  router.post('/api/agent/message', controller.agent.sendMessage);
  router.post('/api/agent/createSession', controller.agent.createSession);
  router.post('/api/agent/updateSession', controller.agent.updateSession);
  router.post('/api/agent/getSessionList', controller.agent.getSessionList);
  router.post('/api/agent/deleteSession', controller.agent.deleteSession);
  router.post('/api/agent/getSessionDetail', controller.agent.getSessionDetail);
};
