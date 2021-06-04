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

    this.rp = got.extend({
      prefixUrl: this.BASE_URI,
      responseType: 'json',
      resolveBodyOnly: true,
      headers: {
        authorization: '',
      },
      hooks: {
        afterResponse: [
          async (response, retryWithMergedOptions) => {
            if (response.statusCode === 401) {
              const updatedOptions = {
                headers: {
                  authorization: 'bearer ' + await this.updateToken(), // Refresh the access token
                },
              };

              this.rp.defaults.options = got.mergeOptions(this.rp.defaults.options, updatedOptions);
              return retryWithMergedOptions(updatedOptions);
            }
            return response;
          },
        ],
      },
      mutableDefaults: true,
    });
  }
}

Luffy.prototype.requestWithToken = async function (options) {
  options = _.cloneDeep(options);
  _.set(options, 'headers.jweToken', this.token);
};

Luffy.prototype.updateToken = async function () {
  const result = await got.post(`${this.BASE_URI}/login`, {
    json: {
      username: this.username,
      password: crypto.createHash('md5').update(this.password, 'utf8').digest('hex'),
    },
    resolveBodyOnly: true,
    responseType: 'json',
  });

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
    json: options,
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
};

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
};

module.exports = Luffy;
