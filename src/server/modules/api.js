import {apiConstants} from '../../app/api';
import {getLocaleData, IMAGE_DIR, storageKeys} from '../constants';
import {logger} from './logger';
import Recipient from '../../app/types/recipient';
import WalletController from './wallet-controller';

import _ from 'lodash';
import electron from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import QRCode from 'qrcode';

/**
 * Manages the api link to the renderer process.
 * When updating the api here be sure to update:
 * app/api.js
 */
class Api {
  /**
   * @type {SimpleStorage}
   * @private
   */
  _storage = null;

  /**
   * @type {Electron.App}
   * @private
   */
  _app = null;

  /**
   * @type {Electron.IpcMain}
   * @private
   */
  _proc = null;

  /**
   * Error object from main proc.
   * @type {Object} {title, msg}
   * @private
   */
  _err = null;

  /**
   * @type {CloudChains}
   * @private
   */
  _cloudChains = null;

  /**
   * @type {ConfController}
   * @private
   */
  _confController = null;

  /**
   * @type {WalletController}
   * @private
   */
  _walletController = null;

  /**
   * Constructor
   * @param storage {SimpleStorage}
   * @param app {Electron.App}
   * @param proc {Electron.IpcMain}
   * @param err {Object} Must be null if not an error
   * @param cloudChains {CloudChains}
   * @param confController {ConfController}
   * @param walletController {WalletController}
   */
  constructor(storage, app, proc, err, cloudChains = null, confController = null, walletController = null) {
    this._storage = storage;
    this._app = app;
    this._proc = proc;
    this._err = err;
    this._cloudChains = cloudChains;
    this._confController = confController;
    this._walletController = walletController;
    this._init();
  }

  /**
   * Create api handlers.
   * @private
   */
  _init() {
    this._initEnv();
    this._initGeneral();
    if (this._err)
      return; // do not expose rest of api on error

    this._initCloudChains();
    this._initConfController();
    this._initWalletController();
    this._initWallet();
  }

  /**
   * ENV var api handlers.
   * @private
   */
  _initEnv() {
    this._proc.handle(apiConstants.env_CC_WALLET_PASS, (evt, arg) => {
      return process.env.CC_WALLET_PASS;
    });
    this._proc.handle(apiConstants.env_CC_WALLET_AUTOLOGIN, (evt, arg) => {
      return process.env.CC_WALLET_AUTOLOGIN;
    });
    this._proc.on(apiConstants.env_reset_CC_WALLET_PASS, (evt, arg) => {
      process.env.CC_WALLET_AUTOLOGIN = '';
    });
  }

  /**
   * General api handlers.
   * @private
   */
  _initGeneral() {
    this._proc.handle(apiConstants.general_getError, (evt, arg) => {
      return this._err;
    });
    this._proc.on(apiConstants.general_storeScreenSize, (evt, screenSize) => {
      if (_.has(screenSize, 'width') && _.has(screenSize, 'height'))
        this._storage.setItem(storageKeys.SCREEN_SIZE, screenSize);
    });
    this._proc.on(apiConstants.general_requestClose, (evt, reason) => {
      logger.error(reason);
      this._app.quit();
    });
    this._proc.handle(apiConstants.general_userLocale, (evt, arg) => {
      return this._storage.getItem(storageKeys.LOCALE);
    });
    this._proc.handle(apiConstants.general_getLocaleData, (evt, locale) => {
      return getLocaleData(locale);
    });
    this._proc.handle(apiConstants.general_getAppVersion, (evt, arg) => {
      return this._storage.getItem(storageKeys.APP_VERSION);
    });
    this._proc.handle(apiConstants.general_getImageDir, (evt, image) => {
      return path.join(IMAGE_DIR, image);
    });
    this._proc.handle(apiConstants.general_openUrl, (evt, url) => {
      return electron.shell.openExternal(url); // TODO Review Security
    });
    this._proc.handle(apiConstants.general_qrCode, (evt, data) => {
      return new Promise((resolve, reject) => {
        QRCode.toDataURL(data, (err, url) => {
          if (err)
            reject(err);
          else
            resolve(url);
        });
      });
    });
    this._proc.handle(apiConstants.general_setClipboard, (evt, text) => {
      return electron.clipboard.writeText(text.trim());
    });
    this._proc.handle(apiConstants.general_getClipboard, (evt, arg) => {
      return electron.clipboard.readText('selection');
    });
    this._proc.on(apiConstants.general_isDev, (evt, arg) => evt.returnValue = isDev);
  }

