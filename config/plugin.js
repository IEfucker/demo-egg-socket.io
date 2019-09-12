'use strict';

// had enabled by egg
// exports.static = true;

exports.io = {
  enable: true,
  package: 'egg-socket.io',
};

exports.nunjucks = {
  enable: true,
  package: 'egg-view-nunjucks',
};

exports.redis = {
  enable: true,
  package: 'egg-redis',
};

exports.cors = {
  enable: true,
  package: 'egg-cors',
};

// exports.security = {
//   // domainWhiteList: [ 'http://localhost:3000' ],
//   enable: false,
//   package: 'egg-security',
// };
