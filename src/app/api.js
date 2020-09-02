const {contextBridge, ipcRenderer} = require('electron');

/**
 * API constants.
 * When updating the api here be sure to update: server/modules/api.js
 */
export const apiConstants = {
  env_CC_WALLET_PASS: 'env_CC_WALLET_PASS',
  env_CC_WALLET_AUTOLOGIN: 'env_CC_WALLET_AUTOLOGIN',
  env_reset_CC_WALLET_PASS: 'env_reset_CC_WALLET_PASS',

  general_isDev: 'general_isDev', // synchronous
  general_getError: 'general_getError',
  general_storeScreenSize: 'general_storeScreenSize',
  general_requestClose: 'general_requestClose',
  general_userLocale: 'general_userLocale',
  general_getLocaleData: 'general_getLocaleData',
  general_getAppVersion: 'general_getAppVersion',
  general_getImageDir: 'general_getImageDir',
  general_openUrl: 'general_openUrl',
  general_qrCode: 'general_qrCode',
  general_setClipboard: 'general_setClipboard',
  general_getClipboard: 'general_getClipboard',

  cloudChains_isInstalled: 'cloudChains_isInstalled',
  cloudChains_hasSettings: 'cloudChains_hasSettings',
  cloudChains_getWalletConf: 'cloudChains_getWalletConf',
  cloudChains_getWalletConfs: 'cloudChains_getWalletConfs',
  cloudChains_getMasterConf: 'cloudChains_getMasterConf',
  cloudChains_isWalletCreated: 'cloudChains_isWalletCreated',
  cloudChains_saveWalletCredentials: 'cloudChains_saveWalletCredentials',
  cloudChains_getStoredPassword: 'cloudChains_getStoredPassword',
  cloudChains_getStoredSalt: 'cloudChains_getStoredSalt',
  cloudChains_getStoredMnemonic: 'cloudChains_getStoredMnemonic',
  cloudChains_loadConfs: 'cloudChains_loadConfs',
  cloudChains_getCCSPVVersion: 'cloudChains_getCCSPVVersion',
  cloudChains_isWalletRPCRunning: 'cloudChains_isWalletRPCRunning',
  cloudChains_spvIsRunning: 'cloudChains_spvIsRunning',
  cloudChains_startSPV: 'cloudChains_startSPV',
  cloudChains_stopSPV: 'cloudChains_stopSPV',
  cloudChains_createSPVWallet: 'cloudChains_createSPVWallet',
  cloudChains_enableAllWallets: 'cloudChains_enableAllWallets',

  confController_getManifest: 'confController_getManifest',
  confController_getManifestHash: 'confController_getManifestHash',
  confController_getXBridgeInfo: 'confController_getXBridgeInfo',

  walletController_getWallets: 'walletController_getWallets',
  walletController_getWallet: 'walletController_getWallet',
  walletController_getEnabledWallets: 'walletController_getEnabledWallets',
  walletController_getBalances: 'walletController_getBalances',
  walletController_getTransactions: 'walletController_getTransactions',
  walletController_getCurrencyMultipliers: 'walletController_getCurrencyMultipliers',
  walletController_getBalanceOverTime: 'walletController_getBalanceOverTime',
  walletController_loadWallets: 'walletController_loadWallets',
  walletController_updatePriceMultipliers: 'walletController_updatePriceMultipliers',
  walletController_updateBalanceInfo: 'walletController_updateBalanceInfo',
  walletController_updateAllBalances: 'walletController_updateAllBalances',

  wallet_rpcEnabled: 'wallet_rpcEnabled',
  wallet_getBalance: 'wallet_getBalance',
  wallet_getTransactions: 'wallet_getTransactions',
  wallet_updateTransactions: 'wallet_updateTransactions',
  wallet_getAddresses: 'wallet_getAddresses',
  wallet_generateNewAddress: 'wallet_generateNewAddress',
  wallet_getCachedUnspent: 'wallet_getCachedUnspent',
  wallet_send: 'wallet_send',
};

/**
 * Renderer API
 * When updating the api here be sure to update: server/modules/api.js
 */

