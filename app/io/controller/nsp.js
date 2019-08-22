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

    try {
      const msg = ctx.helper.parseMsg('message', message, {
        client,
        // target,
      });
      console.log(msg);
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
    console.log(query);
    const {
      userId,
    } = query;
    const user = {
      userId,
      socketId,
      isPlayer: true,
      // 默认执黑
      currentRole: 1,
      isOffline: false,
      isReady: true,
    };

    const {
      ROOMCREATE,
    } = config.const;

    try {
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
      // 加入room频道
      socket.join(roomId);

      const {
        rooms = [],
      } = app;
      const room = {
        roomId,
        isDuel,
        roomOwner: userId,
        users: [ user ],
        players: [ userId ],
        audiences: null,
        gameId: ctx.helper.allocGameId(),
        gameStarted: false,
        boardMap: ctx.helper.getBoardMap(),
        turn: 1,
        winner: null,
        winnerArray: null,
      };
      rooms.push(room);

      // room在线列表
      nsp.adapter.clients([ roomId ], (err, clients) => {
        logger.debug('#online_join', clients);

        // 更新在线用户列表
        nsp.to(roomId).emit('online', {
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
        nsp.to(roomId).emit('online', {
          clients,
          action: 'join',
          roomId,
          target: 'participator',
          message: `Client(${client}) joined.`,
        });
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
        nsp.to(roomId).emit('online', {
          clients,
          action: 'join',
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
