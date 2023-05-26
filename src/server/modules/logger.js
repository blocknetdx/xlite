// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {DATA_DIR} from '../constants';

import {createLogger, format, transports} from 'winston';
import isDev from 'electron-is-dev';
import path from 'path';

// A Winston logger instance for logging errors and other info
export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.simple(),
  ),
  transports: [
    new transports.File({
      filename: path.join(DATA_DIR, /*isRenderer() ? 'renderer.log' : */'main.log'),
      maxsize: 1000000,
      maxFiles: 5,
      tailable: true
    })
  ]
});

if (isDev) {
  logger.add(new transports.Console());
}
