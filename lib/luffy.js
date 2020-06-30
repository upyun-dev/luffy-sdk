'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const rp = require('request-promise');
const errors = require('request-promise/errors');



class Luffy {
  /**
   * [constructor description]
   *
   * @param   {[String]}  username  [用户名]
   * @param   {[String]}  password  [用户密码]
   * @param   {[String]}  baseUrl   [基础 url]
   *
   */
  constructor(username, password, baseUrl) {
    this.username = username;
    this.password = password;
    this.BASE_URI = baseUrl;
  }
}


Luffy.prototype.requestWithToken = async function (options) {
  options = _.cloneDeep(options);

  if (!this.token) {
    await this.updateToken();
  }

  _.set(options, 'headers.jweToken', this.token);

  let tokenRefreshed = false;

  const self = this;

  async function request() {
    return rp(options).catch(errors.StatusCodeError, (reason) => {
      if (reason.statusCode === 401 && !tokenRefreshed) {
        self.updateToken();
        tokenRefreshed = true;
        self.requestWithToken(options);
      } else {
        throw reason;
      }
    });
  }

  return request();
};

Luffy.prototype.updateToken = async function () {
  const result = await rp({
    method: 'POST',
    uri: `${this.BASE_URI}/login`,
    body: {
      username: this.username,
      password: crypto.createHash('md5').update(this.password, 'utf8').digest('hex'),
    },
    json: true,
  });
  this.token = result.jweToken;
};

Luffy.prototype.listService = async function (project, options = {}) {
  return this.requestWithToken({
    method: 'GET',
    uri: `${this.BASE_URI}/project/${project}/apps`,
    qs: options,
    json: true,
  });
};

/**
 * 获取指定服务信息
 * @param {integer} app
 * @returns {object}
 */
Luffy.prototype.getService = async function (app) {
  return this.requestWithToken({
    method: 'GET',
    uri: `${this.BASE_URI}/app/${app}`,
    json: true,
  });
};

Luffy.prototype.createService = async function (project, options) {
  return await this.requestWithToken({
    method: 'POST',
    uri: `${this.BASE_URI}/project/${project}/apps`,
    body: options,
    json: true,
  });
};

Luffy.prototype.destroyService = async function (app) {
  return await this.requestWithToken({
    method: 'DELETE',
    uri: `${this.BASE_URI}/app/${app}`,
  });
};

/**
 * 重新启动指定服务
 * @param  {integer} app  [app 编号]
 */
Luffy.prototype.restartService = async function (app) {
  return await this.requestWithToken({
    method: 'POST',
    uri: `${this.BASE_URI}/app/${app}/restart`,
  });
}

/**
 * 获取指定项目下是所有的实例列表
 * @param {integer} project 项目 id
 * @param {object} options
 *
 * @returns {object|null}
 */
Luffy.prototype.listPods = async function (project, options = {}) {
  return await this.requestWithToken({
    method: 'GET',
    uri: `${this.BASE_URI}/project/${project}/pods`,
    qs: options,
    json: true,
  });
}

module.exports = Luffy;
