'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const {
    router,
    controller,
    io,
    config,
  } = app;
  router.get('/', controller.home.index);

  const {
    ROOMCREATE,
    ROOMLEAVE,
    ROOMJOIN,
  } = config.const;


  // socket.io
  io.of('/').route('exchange', io.controller.nsp.exchange);
  io.of('/').route('message', io.controller.nsp.message);
  io.of('/').route(ROOMCREATE, io.controller.nsp.roomCreate);
  io.of('/').route(ROOMLEAVE, io.controller.nsp.roomLeave);
  io.of('/').route(ROOMJOIN, io.controller.nsp.roomJoin);
};
