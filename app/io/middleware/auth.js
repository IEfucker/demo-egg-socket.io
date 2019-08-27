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
    const user = {
      userId,
      socketId: id,
    };
    // console.log('join into hall', user);

    // 进入大厅
    socket.join(hall, () => {
      // const rooms = Object.keys(socket.rooms);
      // console.log(rooms); // [ <socket.id>, 'HALL' ]
    });

    // user注册到app上
    const {
      users = [],
    } = app;
    users.push(user);
    app.users = users;

    // 在线列表
    nsp.adapter.clients([ hall ], (err, clients) => {
      logger.debug('#online_join', clients);

      // !!上线消息应该发给指定用户，如好友，而非所有
      // 更新在线用户列表
      nsp.to(hall).emit('online', {
        user,
        action: 'online',
        target: 'participator',
        message: `Client(${id}) joined.`,
      });
    });

    await next();
    // 全局中剔除user
    users.some((item, i, users) => {
      if (item.userId === user.userId) {
        users.splice(i, 1);
        console.log(user, users);
        return true;
      }
      return false;
    });
    app.users = users;

    // 用户离开
    logger.debug('#leave', hall);
    console.log('leave hall', id, userId);
    socket.leave(hall);

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
        user,
        action: 'offline',
        target: 'participator',
        message: `Client(${id}) leaved.`,
      });
    });

  };
};
