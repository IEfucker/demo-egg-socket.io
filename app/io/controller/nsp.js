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
}

module.exports = NspController;
