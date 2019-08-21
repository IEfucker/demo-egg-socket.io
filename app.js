'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    const hallName = app.config.const.HALL;
    const hall = await app.redis.get(hallName);
    if (!hall) {
      await app.redis.set(hallName, 'hall');
    }
  });
};
