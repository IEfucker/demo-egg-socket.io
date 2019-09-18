'use strict';

const Service = require('egg').Service;


class UserService extends Service {
  getUserById(userId) {
    const {
      app,
    } = this.ctx;
    const user = app.mockUsers.filter(u => (u.id === userId))[0];
    // 该用户标记为登陆
    // this.signInUserById(user.id);
    return user;
  }
  getUserRandomly() {
    const {
      app,
    } = this.ctx;
    const validUsers = app.mockUsers.filter(u => (u.isOnline !== true));
    const len = validUsers.length;
    if (!len) throw new Error('Users pool empty');
    const randIndex = Math.floor(Math.random() * len);
    const user = validUsers[randIndex];
    // 该用户标记为登陆
    // this.signInUserById(user.id);
    return user;
  }
  // socket连接后，isOnline再更新为true
  signInUserById(id) {
    const {
      app,
    } = this.ctx;
    app.mockUsers = app.mockUsers.map(u => {
      if (id === u.id) u.isOnline = true;
      return u;
    });
  }
  logoutUserById(id) {
    const {
      app,
    } = this.ctx;
    app.mockUsers = app.mockUsers.map(u => {
      if (id === u.id) u.isOnline = false;
      return u;
    });
  }
  // 带有在线与否信息
  getUsers() {
    const {
      app,
    } = this.ctx;
    return app.mockUsers;
  }
}
module.exports = UserService;
