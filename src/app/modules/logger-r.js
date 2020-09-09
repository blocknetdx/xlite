/** Renderer logger */

const ferr = (msg, e) => {
  window.api.isDev && console.error('[' + new Date().toLocaleTimeString() + '] ' + msg, e);
};
const finfo = (msg, e) => {
  window.api.isDev && console.log('[' + new Date().toLocaleTimeString() + '] ' + msg, e);
};

export const logger = {
  error: ferr,
  warn: ferr,
  info: finfo,
};
