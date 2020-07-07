import fs from 'fs-extra';
import path from 'path';
import request from 'superagent';
import { HTTP_REQUEST_TIMEOUT, ICON_DIR } from '../constants';

/**
 * Class representing a wallet
 */
class Wallet {

  /**
   * Coin name
   * @type {string}
   */
  name = '';

  /**
   * Coin ticker
   * @type {string}
   */
  ticker = '';

  rpcEnabled = false;

  /**
   * RPCController Instance for enabled wallets
   * @type {RPCController}
   */
  rpc = null;

  /**
   * Coin logo image path
   * @type {string}
   */
  imagePath = '';

  /**
   * Constructs a wallet
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * @param data {Object}
   * @returns {Wallet}
   */
  set(data) {
    return new Wallet({...this, ...data});
  }

  /**
   * Downloads coin logo image
   * @returns {Promise<void>}
   */
  async downloadImage() {
    try {
      const ticker = this.ticker.toLowerCase();
      await fs.ensureDir(ICON_DIR);
      const localPath = path.join(ICON_DIR, `${ticker}.png`);
      console.log(localPath);
      const exists = await fs.exists(localPath);
      if(exists) {
        this.imagePath = localPath;
        return;
      }
      const destination = `https://cryptoicons.org/api/icon/${ticker}/200`;
      const { body } = await request
        .get(destination)
        .timeout(1000)
        .responseType('blob');
      await fs.writeFile(localPath, body);
      this.imagePath = localPath;
    } catch(err) {
      this.imagePath = path.resolve(__dirname, '../../images/blank_icon.png');
    }
  }

}

export default Wallet;
