'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {
  async getUser(ctx) {
    const user = await ctx.service.user.getUserAtRandom();
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
