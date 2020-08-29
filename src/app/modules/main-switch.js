import { ipcMain } from 'electron';
import { switchEventKeys } from '../constants';

class MainSwitch {

  /**
   * @type {Map}
   * @private
   */
  _funcs = new Map();

  constructor() {
    ipcMain.on(switchEventKeys.REGULAR, this._runFunc.bind(this));
  }

  /**
   * ipcMain callback
   * @param e {object} ipcMain event
   * @param id {string}
   * @param key {string}
   * @param params {any}
   * @returns {Promise<void>}
   * @private
   */
  async _runFunc(e, id,  key, params) {
    try {
      const func = this._funcs.get(key);
      if(!func) throw new Error(`Unknown key: ${key}`);
      const res = await func(params);
      e.sender.send(id, null, res);
    } catch({ message, fileName, lineNumber }) {
      e.sender.send(id, { message, fileName, lineNumber });
    }
  }

  /**
   * Registers a mainSwitch endpoint
   * @param key {string}
   * @param func {function} async function
   */
  register(key, func) {
    this._funcs.set(key, func);
  }

}

export default new MainSwitch();
