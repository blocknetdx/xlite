// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
/** Shared constants (between main and renderer) */

export const activeViews = {
  LOGIN_REGISTER: 'LOGIN_REGISTER',
  DASHBOARD: 'DASHBOARD',
  PORTFOLIO: 'PORTFOLIO',
  TRANSACTIONS: 'TRANSACTIONS',
  COIN_TRANSACTIONS: 'COIN_TRANSACTIONS',
  LOADING: 'LOADING',
};

export const actions = {
  SET_WINDOW_SIZE: 'SET_WINDOW_SIZE',
  SET_MANIFEST: 'SET_MANIFEST',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_WALLETS: 'SET_WALLETS',
  SET_ACTIVE_WALLET: 'SET_ACTIVE_WALLET',
  SET_BALANCES: 'SET_BALANCES',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  SET_SHOW_RECEIVE_MODAL: 'SET_SHOW_RECEIVE_MODAL',
  SET_SHOW_SEND_MODAL: 'SET_SHOW_SEND_MODAL',
  SET_CURRENCY_MULTIPLIERS: 'SET_CURRENCY_MULTIPLIERS',
  SET_CLOUDCHAINS: 'SET_CLOUDCHAINS',
  SET_STARTUP_INIT: 'SET_STARTUP_INIT',
  SET_WALLET_CONTROLLER: 'SET_WALLET_CONTROLLER',
  SET_SHOW_SETTINGS: 'SET_SHOW_SETTINGS',
  SET_SHOW_PREFERENCES_MODAL: 'SET_SHOW_PREFERENCES_MODAL',
  SET_SHOW_SECURITY_MODAL: 'SET_SHOW_SECURITY_MODAL',
  SET_SHOW_BACKUP_MODAL: 'SET_SHOW_BACKUP_MODAL',
  SET_SHOW_ABOUT_MODAL: 'SET_SHOW_ABOUT_MODAL',
  SET_SHOW_GUIDES_MODAL: 'SET_SHOW_GUIDES_MODAL',
  SET_XVAULT_VERSION: 'SET_XVAULT_VERSION',
  SET_CC_VERSION: 'SET_CC_VERSION',
  SET_ALT_CURRENCY: 'SET_ALT_CURRENCY',
  SET_PRICING: 'SET_PRICING',
  SET_PRICING_CONTROLLER: 'SET_PRICING_CONTROLLER',
  SET_SHOW_WINDOWS_LIBRARY_DOWNLOAD_MODAL: 'SET_SHOW_WINDOWS_LIBRARY_DOWNLOAD_MODAL',
  SET_LOADING_TRANSACTIONS: 'SET_LOADING_TRANSACTIONS',
};

export const localStorageKeys = {
  ACTIVE_WALLET: 'ACTIVE_WALLET',
  ACTIVE_CHART_FILTER: 'ACTIVE_CHART_FILTER',
  TRANSACTIONS: 'TRANSACTIONS',
  TX_LAST_FETCH_TIME: 'TX_LAST_FETCH_TIME',
  PRICING_DATA: 'PRICING_DATA',
  PRICING_FETCH_TIME: 'PRICING_FETCH_TIME',
};

export const ipcMainListeners = {
  GET_USER_LOCALE: 'GET_USER_LOCALE',
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ZOOM_RESET: 'ZOOM_RESET',
  GET_ZOOM_FACTOR: 'GET_ZOOM_FACTOR',
  SET_ZOOM_FACTOR: 'SET_ZOOM_FACTOR',
  CLOSE: 'CLOSE',
  SCREEN_SIZE: 'SCREEN_SIZE',
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

export const HTTP_REQUEST_TIMEOUT = 15000;

export const altCurrencies = {
  USD: 'USD',
  BTC: 'BTC',
  EUR: 'EUR',
  GBP: 'GBP',
};

/**
 * Must match the altCurrencies obj format. Returns the
 * currency with right-most space if no symbol was found.
 * e.g. [BTC] -> [BTC ]
 * @param currency {string} USD, BTC, EUR, GBP
 * @return {string} Currency symbol
 */
export const altCurrencySymbol = (currency) => {
  const sym = {
    USD: '$',
    BTC: 'BTC ',
    EUR: '€',
    GBP: '£',
  }[currency];
  if (!sym)
    return currency + ' ';
  else
    return sym;
};

export const MAX_DECIMAL_PLACE = 8;
export const MAX_DECIMAL_CURRENCY = 2;

export const DUST_SATOSHIS = 5460;

export const platforms = {
  win: 'win32',
  mac: 'darwin',
  linux: 'linux'
};

export const ccBinDirs = {
  win32: 'win',
  darwin: 'mac',
  linux: 'linux'
};

export const ccBinNames = {
  win32: 'xlite-daemon-win64.exe',
  darwin: 'xlite-daemon-osx64',
  linux: 'xlite-daemon-linux64'
};

export const DEFAULT_MASTER_PORT = 9955;

export const UNKNOWN_CC_VERSION = 'unknown';

export const SIDEBAR_WIDTH = 240;

export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;
export const MIN_UI_WIDTH = 1024;
export const MIN_UI_HEIGHT = 600;

export const balanceFilters = {
  day: '24H',
  week: '1W',
  month: '1M',
  'half-year': '6M',
  year: '1Y'
};

export const transactionFilters = {
  all: 'All',
  sent: 'Sent',
  received: 'Received',
  unspent: 'Unspent',
  // ToDo: enable transfer type when available
  //transfers: 'Transfers'
};

export const ESC_KEY_CODE = 27;