// ENV var api
const env_API = {
  [apiConstants.env_CC_WALLET_PASS]: async () => {
    return await ipcRenderer.invoke(apiConstants.env_CC_WALLET_PASS);
  },
  [apiConstants.env_CC_WALLET_AUTOLOGIN]: async () => {
    return await ipcRenderer.invoke(apiConstants.env_CC_WALLET_AUTOLOGIN);
  },
  [apiConstants.env_reset_CC_WALLET_PASS]: () => {
    ipcRenderer.send(apiConstants.env_reset_CC_WALLET_PASS);
  },
};

// General api
const general_API = {
  [apiConstants.general_getError]: async () => {
    return await ipcRenderer.invoke(apiConstants.general_getError);
  },
  [apiConstants.general_storeScreenSize]: (screenSize) => {
    ipcRenderer.send(apiConstants.general_storeScreenSize, screenSize);
  },
  [apiConstants.general_requestClose]: (reason) => {
    ipcRenderer.send(apiConstants.general_requestClose, reason);
  },
  [apiConstants.general_userLocale]: async () => {
    return await ipcRenderer.invoke(apiConstants.general_userLocale);
  },
  [apiConstants.general_getLocaleData]: async (locale) => {
    return await ipcRenderer.invoke(apiConstants.general_getLocaleData, locale);
  },
  [apiConstants.general_getAppVersion]: async () => {
    return await ipcRenderer.invoke(apiConstants.general_getAppVersion);
  },
  [apiConstants.general_getImageDir]: async (image) => {
    return await ipcRenderer.invoke(apiConstants.general_getImageDir, image);
  },
  [apiConstants.general_openUrl]: async (data) => {
    return await ipcRenderer.invoke(apiConstants.general_openUrl, data);
  },
  [apiConstants.general_qrCode]: async (data) => {
    return await ipcRenderer.invoke(apiConstants.general_qrCode, data);
  },
  [apiConstants.general_setClipboard]: async (text) => {
    return await ipcRenderer.invoke(apiConstants.general_setClipboard, text);
  },
  [apiConstants.general_getClipboard]: async () => {
    return await ipcRenderer.invoke(apiConstants.general_getClipboard);
  },
};

// CloudChains api
const cloudChains_API = {
  [apiConstants.cloudChains_isInstalled]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_isInstalled);
  },
  [apiConstants.cloudChains_hasSettings]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_hasSettings);
  },
  [apiConstants.cloudChains_getWalletConf]: async (token) => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getWalletConf, token);
  },
  [apiConstants.cloudChains_getWalletConfs]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getWalletConfs);
  },
  [apiConstants.cloudChains_getMasterConf]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getMasterConf);
  },
  [apiConstants.cloudChains_isWalletCreated]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_isWalletCreated);
  },
  [apiConstants.cloudChains_saveWalletCredentials]: async (hashedPassword, salt, encryptedMnemonic) => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_saveWalletCredentials, hashedPassword, salt, encryptedMnemonic);
  },
  [apiConstants.cloudChains_getStoredPassword]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getStoredPassword);
  },
  [apiConstants.cloudChains_getStoredSalt]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getStoredSalt);
  },
  [apiConstants.cloudChains_getStoredMnemonic]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getStoredMnemonic);
  },
  [apiConstants.cloudChains_loadConfs]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_loadConfs);
  },
  [apiConstants.cloudChains_getCCSPVVersion]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_getCCSPVVersion);
  },
  [apiConstants.cloudChains_isWalletRPCRunning]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_isWalletRPCRunning);
  },
  [apiConstants.cloudChains_spvIsRunning]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_spvIsRunning);
  },
  [apiConstants.cloudChains_startSPV]: async (password) => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_startSPV, password);
  },
  [apiConstants.cloudChains_stopSPV]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_stopSPV);
  },
  [apiConstants.cloudChains_createSPVWallet]: async (password) => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_createSPVWallet, password);
  },
  [apiConstants.cloudChains_enableAllWallets]: async () => {
    return await ipcRenderer.invoke(apiConstants.cloudChains_enableAllWallets);
  },
};

