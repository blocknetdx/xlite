import { ipcRenderer } from 'electron';
import * as uuid from 'uuid';
import { switchEventKeys } from '../constants';

class RenderSwitch {

  /**
   * @param key {string}
   * @param params {any}
   * @returns {Promise<any>}
   */
  async send(key, params) {
    const id = uuid.v4();
    const data = await new Promise((resolve, reject) => {
      ipcRenderer.once(id, (e, err, res) => {
        if(err) {
          const { message, fileName, lineNumber } = err;
          reject(new Error(message, fileName, lineNumber));
        } else {
          resolve(res);
        }
      });
      ipcRenderer.send(switchEventKeys.REGULAR, id, key, params);
    });
    return data;
  }

}

export default new RenderSwitch();
