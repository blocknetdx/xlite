import request from 'superagent';
import { HTTP_REQUEST_TIMEOUT } from '../constants';

export default class RPCController {

  /**
   * @type {number}
   * @private
   */
  _port = 0;

  /**
   * @type {string}
   * @private
   */
  _username = '';

  /**
   * @type {string}
   * @private
   */
  _password = '';

  /**
   * @param port {number}
   * @param username {string}
   * @param password {string}
   */
  constructor(port, username, password) {
    this._port = port;
    this._username = username;
    this._password = password;
  }

  /**
   * Makes an RPC server request
   * @param method {string}
   * @param params {Object}
   * @returns {any}
   * @private
   */
  async _makeRequest(method, params = []) {
    return new Promise((resolve, reject) => {
      request
        .post(`http://127.0.0.1:${this._port}`)
        .auth(this._username, this._password)
        .send(JSON.stringify({
          method,
          params
        }))
        .timeout(HTTP_REQUEST_TIMEOUT)
        .then(res => {
          const { statusCode } = res;
          if(statusCode === 200) {
            const { result, error } = res.body;
            if(error) {
              const { code, message } = error;
              reject(`RPC server ${method} request returned with error code ${code} and message "${message}"`);
            } else {
              resolve(result);
            }
          } else {
            reject(`RPC server ${method} request failed with HTTP status code ${statusCode}.`);
          }
        })
        .catch(err => {
          if(err.timeout) {
            reject(new Error(`RPC server ${method} request timed out.`));
          } else {
            reject(err);
          }
        });
    });
  }

  async getInfo() {
    const res = await this._makeRequest('getinfo');
    return res;
  }

  // ToDo Add the rest of the available RPC calls

}
