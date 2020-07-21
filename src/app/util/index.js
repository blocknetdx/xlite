import electron from 'electron';
import fs from 'fs-extra';
import isDev from 'electron-is-dev';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { DATA_DIR, DEFAULT_LOCALE } from '../constants';
import { Map } from 'immutable';
import Localize from '../components/shared/localize';


export const getLocaleData = locale => {
  const localesPath = path.resolve(__dirname, '../../../locales');
  const files = fs.readdirSync(localesPath);
  const localeFileName = `${locale}.json`;
  let data;
  if(files.includes(localeFileName)) {
    data = fs.readJsonSync(path.join(localesPath, localeFileName));
  } else {
    data = fs.readJsonSync(path.join(localesPath, `${DEFAULT_LOCALE}.json`));
  }
  return data;
};

// differentiate in code betwee the main and renderer processes
export const isRenderer = () => process.type === 'renderer';

// Some modules have DOM dependencies and can therefore only be run in the renderer process
export const requireRenderer = () => {
  if(!isRenderer()) throw new Error('This module can only be run from the renderer process.');
};

// A Winston logger instance for logging errors and other info
export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({
      filename: path.join(DATA_DIR, isRenderer() ? 'renderer.log' : 'main.log'),
      maxsize: 1000000,
      maxFiles: 5,
      tailable: true
    })
  ]
});
if(isDev) {
  logger.add(new transports.Console());
}

export const handleError = err => {
  if(isDev) console.error(err);
  logger.error('', err);
};

/**
 * @returns {string}
 */
export const getCloudChainsDir = () => {
  const app = isRenderer() ? electron.remote.app : electron.app;
  switch(process.platform) {
    case 'win32':
      return path.join(app.getPath('appData'), 'CloudChains');
    case 'linux':
      return path.join(app.getPath('home'), 'CloudChains');
    default:
      return path.join(app.getPath('appData'), 'CloudChains');
  }
};

/**
 * @param manifest {Object[]}
 * @returns {Map}
 */
export const convertManifestToMap = manifest => manifest.reduce((map, obj) => map.set(obj.ticker, obj), Map());

/**
 * Wallets array sorting function
 */
export const walletSorter = balances => (a, b) =>  {
  const { ticker: tickerA, name: nameA, rpcEnabled: rpcEnabledA } = a;
  const [ totalA ] = balances.get(tickerA);
  const { ticker: tickerB, name: nameB, rpcEnabled: rpcEnabledB } = b;
  const [ totalB ] = balances.get(tickerB);
  if(rpcEnabledA === rpcEnabledB) {
    if(totalA === totalB) {
      return Localize.compare(nameA, nameB);
    } else {
      return totalA > totalB ? -1 : 1;
    }
  } else {
    return rpcEnabledA ? -1 : 1;
  }
};
