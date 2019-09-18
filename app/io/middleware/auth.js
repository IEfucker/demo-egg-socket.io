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
    // const user = {
    //   userId,
    //   socketId: id,
    // };
    let user = app.mockUsers.filter(u => {
      if (u.id === userId) {
        u.socketId = id;
        u.isOnline = true;
        return true;
      }
      return false;
    })[0];
    // console.log('join into hall', user);

    // 进入大厅
    socket.join(hall, () => {
      user.isOnline = true;
    });


    // 在线列表
    nsp.adapter.clients([ hall ], (err, clients) => {
      logger.debug('#online_join', clients);

      // !!上线消息应该发给指定用户，如好友，而非所有
      // 更新在线用户列表
      nsp.to(hall).emit('online', {
        user,
        rooms: app.rooms,
        action: 'online',
        target: 'participator',
        message: `Client(${id}) joined.`,
      });
    });

    // 如果是刷新重连，
    // 重新加入room频道
    if (user.inRoom) {
      socket.join(user.inRoom);
    }
    console.log(socket.id);

    await next();

    // 用户离开
    // 更新mockUsers状态
    user = app.mockUsers.filter(u => {
      if (u.id === userId) {
        u.socketId = null;
        u.isOnline = false;
        return true;
      }
      return false;
    })[0];
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
