'use strict';

module.exports = {
  parseMsg(action, payload = {}, metadata = {}) {
    const meta = Object.assign({}, {
      timestamp: Date.now(),
    }, metadata);

    return {
      meta,
      data: {
        action,
        payload,
      },
    };
  },
  allocRoomId() {
    return 'room:' + new Date().getTime();
  },
  allocGameId() {
    return 'game:' + new Date().getTime();
  },
  // 默认返回空
  getBoardMap() {
    const board = [];
    for (let i = 0; i < 15; i++) {
      const row = [];
      for (let j = 0; j < 15; j++) {
        row.push(0);
      }
      board.push(row);
    }
    return board;
  },
  emitRoomJoin(nsp, roomId, userId, socketId, clients) {
    nsp.to(roomId).emit('online', {
      clients,
      action: 'join',
      roomId,
      user: {
        userId,
        socketId,
      },
      target: 'participator',
      message: `User(${userId}) joined room(${roomId}).`,
    });
  },
  emitRoomLeave(nsp, roomId, userId, socketId, clients) {
    nsp.to(roomId).emit('online', {
      clients,
      action: 'leave',
      roomId,
      user: {
        userId,
        socketId,
      },
      target: 'participator',
      message: `User(${userId}) leaved room(${roomId}).`,
    });
  },


  /**
   * 获取（创建）room信息
   * @param {String} roomId
   * @param {String} userId
   * room属性如下
   * roomId
   * isDuel ---- 是否为对决房
   * roomOwner ---- userId
   * users ----- user组成数组，属性同下current user
   * players ---- userId组成数组
   * audiences ----- userId组成数组
   * gameId
   * gameStarted
   * boardMap
   * turn ---- 当前轮次，与currentRole比较
   * winner
   * winArray
   * @returns room {Object}
   */

  getRoom(nsp, roomId, userId) {
    const isDuel = false;
    const users = [];
    const room = {
      roomId,
      isDuel,
      roomOwner: userId,
      users,
    };
    return room;
  },
  getUser() {},
};
