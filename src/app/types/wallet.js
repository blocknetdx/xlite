import fs from 'fs-extra';
import path from 'path';
import { IMAGE_DIR } from '../constants';

/**
 * Class representing a wallet
 */
class Wallet {

  /**
   * Takes a ticker and returns the coin's image set or a default blank image
   * @param ticker {string}
   * @returns {string}
   */
  static getImage(ticker) {
    const coinImageDir = path.join(IMAGE_DIR, 'coins');
    const tickerLower = ticker.toLowerCase();
    const imagePath1x = path.join(coinImageDir, `icon-${tickerLower}.png`);
    const imagePath2x = path.join(coinImageDir, `icon-${tickerLower}@2x.png`);
    const image1xExists = fs.existsSync(imagePath1x);
    const image2xExists = fs.existsSync(imagePath2x);
    if(image1xExists && image2xExists) {
      return `${imagePath1x}, ${imagePath2x} 2x`;
    } else if(image1xExists) {
      return imagePath1x;
    } else {
      return path.join(IMAGE_DIR, 'blank_icon.png');
    }
  }

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
    this.imagePath = Wallet.getImage(data.ticker);
  }

  /**
   * @param data {Object}
   * @returns {Wallet}
   */
  set(data) {
    return new Wallet({...this, ...data});
  }

}

export default Wallet;
