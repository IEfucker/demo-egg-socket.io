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
    return new Date().getTime() + '';
  },
  // reuturns [Object] 属性如下
  // roomId
  // roomOwner-----userId
  // users------userId组成数组
  // clients------socketId组成数组
  // players-----player组成数组，属性同下current user
  // audiences------userId组成数组
  getRoom() {

  },
};
