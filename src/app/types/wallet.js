import fs from 'fs-extra';
import { create, all } from 'mathjs';
import path from 'path';
import { IMAGE_DIR } from '../constants';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});

const { bignumber } = math;

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

  async getBalance() {
    console.log(this.ticker);
    const { rpc } = this;
    if(!this.rpcEnabled) return ['0', '0'];
    let unspent;

    // ToDo properly handle rpc errors here at some point

    try {
      unspent = await rpc.listUnspent();
    } catch(err) {
      // console.error(err);
      unspent = [];
    }
    let total = bignumber(0);
    let spendable = bignumber(0);
    for(let { amount, spendable: isSpendable } of unspent) {
      amount = bignumber(amount);
      if(isSpendable) spendable = math.add(spendable, amount);
      total = math.add(total, amount);
    }
    return [total.toNumber().toFixed(8), spendable.toNumber().toFixed(8)];
  }

}

export default Wallet;
