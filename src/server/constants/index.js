// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
/** Main process constants */
import {DEFAULT_LOCALE} from '../../app/constants';

import {app} from 'electron';
import path from 'path';
import fs from 'fs-extra';

export const DATA_DIR = app ? app.getPath('userData') : '';

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

// differentiate in code between the main and renderer processes
export const isRenderer = () => process.type === 'renderer';

export const storageKeys = {
  APP_VERSION: 'APP_VERSION',
  LOCALE: 'LOCALE',
  ZOOM_FACTOR: 'ZOOM_FACTOR',
  SCREEN_SIZE: 'SCREEN_SIZE',
  PASSWORD: 'PASSWORD',
  SALT: 'SALT',
  MNEMONIC: 'MNEMONIC',
  MANIFEST: 'MANIFEST',
  MANIFEST_SHA: 'MANIFEST_SHA',
  XBRIDGE_INFO: 'XBRIDGE_INFO',
  BALANCES: 'BALANCES',
  ALT_CURRENCY_MULTIPLIERS: 'ALT_CURRENCY_MULTIPLIERS',
};

export const coinDataPath = path.resolve(__dirname, '../../../static-data/coin-data.json');
