'use strict';
const allocRoomId = require('../../extend/helper').allocRoomId;
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

    // console.log(socket.handshake);

    // 用户信息
    const {
      userId,
    } = query;

    let room = query.room;
    // 默认为根据房间号加入房间
    let isJoin = true;
    // 没有房间号，为创建房间
    if (!room) {
      isJoin = false;
      query.room = room = allocRoomId();
    }

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
    const roomKey = `${PREFIX}:${room}`;
    const hasRoom = await app.redis.get(roomKey);

    logger.debug('#has_exist', hasRoom);
    if (!hasRoom) {
      // 根据房间号加入
      if (isJoin) {
        tick(id, {
          type: 'deleted',
          message: 'deleted, room has been deleted.',
        });
        return;
      }
      // 创建房间
      app.redis.set(roomKey, room);
    }

    // 用户加入
    logger.debug('#join', room);
    socket.join(room);
    const isPlayer = addUser(room, userId, id);

    // 在线列表
    nsp.adapter.clients(rooms, (err, clients) => {
      logger.debug('#online_join', clients);

      // 更新在线用户列表
      nsp.to(room).emit('online', {
        clients,
        room,
        players: app.rooms[room].players,
        isPlayer,
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
        room,
        players: app.rooms[room].players,
        isPlayer,
        socketId: id,
        userId,
        action: 'leave',
        target: 'participator',
        message: `User(${id}) leaved.`,
      });
    });

    // add user
    // returns {Boolen} true if user is a player
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
      // 为掉线用户，已重连，return true
      if (index > -1) return true;
      // players已满（掉线用户只能原player重连填补位置） return false
      if (players.length === 2) return false;
      // 添加player, add player if players are not full
      players.push({
        userId,
        socketId,
      });
      return true;
    }

    // remove player if user is a player
    function removeUser(room, userId) {
      app.rooms = app.rooms || {};
      app.rooms[room] = app.rooms[room] || {};
      const currentRoom = app.rooms[room];
      currentRoom.players = currentRoom.players || [];
      const players = currentRoom.players;
      // players = players.filter(p => {
      //   return p.userId !== userId;
      // });
      // if (players.length !== 2) {
      //   currentRoom.players = players;
      //   console.log(currentRoom.players);
      // }

      // 标记player为offline
      players.map(p => {
        if (p.userId === userId) p.isOffline = true;
        return p;
      });
      // console.log(isPlayer);
    }

  };
};
