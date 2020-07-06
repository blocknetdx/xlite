import electron from 'electron';

const app = electron.app ? electron.app : electron.remote ? electron.remote.app : null;

export const activeViews = {
  LOGIN: 'LOGIN',
  DASHBOARD: 'DASHBOARD'
};

export const actions = {
  SET_WINDOW_SIZE: 'SET_WINDOW_SIZE',
  SET_MANIFEST: 'SET_MANIFEST',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW'
};

export const localStorageKeys = {
  MANIFEST: 'MANIFEST',
  MANIFEST_SHA: 'MANIFEST_SHA',
  MANIFEST_DATA: 'MANIFEST_DATA',
  WALLET_CONFS: 'WALLET_CONFS',
  XBRIDGE_CONFS: 'XBRIDGE_CONFS'
};

export const storageKeys = {
  LOCALE: 'LOCALE',
  ZOOM_FACTOR: 'ZOOM_FACTOR'
};

export const ipcMainListeners = {
  GET_USER_LOCALE: 'GET_USER_LOCALE',
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ZOOM_RESET: 'ZOOM_RESET',
  GET_ZOOM_FACTOR: 'GET_ZOOM_FACTOR',
  SET_ZOOM_FACTOR: 'SET_ZOOM_FACTOR'
};

export const ipcRendererListeners = {
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ZOOM_RESET: 'ZOOM_RESET'
};

export const DEFAULT_LOCALE = 'en';
export const DEFAULT_ZOOM_FACTOR = 1;

export const ZOOM_MAX = 1.5;
export const ZOOM_MIN = .6;
export const ZOOM_INCREMENT = .1;

export const DATA_DIR = app ? app.getPath('userData') : '';

export const HTTP_REQUEST_TIMEOUT = 10000;
