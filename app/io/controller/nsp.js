'use strict';

const Controller = require('egg').Controller;

class NspController extends Controller {
  async exchange() {
    const {
      ctx,
      app,
    } = this;
    const nsp = app.io.of('/');
    const message = ctx.args[0] || {};
    const socket = ctx.socket;
    const client = socket.id;
    console.log(message);
    try {
      const {
        target,
        payload,
      } = message;
      if (!target) return;
      const msg = ctx.helper.parseMsg('exchange', payload, {
        client,
        target,
      });
      nsp.emit(target, msg);
    } catch (error) {
      app.logger.error(error);
    }
  }

  async message() {
    const {
      ctx,
      app,
    } = this;
    const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const socket = ctx.socket;
    const client = socket.id;
    // const query = socket.handshake.query;
    const {
      roomId,
    } = payload;
    console.log(payload);
    if (roomId === undefined) return;
    try {
      payload.isSending = false;
      const msg = ctx.helper.parseMsg('message', payload, {
        client,
        // target,
      });
      // socket.emit('message', msg);
      nsp.to(roomId).emit('message', msg);
    } catch (error) {
      app.logger.error(error);
    }
  }

  async roomCreate() {
    const {
      ctx,
      app,
      config,
      logger,
    } = this;
    const hall = app.config.const.HALL;
    const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const socket = ctx.socket;
    const socketId = socket.id;
    const query = socket.handshake.query;
    const {
      userId,
    } = query;
    // user引用型，指向users中user
    const user = app.mockUsers.filter(item => {
      return item.id === userId;
    })[0];
    // console.log(user);
    const {
      ROOMCREATE,
    } = config.const;

    try {
      // 验证该user是否已在某个room内
      // 如果在，需要先退出再创建
      if (user.inRoom) {
        const msg = ctx.helper.parseMsg('room:create:failed', {
          socketId,
          inRoom: user.inRoom,
          message: 'User is already in a room',
          // target,
        });
        return socket.emit(socketId, msg);
      }
      const {
        isDuel,
        pass,
      } = payload;
      const roomId = ctx.helper.allocRoomId();
      // 对决房
      if (isDuel) {
        console.log('password: %O', pass);
        console.log('对决房间还需要实现');
      } else {
        // 公开房
      }
      // 创建房间
      app.redis.set(roomId, 'room');
      // console.log(roomId);
      // 加入room频道
      socket.join(roomId);
      // 更新app.users用户状态
      user.inRoom = roomId;
      user.isPlayer = true;
      user.socketId = socketId;
      user.currentRole = 1;
      user.isOffline = false;
      user.isReady = false;
      // console.log(app.mockUsers);

      const {
        rooms = [],
      } = app;
      const room = {
        roomId,
        isDuel,
        owner: userId,
        NO: roomId.replace('room:', ''),
        users: [ user ],
        players: [ userId ],
        audiences: [],
        gameId: ctx.helper.allocGameId(),
        gameStarted: false,
        // boardMap: ctx.helper.getBoardMap(),
        turn: 1,
        winner: null,
        winnerArray: [],
      };
      rooms.push(room);
      app.rooms = rooms;
      // console.log(app.rooms);

      // room在线列表
      nsp.adapter.clients([ roomId ], (err, clients) => {
        logger.debug('#online_join', clients);

        // 向大厅发送创建房间成功消息
        nsp.to(hall).emit('room:created', {
          action: ROOMCREATE,
          payload: {
            room,
            user,
          },
          target: 'participator',
          message: `Client(${socketId}) joined.`,
        });
      });
    } catch (error) {
      app.logger.error(error);
    }
  }

