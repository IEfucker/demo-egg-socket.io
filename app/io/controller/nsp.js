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
      console.log(msg);
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
      message,
    } = payload;
    // console.log(payload);
    if (roomId === undefined) return;
    try {
      const msg = ctx.helper.parseMsg('message', message, {
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
    const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const socket = ctx.socket;
    const socketId = socket.id;
    const query = socket.handshake.query;
    // console.log(query);
    const {
      userId,
    } = query;
    // user引用型，指向users中user
    const user = app.users.filter(item => {
      return item.userId === userId;
    })[0];

    const {
      ROOMCREATE,
    } = config.const;

    try {
      // 验证该user是否已在某个room内
      // 如果在，需要先退出再创建
      if (user.inRoom) {
        console.log(user.inRoom);
        const msg = ctx.helper.parseMsg('message', 'User is already in room', {
          socketId,
          inRoom: user.inRoom,
          // target,
        });
        return socket.to(socketId).emit('message', msg);
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
      console.log(roomId);
      // 加入room频道
      socket.join(roomId);
      // 更新app.users用户状态
      user.inRoom = roomId;
      user.isPlayer = true;
      user.currentRole = 1;
      user.isOffline = false;
      user.isReady = true;
      console.log(app.users);

      const {
        rooms = [],
      } = app;
      const room = {
        roomId,
        isDuel,
        roomOwner: userId,
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

      // room在线列表
      nsp.adapter.clients([ roomId ], (err, clients) => {
        logger.debug('#online_join', clients);

        // 更新在线用户列表
        nsp.to(roomId).emit('join', {
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
      if (!roomId) {
        const msg = ctx.helper.parseMsg('message', 'roomId required', {
          socketId,
          // target,
        });
        console.log(socketId, msg);
        return socket.to(socketId).emit('message', msg);
      }
      if (!rooms.length) {
        const msg = ctx.helper.parseMsg('message', 'rooms error', {
          socketId,
          rooms,
          // target,
        });
        return socket.to(socketId).emit('message', msg);
      }
      const hasRoom = await app.redis.get(roomId);

      if (!hasRoom) {
        const msg = ctx.helper.parseMsg('message', 'roomId not exist', {
          socketId,
          rooms,
          // target,
        });
        return socket.to(socketId).emit('message', msg);
      }

      nsp.adapter.clients([ roomId ], (err, clients) => {
        // console.log(clients, socketId);
        app.logger.debug('#online_join', clients);
        // 验证是否已在此房间
        if (clients.length && clients.includes(socketId)) {
          const msg = ctx.helper.parseMsg('message', 'User has been in this room', {
            socketId,
            // target,
          });
          // socket.to(socketId).emit('message', msg);
          socket.emit('message', msg);
          return;
        }
        socket.join(roomId);
        const room = rooms.filter(item => {
          return item.roomId === roomId;
        })[0];

        // 构建user信息，更新room信息
        const {
          players,
          users,
          audiences,
        } = room;
        const user = {
          userId,
          socketId,
        };
        // console.log(players);
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
    // 更新app.users用户状态
    // user.inRoom = roomId;
    // user.isPlayer = true;
    // user.currentRole = 1;
    // user.isOffline = false;
    // user.isReady = true;
    // console.log(app.users);
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
