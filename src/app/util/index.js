import fs from 'fs-extra';
import isDev from 'electron-is-dev';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { DATA_DIR, DEFAULT_LOCALE } from '../constants';

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

// differential in code betwee the main and renderer processes
export const isRenderer = () => process.type === 'renderer';

export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(DATA_DIR, isRenderer() ? 'renderer.log' : 'main.log') })
  ]
});

export const handleError = err => {
  if(isDev) console.error(err);
  logger.error('', err);
};
