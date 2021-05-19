const got = require('got');

exports.request = (baseUrl, noStrictSSL, options = {}) => {
  return got.extend({
    prefixUrl: baseUrl,
    responseType: 'json',
    resolveBodyOnly: true,
    https: {
      rejectUnauthorized: noStrictSSL ? false : true,
    },
    hooks: {
      beforeError: [
        error => {
          const {response} = error;
          error.statusCode = 500;
          error.message = '服务器发生错误';
          if (response?.body) {
            error.statusCode = response.statusCode;
            error.message = response.body.message;
          }
          return error;
        },
      ],
    },
  });
};

