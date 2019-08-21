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
    const query = socket.handshake.query;
    const {
      room,
    } = query;
    console.log(socket.handshake);
    console.log(room, payload);

    try {
      const msg = ctx.helper.parseMsg('message', payload, {
        client,
        // target,
      });
      // socket.emit('message', msg);
      nsp.to(room).emit('message', msg);
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
    const client = socket.id;
    const query = socket.handshake.query;

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
      query.room = roomId;

      // room在线列表
      nsp.adapter.clients([ roomId ], (err, clients) => {
        logger.debug('#online_join', clients);

        // 更新在线用户列表
        nsp.to(roomId).emit('online', {
          clients,
          action: ROOMCREATE,
          target: 'participator',
          message: `Client(${client}) joined.`,
        });
      });


    } catch (error) {
      app.logger.error(error);
    }
  }

  async roomInvite() {
    const {
      ctx,
      app,
      config,
    } = this;
    // const nsp = app.io.of('/');
    const payload = ctx.args[0] || {};
    const socket = ctx.socket;
    // const client = socket.id;
    // const query = socket.handshake.query;
    const {
      ROOMINVITE,
    } = config.const;

    console.log('invite', payload);

    try {
      const {
        roomId,
        inviter,
        invitee,
      } = payload;
      socket.emit(invitee, {
        action: ROOMINVITE,
        roomId,
        inviter,
      });
    } catch (error) {
      app.logger.error(error);
    }
  }
}

module.exports = NspController;
