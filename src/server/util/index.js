import path from 'path';
import { logger } from '../modules/logger';

module.exports.prepPath = (filepath = '') => {
  try {
    const splitPath = filepath.split(path.sep);
    if(splitPath.length === 0) return filepath;
    return [
      splitPath[0],
      ...splitPath.slice(1).map(str => encodeURI(str))
    ].join(path.sep);
  } catch(err) {
    logger.error(err.message + '\n' + err.stack);
    return filepath;
  }
};
