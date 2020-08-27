import './modules/window-zoom-handlers';
import * as appActions from './actions/app-actions';
import Alert from './modules/alert';
import App from './components/app';
import appReducer from './reducers/app-reducer';
import CloudChains from './modules/cloudchains';
import ConfController from './modules/conf-controller';
import domStorage from './modules/dom-storage';
import {generateSalt, pbkdf2} from './modules/crypt';
import {getLocaleData, handleError, logger} from './util';
import {activeViews, HTTP_REQUEST_TIMEOUT, ipcMainListeners, localStorageKeys, MIN_UI_HEIGHT, MIN_UI_WIDTH} from './constants';
import Localize from './components/shared/localize';
import TokenManifest from './modules/token-manifest';
import WalletController from './modules/wallet-controller';

import { combineReducers, createStore } from 'redux';
import fs from 'fs-extra';
import { ipcRenderer } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
const {remote} = require('electron');
import request from 'superagent';

// Handle any uncaught exceptions
process.on('uncaughtException', err => {
  handleError(err);
});
process.on('unhandledRejection', err => {
  handleError(err);
});

const combinedReducers = combineReducers({
  appState: appReducer
});

const store = createStore(combinedReducers);
if(isDev) {
  // domStorage.clear(); // <- clear all stored data
  // domStorage.removeItem('TRANSACTIONS_BLOCK'); // <- clear BLOCK transactions
  // domStorage.removeItem('TX_LAST_FETCH_TIME_BLOCK'); // <- clear BLOCK transaction fetch time
  console.log('state', store.getState());
  store.subscribe(() => {
    const state = store.getState();
    console.log('state', state);
  });

  // Hot reload
  const reload = () => {
    remote.getCurrentWindow().reload();
  };
  const {globalShortcut} = remote;
  globalShortcut.register('F5', reload);
  globalShortcut.register('CommandOrControl+R', reload);
  // here is the fix bug #3778, if you know alternative ways, please write them
  window.addEventListener('beforeunload', () => {
    globalShortcut.unregister('F5', reload);
    globalShortcut.unregister('CommandOrControl+R', reload);
  });

  // Set default password in isDev mode
  const { CC_WALLET_PASS = '' } = process.env;
  if (CC_WALLET_PASS !== '') {
    const salt = generateSalt(32);
    const hashedPassword = pbkdf2(CC_WALLET_PASS, salt);
    domStorage.setItems({
      [localStorageKeys.PASSWORD]: hashedPassword,
      [localStorageKeys.SALT]: salt
    });
  }
}

let resizeTimeout;
window.addEventListener('resize', e => {
  let { innerWidth, innerHeight } = e.target;
  if(innerWidth < MIN_UI_WIDTH)
    innerWidth = MIN_UI_WIDTH;
  if(innerHeight < MIN_UI_HEIGHT)
    innerHeight = MIN_UI_HEIGHT;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if(innerWidth)
    store.dispatch(appActions.setWindowSize(innerWidth, innerHeight));
  }, 200);
});

const locale = ipcRenderer.sendSync(ipcMainListeners.GET_USER_LOCALE);
Localize.initialize({
  locale,
  localeData: getLocaleData(locale)
});

// Default to loading screen
store.dispatch(appActions.setActiveView(activeViews.LOADING));

fs.readJson(path.resolve(__dirname, '../../package.json'))
  .then(({ version }) => {
    logger.info(`Starting XVault version ${version}`);
  })
  .catch(err => logger.error(err));

// Create CloudChains conf manager
const cloudChains = new CloudChains(CloudChains.defaultPathFunc, domStorage);

// Shutdown the cli on window close if it's running.
// Requires valid cloudChains instance.
remote.getCurrentWindow().once('close', e => {
  if (cloudChains.spvIsRunning())
    cloudChains.stopSPV();
});

/**
 * Updates the conf manifest.
 * @param confController {ConfController}
 * @return {Promise<void>}
 */
async function updateConfManifest(confController) {
  const manifestUrl = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/blockchainconfigfilehashmap.json';
  const manifestConfPrefix = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/files/xbridge-confs/';
  const manifestHeadReq = async () => { return await request.head(manifestUrl).timeout(30000); };
  if (await confController.needsUpdate(manifestHeadReq)) {
    const confRequest = async (url) => { return await request.get(url).accept('text/plain').timeout(HTTP_REQUEST_TIMEOUT); };
    await confController.updateLatest(manifestUrl, manifestConfPrefix, confController.getManifestHash(), 'manifest-latest.json', confRequest);
  }
}
/**
 * Startup initialization should happen on login.
 * @param walletController {WalletController}
 * @param confController {ConfController}
 * @param confNeedsManifestUpdate {boolean}
 * @return {function}
 */
