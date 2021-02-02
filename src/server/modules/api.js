// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {apiConstants} from '../../app/api';
import {getLocaleData, storageKeys} from '../constants';
import {logger} from './logger';
import {publicPath} from '../util/public-path';
import Recipient from '../../app/types/recipient';
import {sanitize, Blacklist, Whitelist} from '../../app/modules/api-r';
import WalletController from './wallet-controller';

import _ from 'lodash';
import electron from 'electron';
import isDev from 'electron-is-dev';
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
   * @type {ZoomController}
   * @private
   */
  _zoomController = null;

  /**
   * @type {Pricing}
   * @private
   */
  _pricing = null;

  /**
   * @type {Object}
   * @private
   */
  _shutdown = null;

  /**
   * @type {ContextMenu}
   * @private
   */
  _contextMenu = null;

  /**
   * @type {AppUpdater}
   * @private
   */
  _autoUpdater = null;

  /**
   * If true this will allow electron to open external links.
   * @type {boolean}
   * @private
   */
  _allowOpenExternalLinks = false;

  /**
   * Constructor
   * @param storage {SimpleStorage}
   * @param app {Electron.App}
   * @param proc {Electron.IpcMain}
   * @param err {Object} Must be null if not an error
   * @param cloudChains {CloudChains}
   * @param confController {ConfController}
   * @param walletController {WalletController}
   * @param zoomController {ZoomController}
   * @param pricing {Pricing}
   * @param shutdown {Object}
   */
  constructor(storage, app, proc, err,
              cloudChains = null, confController = null,
              walletController = null, zoomController = null,
              pricing = null, shutdown = null, contextMenu, autoUpdater) {
    this._storage = storage;
    this._app = app;
    this._proc = proc;
    this._err = err;
    this._cloudChains = cloudChains;
    this._confController = confController;
    this._walletController = walletController;
    this._zoomController = zoomController;
    this._pricing = pricing;
    this._shutdown = shutdown;
    this._contextMenu = contextMenu;
    this._autoUpdater = autoUpdater;
    this._init();
  }

  /**
   * Enable open external links functionality.
   */
  enableOpenExternalLinks() {
    this._allowOpenExternalLinks = true;
  }

  /**
   * Disable open external links functionality.
   */
  disableOpenExternalLinks() {
    this._allowOpenExternalLinks = false;
  }

  /**
   * Create api handlers.
   * @private
   */
  _init() {
    this._initEnv();
    this._initGeneral();
    this._initContextMenu();
    if (this._err)
      return; // do not expose rest of api on error

    if (this._cloudChains)
      this._initCloudChains();
    if (this._confController)
      this._initConfController();
    if (this._walletController) {
      this._initWalletController();
      this._initWallet();
    }
    if (this._pricing)
      this._initPricing();
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
    this._proc.on(apiConstants.general_requestClose, async (evt, reason) => {
      logger.error(reason);
      await this._shutdown.shutdown();
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
    this._proc.on(apiConstants.general_getStaticDir, (evt) => {
      evt.returnValue = publicPath;
    });
    this._proc.on(apiConstants.general_openUrl, (evt, url) => {
      if (this._allowOpenExternalLinks && /^https:\/\/(?!file)[a-zA-Z0-9_]+\.(?:(?!\/\/)[a-zA-Z0-9_%$?/.])+$/i.test(url))
        electron.shell.openExternal(url); // TODO Improve Security whitelist
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
      return electron.clipboard.readText('selection'); // TODO Security issue?
    });
    this._proc.on(apiConstants.general_isDev, (evt, arg) => evt.returnValue = isDev);

    if (this._zoomController) {
    this._proc.on(apiConstants.general_setZoomFactor, (evt, zoomFactor) => {
      this._storage.setItem(storageKeys.ZOOM_FACTOR, zoomFactor);
    });
    this._proc.on(apiConstants.general_zoomIn, () => {
      this._zoomController.zoomIn();
    });
    this._proc.on(apiConstants.general_zoomOut, () => {
      this._zoomController.zoomOut();
    });
    this._proc.on(apiConstants.general_zoomReset, () => {
      this._zoomController.zoomReset();
    });
    this._proc.on(apiConstants.general_getPlatform, (evt) => {
      evt.returnValue = process.platform;
    });
    } // end zoomController

    // Audo-updating
    this._proc.on(apiConstants.general_downloadAvailableUpdate, () => {
      logger.info('User confirmed download available update');
      this._autoUpdater.downloadUpdate();
    });
    this._proc.on(apiConstants.general_restartInstallUpdate, async () => {
      logger.info('User confirmed install downloaded update');
      await this._shutdown.shutdown();
      this._autoUpdater.quitAndInstall();
    });
  }

  _initContextMenu() {
    this._proc.on(apiConstants.contextMenu_showCopyMenu, () => {
      this._contextMenu.showCopyMenu();
    });
    this._proc.on(apiConstants.contextMenu_showPasteMenu, () => {
      this._contextMenu.showPasteMenu();
    });
    this._proc.on(apiConstants.contextMenu_showStandardMenu, () => {
      this._contextMenu.showStandardMenu();
    });
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
    this._proc.handle(apiConstants.cloudChains_getWalletConf, async (evt, ticker) => {
      return sanitize(await this._cloudChains.getWalletConf(ticker), Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.cloudChains_getWalletConfs, async (evt, arg) => {
      return sanitize(await this._cloudChains.getWalletConfs(), Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.cloudChains_getMasterConf, async (evt, arg) => {
      return sanitize(await this._cloudChains.getMasterConf(), Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.cloudChains_isWalletCreated, (evt, arg) => {
      return this._cloudChains.isWalletCreated();
    });
    this._proc.handle(apiConstants.cloudChains_saveWalletCredentials, (evt, password, salt) => {
      return this._cloudChains.saveWalletCredentials(password, salt);
    });
    this._proc.handle(apiConstants.cloudChains_getStoredPassword, (evt, arg) => {
      return this._cloudChains.getStoredPassword();
    });
    this._proc.handle(apiConstants.cloudChains_getStoredSalt, (evt, arg) => {
      return this._cloudChains.getStoredSalt();
    });
    this._proc.handle(apiConstants.cloudChains_getDecryptedMnemonic, (evt, password) => {
      return this._cloudChains.getDecryptedMnemonic(password);
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
    this._proc.handle(apiConstants.cloudChains_createSPVWallet, (evt, password, mnemonic) => {
      if (password)
        this._clearWalletStorage();
      return this._cloudChains.createSPVWallet(password, mnemonic);
    });
    this._proc.handle(apiConstants.cloudChains_enableAllWallets, (evt, arg) => {
      return this._cloudChains.enableAllWallets();
    });
    this._proc.handle(apiConstants.cloudChains_changePassword, (evt, oldPassword, newPassword) => {
      return this._cloudChains.changePassword(oldPassword, newPassword);
    });
    this._proc.handle(apiConstants.cloudChains_matchesStoredPassword, (evt, password) => {
      return this._cloudChains.matchesStoredPassword(password);
    });
    this._proc.handle(apiConstants.cloudChains_isNewInstall, (evt, arg) => {
      return this._cloudChains.isNewInstall();
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
    this._proc.handle(apiConstants.confController_getXBridgeInfo, async (evt, arg) => {
      return sanitize(await this._confController.getXBridgeInfo(), Blacklist, Whitelist);
    });
  }

  /**
   * WalletController api handlers.
   * @private
   */
  _initWalletController() {
    const walletSerializer = w => {
      w._rpcEnabled = w.rpcEnabled(); // for ui
      return w;
    };
    const walletsSerializer = wallets => {
      for (const w of wallets)
        walletSerializer(w);
      return wallets;
    };
    this._proc.handle(apiConstants.walletController_getWallets, async (evt, arg) => {
      return sanitize(_.cloneDeep(walletsSerializer(await this._walletController.getWallets())), Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.walletController_getWallet, async (evt, ticker) => {
      return sanitize(_.cloneDeep(walletSerializer(await this._walletController.getWallet(ticker))), Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.walletController_getEnabledWallets, async (evt, arg) => {
      return sanitize(_.cloneDeep(walletsSerializer(await this._walletController.getEnabledWallets())), Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.walletController_getBalances, (evt, arg) => {
      return this._walletController.getBalances();
    });
    this._proc.handle(apiConstants.walletController_getCurrencyMultipliers, (evt, arg) => {
      return this._walletController.getCurrencyMultipliers();
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
    this._proc.handle(apiConstants.walletController_walletRpcReady, (evt, ticker, timeOut = 0) => {
      const wallet = this._walletController.getWallet(ticker);
      if (!wallet)
        return false;
      return wallet.rpcReady(timeOut);
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
    this._proc.handle(apiConstants.wallet_getTransactions, async (evt, ticker, startTime, endTime) => {
      const wallet = this._walletController.getWallet(ticker);
      const txs = await wallet.getTransactions(startTime, endTime);
      return sanitize(txs, Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.wallet_getAddresses, (evt, ticker) => {
      return this._walletController.getWallet(ticker).getAddresses();
    });
    this._proc.handle(apiConstants.wallet_generateNewAddress, (evt, ticker) => {
      return this._walletController.getWallet(ticker).generateNewAddress();
    });
    this._proc.handle(apiConstants.wallet_getCachedUnspent, async (evt, ticker, cacheExpirySeconds) => {
      const wallet = this._walletController.getWallet(ticker);
      const utxos = await wallet.getCachedUnspent(cacheExpirySeconds);
      return sanitize(utxos, Blacklist, Whitelist);
    });
    this._proc.handle(apiConstants.wallet_send, (evt, ticker, recipients) => {
      recipients = recipients.map(r => new Recipient(r));
      return this._walletController.getWallet(ticker).send(recipients);
    });
    this._proc.on(apiConstants.wallet_getExplorerLink, (evt, ticker) => {
      evt.returnValue = this._walletController.getWallet(ticker).getExplorerLink();
    });
    this._proc.on(apiConstants.wallet_getExplorerLinkForTx, (evt, ticker, tx) => {
      evt.returnValue = this._walletController.getWallet(ticker).getExplorerLinkForTx(tx);
    });
    this._proc.on(apiConstants.wallet_getWebsiteLink, (evt, ticker) => {
      evt.returnValue = this._walletController.getWallet(ticker).getWebsiteLink();
    });
  }

  /**
   * Pricing api handlers.
   * @private
   */
  _initPricing() {
    this._proc.handle(apiConstants.pricing_getPrice, (evt, ticker, currency) => {
      return this._pricing.getPrice(ticker, currency);
    });
  }

  /**
   * Clears wallet related storage.
   * @private
   */
  _clearWalletStorage() {
    this._storage.setItems({
      [storageKeys.PASSWORD]: '',
      [storageKeys.SALT]: '',
      [storageKeys.BALANCES]: null
    });
  }
}

export default Api;
