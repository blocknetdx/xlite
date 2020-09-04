import Api from './modules/api';
import CloudChains from './modules/cloudchains';
import {DATA_DIR, getLocaleData, storageKeys} from './constants';
import {DEFAULT_LOCALE, DEFAULT_ZOOM_FACTOR, ipcMainListeners} from '../app/constants';
import Localize from '../app/components/shared/localize';
import {logger} from './modules/logger';
import openAppWindow from './windows/app-window';
import SimpleStorage from './modules/storage';
import windowMenu from './modules/window-menu';
import ZoomController from './modules/zoom-controller';
import ConfController from './modules/conf-controller';
import TokenManifest from '../app/modules/token-manifest';
import WalletController from './modules/wallet-controller';

import { app, ipcMain,  Menu } from 'electron';
import contextMenu from 'electron-context-menu';
import fs from 'fs-extra';
import isDev from 'electron-is-dev';
import path from 'path';

// Handle any uncaught exceptions
process.on('uncaughtException', err => {
  logger.error('', err);
});
process.on('unhandledRejection', err => {
  logger.error('', err);
});

const devtools = isDev && process.env.SHOWDEVTOOLS !== 'false' && process.env.SHOWDEVTOOLS !== '0';

let appWindow;

// Only allow one instance of the application open at a time
const unlocked = app.requestSingleInstanceLock();
if(!unlocked) {
  app.quit();
}
app.on('second-instance', () => {
  if(appWindow) {
    if (appWindow._window.isMinimized()) appWindow._window.restore();
    appWindow._window.focus();
  }
});

// A key/value store for persisting app-wide settings data
const storage = new SimpleStorage(path.join(DATA_DIR, 'app-settings.json'));
// const storage = new SimpleStorage(); // In memory only (no settings path)

// Initialize the localization module
let locale = storage.getItem(storageKeys.LOCALE);
if(!locale) locale = storage.setItem(storageKeys.LOCALE, DEFAULT_LOCALE);
Localize.initialize({
  locale,
  localeData: getLocaleData(locale)
});

// Create CloudChains conf manager
const cloudChains = new CloudChains(CloudChains.defaultPathFunc, storage);

// Set env password
const { CC_WALLET_PASS = '' } = process.env;
if (CC_WALLET_PASS !== '') {
  const mnemonic = cloudChains.getDecryptedMnemonic(CC_WALLET_PASS);
  if (!cloudChains.saveWalletCredentials(CC_WALLET_PASS, null, mnemonic || 'unknown'))
    logger.error('failed to save CC_WALLET_PASS wallet credentials');
}

// Handle zoom changes
if(!storage.getItem(storageKeys.ZOOM_FACTOR)) storage.setItem(storageKeys.ZOOM_FACTOR, DEFAULT_ZOOM_FACTOR);
ipcMain.on(ipcMainListeners.SET_ZOOM_FACTOR, (e, zoomFactor) => storage.setItem(storageKeys.ZOOM_FACTOR, zoomFactor));
ipcMain.on(ipcMainListeners.GET_ZOOM_FACTOR, (e) => e.returnValue = storage.getItem(storageKeys.ZOOM_FACTOR));
const zoomController = new ZoomController(storage);
ipcMain.on(ipcMainListeners.ZOOM_IN, zoomController.zoomIn);
ipcMain.on(ipcMainListeners.ZOOM_OUT, zoomController.zoomOut);
ipcMain.on(ipcMainListeners.ZOOM_RESET, zoomController.zoomReset);

// Add a default context menu
contextMenu();

// Set the default app-wide window menu
const appMenu = Menu.buildFromTemplate(windowMenu(Localize, zoomController));
Menu.setApplicationMenu(appMenu);

let displayFatalError = null; // Object{title: '', msg: ''};
const makeError = (title, msg) => {
  return {title, msg};
};

let confController = null;
let walletController = null;
let api = null;