  /**
   * CloudChains api handlers.
   * @private
   */
  _initCloudChains() {
    this._proc.handle(apiConstants.cloudChains_isInstalled, (evt, arg) => {
      return this._cloudChains.isInstalled();
    });
    this._proc.handle(apiConstants.cloudChains_hasSettings, (evt, arg) => {
      return this._cloudChains.hasSettings();
    });
    this._proc.handle(apiConstants.cloudChains_getWalletConf, (evt, ticker) => {
      return this._cloudChains.getWalletConf(ticker);
    });
    this._proc.handle(apiConstants.cloudChains_getWalletConfs, (evt, arg) => {
      return this._cloudChains.getWalletConfs();
    });
    this._proc.handle(apiConstants.cloudChains_getMasterConf, (evt, arg) => {
      return this._cloudChains.getMasterConf();
    });
    this._proc.handle(apiConstants.cloudChains_isWalletCreated, (evt, arg) => {
      return this._cloudChains.isWalletCreated();
    });
    this._proc.handle(apiConstants.cloudChains_saveWalletCredentials, (evt, hashedPassword, salt, encryptedMnemonic) => {
      return this._cloudChains.saveWalletCredentials(hashedPassword, salt, encryptedMnemonic);
    });
    this._proc.handle(apiConstants.cloudChains_getStoredPassword, (evt, arg) => {
      return this._cloudChains.getStoredPassword();
    });
    this._proc.handle(apiConstants.cloudChains_getStoredSalt, (evt, arg) => {
      return this._cloudChains.getStoredSalt();
    });
    this._proc.handle(apiConstants.cloudChains_getStoredMnemonic, (evt, arg) => {
      return this._cloudChains.getStoredMnemonic();
    });
    this._proc.handle(apiConstants.cloudChains_loadConfs, (evt, arg) => {
      return this._cloudChains.loadConfs();
    });
    this._proc.handle(apiConstants.cloudChains_getCCSPVVersion, (evt, arg) => {
      return this._cloudChains.getCCSPVVersion();
    });
    this._proc.handle(apiConstants.cloudChains_isWalletRPCRunning, (evt, arg) => {
      return this._cloudChains.isWalletRPCRunning();
    });
    this._proc.handle(apiConstants.cloudChains_spvIsRunning, (evt, arg) => {
      return this._cloudChains.spvIsRunning();
    });
    this._proc.handle(apiConstants.cloudChains_startSPV, (evt, password) => {
      return this._cloudChains.startSPV(password);
    });
    this._proc.handle(apiConstants.cloudChains_stopSPV, (evt, arg) => {
      return this._cloudChains.stopSPV();
    });
    this._proc.handle(apiConstants.cloudChains_createSPVWallet, (evt, password) => {
      return this._cloudChains.createSPVWallet(password);
    });
    this._proc.handle(apiConstants.cloudChains_enableAllWallets, (evt, arg) => {
      return this._cloudChains.enableAllWallets();
    });
  }

  /**
   * ConfController api handlers.
   * @private
   */
  _initConfController() {
    this._proc.handle(apiConstants.confController_getManifest, (evt, arg) => {
      return this._confController.getManifest();
    });
    this._proc.handle(apiConstants.confController_getManifestHash, (evt, arg) => {
      return this._confController.getManifestHash();
    });
    this._proc.handle(apiConstants.confController_getXBridgeInfo, (evt, arg) => {
      return this._confController.getXBridgeInfo();
    });
  }

  /**
   * WalletController api handlers.
   * @private
   */
  _initWalletController() {
    this._proc.handle(apiConstants.walletController_getWallets, (evt, arg) => {
      return this._walletController.getWallets();
    });
    this._proc.handle(apiConstants.walletController_getWallet, (evt, ticker) => {
      return this._walletController.getWallet(ticker);
    });
    this._proc.handle(apiConstants.walletController_getEnabledWallets, (evt, arg) => {
      return this._walletController.getEnabledWallets();
    });
    this._proc.handle(apiConstants.walletController_getBalances, (evt, arg) => {
      return this._walletController.getBalances();
    });
    this._proc.handle(apiConstants.walletController_getTransactions, (evt, startTime, endTime) => {
      return this._walletController.getTransactions(startTime, endTime);
    });
    this._proc.handle(apiConstants.walletController_getCurrencyMultipliers, (evt, arg) => {
      return this._walletController.getCurrencyMultipliers();
    });
    this._proc.handle(apiConstants.walletController_getBalanceOverTime, (evt, timeframe, currency, currencyMultipliers) => {
      return this._walletController.getBalanceOverTime(timeframe, currency, currencyMultipliers);
    });
    this._proc.handle(apiConstants.walletController_loadWallets, (evt, arg) => {
      return this._walletController.loadWallets();
    });
    this._proc.handle(apiConstants.walletController_updatePriceMultipliers, (evt, arg) => {
      return this._walletController.updatePriceMultipliers(WalletController.defaultRequest);
    });
    this._proc.handle(apiConstants.walletController_updateBalanceInfo, (evt, ticker) => {
      return this._walletController.updateBalanceInfo(ticker);
    });
    this._proc.handle(apiConstants.walletController_updateAllBalances, (evt, arg) => {
      return this._walletController.updateAllBalances();
    });
  }

  /**
   * Wallet api handlers.
   * @private
   */
  _initWallet() {
    this._proc.handle(apiConstants.wallet_rpcEnabled, (evt, ticker) => {
      return this._walletController.getWallet(ticker).rpcEnabled();
    });
    this._proc.handle(apiConstants.wallet_getBalance, (evt, ticker) => {
      return this._walletController.getWallet(ticker).getBalance();
    });
    this._proc.handle(apiConstants.wallet_getTransactions, (evt, ticker, startTime, endTime) => {
      return this._walletController.getWallet(ticker).getTransactions(startTime, endTime);
    });
    this._proc.on(apiConstants.wallet_updateTransactions, (evt, ticker) => {
      this._walletController.getWallet(ticker).updateTransactions();
    });
    this._proc.handle(apiConstants.wallet_getAddresses, (evt, ticker) => {
      return this._walletController.getWallet(ticker).getAddresses();
    });
    this._proc.handle(apiConstants.wallet_generateNewAddress, (evt, ticker) => {
      return this._walletController.getWallet(ticker).generateNewAddress();
    });
    this._proc.handle(apiConstants.wallet_getCachedUnspent, (evt, ticker, cacheExpirySeconds) => {
      return this._walletController.getWallet(ticker).getCachedUnspent(cacheExpirySeconds);
    });
    this._proc.handle(apiConstants.wallet_send, (evt, ticker, recipients) => {
      recipients = recipients.map(r => new Recipient(r));
      return this._walletController.getWallet(ticker).send(recipients);
    });
  }
}

export default Api;