function startupInit(walletController, confController, confNeedsManifestUpdate) {
  return async () => {
  try {
    walletController.loadWallets();
  } catch (err) {
    logger.error('fatal error, failed to load CloudChains conf files');
    // Fatal error, warn user and exit program
    await Alert.error(Localize.text('Issue'), Localize.text('Failed to load CloudChains wallet configs.'));
    ipcRenderer.send(ipcMainListeners.CLOSE);
    return;
  }

  // Notify UI of existing cached info
  walletController.dispatchBalances(appActions.setBalances, store);
  walletController.dispatchTransactions(appActions.setTransactions, store);
  walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
  walletController.dispatchWallets(appActions.setWallets, store);

  // Update latest balance info
  await walletController.updateAllBalances();
  walletController.dispatchBalances(appActions.setBalances, store);
  walletController.dispatchTransactions(appActions.setTransactions, store);

  // Update currency information
  const currencyReq = async (ticker, currencies) => {
    return await request.get(`https://min-api.cryptocompare.com/data/price?fsym=${ticker}&tsyms=${currencies.join(',')}`);
  };
  await walletController.updatePriceMultipliers(currencyReq);
  walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);

  // Active wallets
  walletController.dispatchWallets(appActions.setWallets, store);

  // Watch for updates
  walletController.pollUpdates(30000, () => { // every 30 sec
    walletController.dispatchBalances(appActions.setBalances, store);
    walletController.dispatchTransactions(appActions.setTransactions, store);
  });
  walletController.pollPriceMultipliers(currencyReq, 300000, () => { // every 5 min
    walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
  });

  // Update the manifest if necessary
  if (confNeedsManifestUpdate)
    await updateConfManifest(confController);
  };
} // end startupInit

(async function() {
  if (!cloudChains.isInstalled() || !cloudChains.hasSettings()) {
    logger.info('No CloudChains installation found, installing wallet configs.');

    if (!await cloudChains.enableAllWallets()) {
      // Fatal error, warn user and exit program
      await Alert.error(Localize.text('Install Issue'),
        Localize.text('The CloudChains Litewallet daemon failed to write to wallet configuration files. ' +
          'Does it have the proper permissions? Please reinstall.'));
      ipcRenderer.send(ipcMainListeners.CLOSE);
      return;
    }

    logger.info('Enabling all CloudChains wallets.');
    logger.info('Enabling CloudChains master RPC server.');

    // cc found but missing settings
    if (!cloudChains.hasSettings()) {
      logger.error('No CloudChains settings found.');
      // Fatal error, warn user and exit program
      await Alert.error(Localize.text('Install Issue'), Localize.text('The CloudChains Litewallet daemon missing. Please reinstall.'));
      ipcRenderer.send(ipcMainListeners.CLOSE);
      return;
    }
  }

  if (!await cloudChains.isWalletRPCRunning()) {
    const binFilePath = cloudChains.getCCSPVFilePath();
    const exists = await fs.pathExists(binFilePath);
    if(!exists) {
      logger.error(`Unable to find CloudChains Litewallet at ${binFilePath}`);
      await Alert.error(Localize.text('Issue'), Localize.text(`Failed to locate the CloudChains Litewallet at ${binFilePath}.`));
      ipcRenderer.send(ipcMainListeners.CLOSE);
      return;
    }
    // No need to await and hold up the whole process for this
    cloudChains.getCCSPVVersion()
      .then(ccVersion => {
        logger.info(`Using CloudChains Litewallet version ${ccVersion}`);
      })
      .catch(err => {
        logger.error(err);
      });
  }

  // Load latest configuration prior to any further initialization
  try {
    cloudChains.loadConfs();
  } catch (e) {
    logger.error('Problem loading configs');
    // Fatal error, warn user and exit program
    await Alert.error(Localize.text('Issue'), Localize.text('The CloudChains Litewallet configs failed to load.'));
    ipcRenderer.send(ipcMainListeners.CLOSE);
    return;
  }

  // Ask the conf controller for the latest manifest data. Also need
  // to provide the conf controller with knowledge about available
  // wallets so that it can limit the number of downloads to only
  // what we need.
  const availableWallets = cloudChains.getWalletConfs().map(c => c.ticker());
  const confController = new ConfController(domStorage, availableWallets);
  await confController.init(path.resolve(__dirname, '../blockchain-configuration-files'));
  let confNeedsManifestUpdate = true;
  if (confController.getManifest().length === 0) {
    confNeedsManifestUpdate = false;
    await updateConfManifest(confController);
  }
  // Create the token manifest from the raw manifest data and fee information
  const tokenManifest = new TokenManifest(confController.getManifest(), confController.getXBridgeInfo());
  // Create the wallet controller
  const walletController = new WalletController(cloudChains, tokenManifest, domStorage);

  // These calls to the store will trigger the UI startup process.
  // i.e. the loading screen is displayed until these calls complete
  // below.
  store.dispatch(appActions.setManifest(tokenManifest));
  store.dispatch(appActions.setCloudChains(cloudChains));
  store.dispatch(appActions.setStartupInitializer(startupInit(walletController, confController, confNeedsManifestUpdate)));
  store.dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
})();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('js-main')
);