const startup = async () => {
  try {
    const {version} = fs.readJsonSync(path.resolve(__dirname, '../../package.json'));
    storage.setItem(storageKeys.APP_VERSION, version);
    logger.info(`Starting XLite version ${version}`);
  } catch (e) {
    logger.error(e);
  }

  if (!cloudChains.isInstalled() || !cloudChains.hasSettings()) {
    logger.info('No CloudChains installation found, installing wallet configs');

    if (!await cloudChains.enableAllWallets()) {
      // Fatal error, warn user and exit program
      displayFatalError = makeError(Localize.text('Install Issue'),
        Localize.text('The CloudChains Litewallet daemon failed to write to wallet configuration files. ' +
          'Does it have the proper permissions? Please reinstall.'));
      return;
    }

    logger.info('Enabling all CloudChains wallets');
    logger.info('Enabling CloudChains master RPC server');

    // cc found but missing settings
    if (!cloudChains.hasSettings()) {
      logger.error('No CloudChains settings found');
      // Fatal error, warn user and exit program
      displayFatalError = makeError(Localize.text('Install Issue'), Localize.text('The CloudChains Litewallet daemon missing. Please reinstall.'));
      return;
    }
  }

  if (!await cloudChains.isWalletRPCRunning()) {
    const binFilePath = cloudChains.getCCSPVFilePath();
    const exists = await fs.pathExists(binFilePath);
    if (!exists) {
      logger.error(`Unable to find CloudChains Litewallet at ${binFilePath}`);
      displayFatalError = makeError(Localize.text('Issue'), Localize.text(`Failed to locate the CloudChains Litewallet at ${binFilePath}.`));
      return;
    }
  }

  // No need to await and hold up the whole process for this
  await cloudChains.getCCSPVVersion()
    .then(ccVersion => {
      logger.info(`Using CloudChains Litewallet version ${ccVersion}`);
    })
    .catch(err => {
      logger.error(err);
    });

  // Load latest configuration prior to any further initialization
  try {
    cloudChains.loadConfs();
  } catch (e) {
    logger.error('Problem loading configs');
    // Fatal error, warn user and exit program
    displayFatalError = makeError(Localize.text('Issue'), Localize.text('The CloudChains Litewallet configs failed to load.'));
    return;
  }

  const availableWallets = cloudChains.getWalletConfs().map(c => c.ticker());
  confController = new ConfController(storage, availableWallets);
  await confController.init(path.resolve(__dirname, '../blockchain-configuration-files'));
  if (confController.getManifest().length === 0)
    await confController.updateManifest();
  // Create the token manifest from the raw manifest data and fee information
  const tokenManifest = new TokenManifest(confController.getManifest(), confController.getXBridgeInfo());
  // Create the wallet controller
  walletController = new WalletController(cloudChains, tokenManifest, storage);
};

// Start the application
app.on('ready', async () => {
  await startup();

  // displayFatalError = makeError('Test', '123'); // force debug error screen
  // Create the api
  api = new Api(storage, app, ipcMain, displayFatalError, cloudChains, confController, walletController);

  // Notify of fatal error
  if (displayFatalError) {
    openAppWindow(path.resolve(__dirname, '../error.html'), storage, devtools);
    return;
  }

  // Create the app window
  appWindow = openAppWindow(path.resolve(__dirname, '../index.html'), storage, devtools);
  // Shutdown the cli on window close if it's running.
  appWindow._window.once('close', () => {
    if (cloudChains.spvIsRunning()) {
      if (!cloudChains.stopSPV())
        logger.error('failed to stop the wallet daemon');
    }
  });

  if (isDev) {
    // Hot reload
    const {globalShortcut} = require('electron');
    const reload = () => { appWindow._window.reload(); };
    globalShortcut.register('F5', reload);
    globalShortcut.register('CommandOrControl+R', reload);
    appWindow._window.on('beforeunload', () => {
      globalShortcut.unregister('F5', reload);
      globalShortcut.unregister('CommandOrControl+R', reload);
    });
  }
});