// ConfController api
const confController_API = {
  [apiConstants.confController_getManifest]: async () => {
    return await ipcRenderer.invoke(apiConstants.confController_getManifest);
  },
  [apiConstants.confController_getManifestHash]: async () => {
    return await ipcRenderer.invoke(apiConstants.confController_getManifestHash);
  },
  [apiConstants.confController_getXBridgeInfo]: async () => {
    return await ipcRenderer.invoke(apiConstants.confController_getXBridgeInfo);
  },
};

// WalletController api
const walletController_API = {
  [apiConstants.walletController_getWallets]: async () => {
    return await ipcRenderer.invoke(apiConstants.walletController_getWallets);
  },
  [apiConstants.walletController_getWallet]: async (ticker) => {
    return await ipcRenderer.invoke(apiConstants.walletController_getWallet, ticker);
  },
  [apiConstants.walletController_getEnabledWallets]: async () => {
    return await ipcRenderer.invoke(apiConstants.walletController_getEnabledWallets);
  },
  [apiConstants.walletController_getBalances]: async () => {
    return await ipcRenderer.invoke(apiConstants.walletController_getBalances);
  },
  [apiConstants.walletController_getTransactions]: async (start, end) => {
    return await ipcRenderer.invoke(apiConstants.walletController_getTransactions, start, end);
  },
  [apiConstants.walletController_getCurrencyMultipliers]: async () => {
    return await ipcRenderer.invoke(apiConstants.walletController_getCurrencyMultipliers);
  },
  [apiConstants.walletController_getBalanceOverTime]: async (timeframe, currency, currencyMultipliers) => {
    return await ipcRenderer.invoke(apiConstants.walletController_getBalanceOverTime, timeframe, currency, currencyMultipliers);
  },
  [apiConstants.walletController_loadWallets]: async () => {
    return await ipcRenderer.invoke(apiConstants.walletController_loadWallets);
  },
  [apiConstants.walletController_updatePriceMultipliers]: async () => {
    ipcRenderer.send(apiConstants.walletController_updatePriceMultipliers);
  },
  [apiConstants.walletController_updateBalanceInfo]: async (ticker) => {
    return await ipcRenderer.invoke(apiConstants.walletController_updateBalanceInfo, ticker);
  },
  [apiConstants.walletController_updateAllBalances]: async () => {
    ipcRenderer.send(apiConstants.walletController_updateAllBalances);
  },
};

// Wallet api
const wallet_API = {
  [apiConstants.wallet_rpcEnabled]: async (ticker) => {
    return await ipcRenderer.invoke(apiConstants.wallet_rpcEnabled, ticker);
  },
  [apiConstants.wallet_getBalance]: async (ticker) => {
    return await ipcRenderer.invoke(apiConstants.wallet_getBalance, ticker);
  },
  [apiConstants.wallet_getTransactions]: async (ticker, startTime, endTime) => {
    return await ipcRenderer.invoke(apiConstants.wallet_getTransactions, ticker, startTime, endTime);
  },
  [apiConstants.wallet_updateTransactions]: async (ticker) => {
    ipcRenderer.send(apiConstants.wallet_updateTransactions, ticker);
  },
  [apiConstants.wallet_getAddresses]: async (ticker) => {
    return await ipcRenderer.invoke(apiConstants.wallet_getAddresses, ticker);
  },
  [apiConstants.wallet_generateNewAddress]: async (ticker) => {
    return await ipcRenderer.invoke(apiConstants.wallet_generateNewAddress, ticker);
  },
  [apiConstants.wallet_getCachedUnspent]: async (ticker, cacheExpirySeconds) => {
    return await ipcRenderer.invoke(apiConstants.wallet_getCachedUnspent, ticker, cacheExpirySeconds);
  },
  [apiConstants.wallet_send]: async (ticker, recipients) => {
    return await ipcRenderer.invoke(apiConstants.wallet_send, ticker, recipients);
  },
};

let init = false;
if (contextBridge && !init) {
  init = true;
  // Set isDev state
  const isDev = ipcRenderer.sendSync(apiConstants.general_isDev);
  contextBridge.exposeInMainWorld('api', {
    isDev,
    ...env_API,
    ...general_API,
    ...cloudChains_API,
    ...confController_API,
    ...walletController_API,
    ...wallet_API,
  });
}