  async roomJoin() {
    const {
      ctx,
      app,
    } = this;
    const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const {
      socket,
    } = ctx;
    const socketId = socket.id;
    // const query = socket.handshake.query;
    const {
      roomId,
      userId,
    } = payload;
    const {
      rooms = [],
    } = app;
    // console.log(payload);
    try {
      const action = 'room:join:failed';
      if (!roomId) {
        const msg = ctx.helper.parseMsg(action, 'roomId required', {
          socketId,
          // target,
        });
        // console.log(socketId, msg);
        return socket.emit(socketId, msg);
        // return socket.to(socketId).emit('message', msg);
      }
      if (!rooms.length) {
        const msg = ctx.helper.parseMsg(action, 'rooms error', {
          socketId,
          rooms,
          // target,
        });
        return socket.emit(socketId, msg);
      }
      const hasRoom = await app.redis.get(roomId);

      if (!hasRoom) {
        const msg = ctx.helper.parseMsg(action, 'roomId not exist', {
          socketId,
          rooms,
          // target,
        });
        return socket.emit(socketId, msg);
      }
      nsp.adapter.clients([ roomId ], (err, clients) => {
        // console.log(clients, socketId);
        app.logger.debug('#online_join', clients);
        // 验证是否已在此房间
        if (clients.length && clients.includes(socketId)) {
          const msg = ctx.helper.parseMsg(
            'message',
            'User has been in this room', {
              socketId,
              // target,
            }
          );
          // socket.to(socketId).emit('message', msg);
          socket.emit('message', msg);
          return;
        }

        socket.join(roomId);
        const room = rooms.filter(item => {
          return item.roomId === roomId;
        })[0];
        // console.log(room);
        // 构建user信息，更新room信息
        const {
          players,
          users,
          audiences,
        } = room;
        // const user = {
        //   userId,
        //   socketId,
        // };
        const user = app.mockUsers.filter(u => {
          if (u.id === userId) {
            u.inRoom = room.roomId;
            return true;
          }
          return false;
        })[0];
        // console.log(user);
        if (players.length >= 2) {
          // audience
          user.isPlayer = false;
          audiences.push(userId);
        } else {
          // player2
          user.isPlayer = true;
          user.currentRole = -1;
          user.isOffline = false;
          user.isReady = false;
          players.push(userId);
        }
        users.push(user);

        // 更新在线用户列表
        nsp.to(roomId).emit('join', {
          action: app.config.const.ROOMJOIN,
          payload: {
            room,
            user,
          },
          target: 'participator',
          message: `socketId(${socketId}) joined.`,
        });
      });
    } catch (error) {
      app.logger.error(error);
      console.log(error);
    }
  }

  async roomLeave() {
    const {
      ctx,
      app,
      config,
      logger,
    } = this;
    const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const socket = ctx.socket;
    const socketId = socket.id;
    const query = socket.handshake.query;
    const {
      userId,
    } = query;
    const {
      roomId,
    } = payload;
    // user引用型，指向users中user
    const user = app.mockUsers.filter(item => {
      return item.id === userId;
    })[0];

    const {
      ROOMLEAVE,
    } = config.const;

    try {
      // 验证该user是否已在某个room内
      // 如果不在，error
      const hasRoom = await app.redis.get(roomId);
      console.log(roomId, user.inRoom, hasRoom);
      if (!roomId || user.inRoom !== roomId || !hasRoom) {
        const msg = ctx.helper.parseMsg('room:leave:failed', {
          socketId,
          inRoom: user.inRoom,
          roomId,
          message: 'RoomId error',
          // target,
        });
        return socket.emit(socketId, msg);
      }

      // 更新rooms
      const {
        rooms = [],
      } = app;
      let roomIndex;
      let room = rooms.filter((item, index) => {
        if (item.roomId === roomId) {
          roomIndex = index;
          return true;
        }
        return false;
      })[0];
      // 退出room频道
      socket.leave(roomId);
      // 仅剩一名用户
      if (room.users.length === 1) {
        app.redis.del(roomId);
        rooms.splice(roomIndex, 1);
        room = null;
      } else {
        // 更新起来真麻烦
        // 不管了
        // room.users
        // room.players
        // room.audiences

      }
      app.rooms = rooms;
      // console.log(app.rooms);

      // 更新app.users用户状态
      user.inRoom = null;
      delete user.isPlayer;
      delete user.currentRole;
      delete user.isOffline;
      delete user.isReady;

      // room在线列表
      nsp.adapter.clients([ roomId ], (err, clients) => {
        logger.debug('#online_leave', clients);
        const message = room ?
          `Client(${socketId}) leaved.` :
          `Room ${roomId} has been destroyed`;
        const action = room ? ROOMLEAVE : 'room:destroyed';
        const payload = {
          action,
          payload: {
            roomId,
            room,
            user,
          },
          target: 'participator',
          message,
        };
        console.log(room, socketId);
        // 更新在线用户列表
        if (room) {
          nsp.to(roomId).emit('leave', payload);
        }
        // 给该用户单独发送消息
        socket.emit(socketId, payload);
      });
    } catch (error) {
      app.logger.error(error);
    }
  }

  async roomTick() {
    const {
      ctx,
      app,
    } = this;
    const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const {
      socket,
    } = ctx;
    const client = socket.id;
    // const query = socket.handshake.query;
    const {
      roomId,
    } = payload;

    try {
      socket.join(roomId);
      // query.room = roomId;

      nsp.adapter.clients([ roomId ], (err, clients) => {
        app.logger.debug('#online_join', clients);

        // 更新在线用户列表
        nsp.to(roomId).emit('leave', {
          clients,
          action: 'leave',
          roomId,
          target: 'participator',
          message: `Client(${client}) joined.`,
        });
      });
    } catch (error) {
      app.logger.error(error);
    }
  }
}

module.exports = NspController;
