'use strict';
//
const mockUsers = [{
  id: '1',
  name: 'user1',
  isOnline: false,
  avatar: '/resources/images/avatar/boy.png',
},
{
  id: '2',
  name: 'user2',
  isOnline: false,
  avatar: '/resources/images/avatar/boy-1.png',
},
{
  id: '3',
  name: 'user3',
  isOnline: false,
  avatar: '/resources/images/avatar/boy-2.png',
},
{
  id: '4',
  name: 'user4',
  isOnline: false,
  avatar: '/resources/images/avatar/boy-3.png',
},
{
  id: '5',
  name: 'user5',
  isOnline: false,
  avatar: '/resources/images/avatar/boy-4.png',
},
{
  id: '6',
  name: 'user6',
  isOnline: false,
  avatar: '/resources/images/avatar/girl-1.png',
},
{
  id: '7',
  name: 'user7',
  isOnline: false,
  avatar: '/resources/images/avatar/girl-2.png',
},
{
  id: '8',
  name: 'user8',
  isOnline: false,
  avatar: '/resources/images/avatar/girl-3.png',
},
{
  id: '9',
  name: 'user9',
  avatar: '/resources/images/avatar/girl-4.png',
},
{
  id: '10',
  name: 'user10',
  avatar: '/resources/images/avatar/girl-5.png',
},
{
  id: '11',
  name: 'user11',
  avatar: '/resources/images/avatar/girl-6.png',
},
{
  id: '12',
  name: 'user12',
  avatar: '/resources/images/avatar/girl-7.png',
},
];
module.exports = app => {
  app.beforeStart(async () => {
    const hallName = app.config.const.HALL;
    const hall = await app.redis.get(hallName);
    if (!hall) {
      await app.redis.set(hallName, 'hall');
    }

    app.mockUsers = app.mockUsers || mockUsers;
  });
};
