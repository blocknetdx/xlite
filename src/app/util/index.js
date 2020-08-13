import fs from 'fs-extra';
import isDev from 'electron-is-dev';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { DATA_DIR, DEFAULT_LOCALE } from '../constants';
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
 * Wallets array sorting function
 */
export const walletSorter = balances => (a, b) =>  {
  const { ticker: tickerA, name: nameA } = a;
  const rpcEnabledA = a.rpcEnabled();
  const [ totalA ] = balances.has(tickerA) ? balances.get(tickerA) : ['0'];
  const { ticker: tickerB, name: nameB } = b;
  const rpcEnabledB = b.rpcEnabled();
  const [ totalB ] = balances.has(tickerB) ? balances.get(tickerB) : ['0'];
  if(rpcEnabledA === rpcEnabledB) {
    if(Number(totalA) === Number(totalB)) {
      return Localize.compare(nameA, nameB);
    } else {
      return Number(totalA) > Number(totalB) ? -1 : 1;
    }
  } else {
    return rpcEnabledA ? -1 : 1;
  }
};
