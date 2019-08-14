'use strict';

const PREFIX = 'room';

module.exports = () => {
  return async (ctx, next) => {
    const {
      app,
      socket,
      logger,
      helper,
    } = ctx;
    const id = socket.id;
    const nsp = app.io.of('/');
    const query = socket.handshake.query;

    // 用户信息
    const {
      room,
      userId,
    } = query;
    const rooms = [ room ];

    logger.debug('#user_info', id, room, userId);

    const tick = (id, msg) => {
      logger.debug('#tick', id, msg);

      // 踢出用户前发送消息
      socket.emit(id, helper.parseMsg('deny', msg));

      // 调用 adapter 方法踢出用户，客户端触发 disconnect 事件
      nsp.adapter.remoteDisconnect(id, true, err => {
        logger.error(err);
      });
    };

    // 检查房间是否存在，不存在则踢出用户
    // 备注：此处 app.redis 与插件无关，可用其他存储代替
    const hasRoom = await app.redis.get(`${PREFIX}:${room}`);

    logger.debug('#has_exist', hasRoom);

    if (!hasRoom) {
      tick(id, {
        type: 'deleted',
        message: 'deleted, room has been deleted.',
      });
      return;
    }

    // 用户加入
    logger.debug('#join', room);
    socket.join(room);
    addUser(room, userId, id);

    // 在线列表
    nsp.adapter.clients(rooms, (err, clients) => {
      logger.debug('#online_join', clients);

      // 更新在线用户列表
      nsp.to(room).emit('online', {
        clients,
        players: app.rooms[room].players,
        socketId: id,
        userId,
        action: 'join',
        target: 'participator',
        message: `User(${id}) joined.`,
      });
    });

    await next();

    // 用户离开
    logger.debug('#leave', room);
    removeUser(room, userId, id);
    // 在线列表
    nsp.adapter.clients(rooms, (err, clients) => {
      logger.debug('#online_leave', clients);

      // 获取 client 信息
      // const clientsDetail = {};
      // clients.forEach(client => {
      //   const _client = app.io.sockets.sockets[client];
      //   const _query = _client.handshake.query;
      //   clientsDetail[client] = _query;
      // });

      // 更新在线用户列表
      nsp.to(room).emit('online', {
        clients,
        players: app.rooms[room].players,
        socketId: id,
        userId,
        action: 'leave',
        target: 'participator',
        message: `User(${id}) leaved.`,
      });
    });

    // add player if players are not full
    function addUser(room, userId, socketId) {
      app.rooms = app.rooms || {};
      app.rooms[room] = app.rooms[room] || {};
      const currentRoom = app.rooms[room];
      currentRoom.players = currentRoom.players || [];
      const players = currentRoom.players;
      // TODO: 默认用户不可能多次进入一个房间，如在两个客户端使用一个身份同时游戏，需要对用户做多客户端限制
      // 验证是否为掉线player，是则重连
      const index = players.findIndex(p => {
        if (p.userId === userId && p.isOffline === true) {
          // 重连标记
          p.isOffline = false;
          return true;
        }
        return false;
      });
      // 为掉线用户，已重连，return
      if (index > -1) return;
      // players已满（掉线用户只能原player重连填补位置） return
      if (players.length === 2) return;
      // 添加player
      players.push({
        userId,
        socketId,
      });
    }

    // remove player if user is a player
    function removeUser(room, userId) {
      app.rooms = app.rooms || {};
      app.rooms[room] = app.rooms[room] || {};
      const currentRoom = app.rooms[room];
      currentRoom.players = currentRoom.players || [];
      let players = currentRoom.players;
      // players = players.filter(p => {
      //   return p.userId !== userId;
      // });
      // if (players.length !== 2) {
      //   currentRoom.players = players;
      //   console.log(currentRoom.players);
      // }

      // 标记player为offline
      players = players.map(p => {
        if (p.userId === userId) p.isOffline = true;
        return p;
      });
      console.log(players);
    }

  };
};
