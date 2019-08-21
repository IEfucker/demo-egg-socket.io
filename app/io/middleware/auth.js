'use strict';

module.exports = () => {
  return async (ctx, next) => {
    const {
      app,
      socket,
      logger,
    } = ctx;
    const id = socket.id;
    const nsp = app.io.of('/');
    const query = socket.handshake.query;
    const hall = app.config.const.HALL;

    // 用户信息
    const {
      userId,
    } = query;

    logger.debug('#user_info', id, userId);

    // 进入大厅
    socket.join(hall);

    // 在线列表
    nsp.adapter.clients([ hall ], (err, clients) => {
      logger.debug('#online_join', clients);

      // 更新在线用户列表
      nsp.to(hall).emit('online', {
        clients,
        action: 'join',
        target: 'participator',
        message: `Client(${id}) joined.`,
      });
    });

    await next();

    // 用户离开
    logger.debug('#leave', hall);

    // 在线列表
    nsp.adapter.clients([ hall ], (err, clients) => {
      logger.debug('#online_leave', clients);

      // 获取 client 信息
      // const clientsDetail = {};
      // clients.forEach(client => {
      //   const _client = app.io.sockets.sockets[client];
      //   const _query = _client.handshake.query;
      //   clientsDetail[client] = _query;
      // });

      // 更新在线用户列表
      nsp.to(hall).emit('online', {
        clients,
        action: 'leave',
        target: 'participator',
        message: `Client(${id}) leaved.`,
      });
    });

  };
};
