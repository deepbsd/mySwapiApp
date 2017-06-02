exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://localhost/mySwapi/';
exports.TEST_DATABASE_URL = (
   process.env.TEST_DATABASE_URL ||
   'mongodb://localhost/myTestSwapi/');

// exports.USER_DATABASE_URL = (
//   process.env.USER_DATABASE_URL ||
//   'mongodb://localhost/users/');

exports.PORT = process.env.PORT || 8080;
