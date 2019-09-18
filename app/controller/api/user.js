'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async getUser(ctx) {
    const {
      userId,
    } = ctx.session;
    const service = userId ? 'getUserById' : 'getUserRandomly';
    const user = await ctx.service.user[service](userId);
    ctx.session.userId = user.id;
    ctx.body = user;
    ctx.status = 200;
  }

  async getUsers(ctx) {
    const users = await ctx.service.user.getUsers();
    ctx.body = users;
    ctx.status = 200;
  }
}

module.exports = UserController;
