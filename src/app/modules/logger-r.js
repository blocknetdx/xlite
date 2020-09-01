/** Renderer logger */
const {api} = window;
const {isDev} = api;

const ferr = (msg, e) => {
  isDev && console.error('[' + new Date().toLocaleTimeString() + '] ' + msg, e);
};
const finfo = (msg, e) => {
  isDev && console.log('[' + new Date().toLocaleTimeString() + '] ' + msg, e);
};

export const logger = {
  error: ferr,
  warn: ferr,
  info: finfo,
};
