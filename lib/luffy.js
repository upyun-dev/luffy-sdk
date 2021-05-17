'use strict';

const got = require('got');
const crypto = require('crypto');
const _ = require('lodash');




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

const getRp = (baseUrl,options = {}) => {
  return got.extend({
    prefixUrl: baseUrl,
    responseType: 'json',
    resolveBodyOnly: true,
  });
}

Luffy.prototype.requestWithToken = async function (options) {
  options = _.cloneDeep(options);
  if (!this.token) {
    await this.updateToken();
  }
  _.set(options, 'headers.jweToken', this.token);
  let tokenRefreshed = false;
  const self = this;
  const rp = getRp(this.BASE_URI);
  return (() => {
    try {
      return rp(options);
    } catch (error) {
      if (error.statusCode === 401 && !tokenRefreshed) {
        self.updateToken();
        tokenRefreshed = true;
        self.requestWithToken(options);
      } else {
        throw error;
      }
    }
  })();
};

Luffy.prototype.updateToken = async function () {
  const rp = getRp(this.BASE_URI);
  console.log( {
    username: this.username,
    password: crypto.createHash('md5').update(this.password, 'utf8').digest('hex'),
  });
  const result = await rp({
    method: 'POST',
    url: 'login',
    json: {
      username: this.username,
      password: crypto.createHash('md5').update(this.password, 'utf8').digest('hex'),
    },
  });
  console.log(result);
  this.token = result.jweToken;
  return result.jweToken;
};

Luffy.prototype.listService = async function (project, options = {}) {
  return this.requestWithToken({
    method: 'GET',
    url: `project/${project}/apps`,
    searchParams: options,
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
    url: `app/${app}`,
  });
};

Luffy.prototype.createService = async function (project, options = {}) {
  return await this.requestWithToken({
    method: 'POST',
    url: `project/${project}/apps`,
    json: options
  });
};

Luffy.prototype.destroyService = async function (app) {
  return await this.requestWithToken({
    method: 'DELETE',
    url: `app/${app}`,
  });
};

/**
 * 重新启动指定服务
 * @param  {integer} app  [app 编号]
 */
Luffy.prototype.restartService = async function (app) {
  return await this.requestWithToken({
    method: 'POST',
    url: `app/${app}/restart`,
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
    uri: `project/${project}/pods`,
    searchParams: options,
  });
}

module.exports = Luffy;
