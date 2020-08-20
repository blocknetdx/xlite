import './modules/window-zoom-handlers';
import * as appActions from './actions/app-actions';
import App from './components/app';
import appReducer from './reducers/app-reducer';
import CloudChains from './modules/cloudchains';
import ConfController from './modules/conf-controller';
import domStorage from './modules/dom-storage';
import { getLocaleData, handleError, logger, walletSorter } from './util';
import { activeViews, HTTP_REQUEST_TIMEOUT, ipcMainListeners } from './constants';
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
  console.log('state', store.getState());
  store.subscribe(() => {
    const state = store.getState();
    console.log('state', state);
  });

  // Hot reload
  const {getCurrentWindow, globalShortcut} = require('electron').remote;
  const reload = () => {
    getCurrentWindow().reload();
  };
  globalShortcut.register('F5', reload);
  globalShortcut.register('CommandOrControl+R', reload);
  // here is the fix bug #3778, if you know alternative ways, please write them
  window.addEventListener('beforeunload', () => {
    globalShortcut.unregister('F5', reload);
    globalShortcut.unregister('CommandOrControl+R', reload);
  });
}

window.addEventListener('resize', e => {
  const { innerWidth, innerHeight } = e.target;
  store.dispatch(appActions.setWindowSize(innerWidth, innerHeight));
});

const locale = ipcRenderer.sendSync(ipcMainListeners.GET_USER_LOCALE);
Localize.initialize({
  locale,
  localeData: getLocaleData(locale)
});

/**
 * Updates the conf manifest.
 * @param confController {ConfController}
 * @return {Promise<void>}
 */
async function updateConfManifest(confController) {
  const manifestUrl = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/blockchainconfigfilehashmap.json';
  const manifestConfPrefix = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/files/xbridge-confs/';
  const manifestHeadReq = async () => { return await request.head(manifestUrl).timeout(HTTP_REQUEST_TIMEOUT); };
  if (await confController.needsUpdate(manifestHeadReq)) {
    const confRequest = async (url) => { return await request.get(url).timeout(HTTP_REQUEST_TIMEOUT).responseType('blob'); };
    await confController.updateLatest(manifestUrl, manifestConfPrefix, confController.getManifestHash(), 'manifest-latest.json', confRequest);
  }
}

fs.readJson(path.resolve(__dirname, '../../package.json'))
  .then(({ version }) => {
    logger.info(`Starting Xvault version ${version}`);
  })
  .catch(err => logger.error(err));

let ccVersionLogged = false;

// Create CloudChains conf manager
const cloudChains = new CloudChains(CloudChains.defaultPathFunc);
store.dispatch(appActions.setCloudChains(cloudChains));

const startupProcess = async function() {

  // cc is not installed
  if (!await cloudChains.isInstalled()) {
    logger.info('No cloudchains installation found.');
    store.dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
    return;
  }

  // cc found but missing settings
  if (!await cloudChains.hasSettings()) {
    logger.error('cannot find CloudChains settings');
    logger.info('Enabling all CloudChains wallets.');
    await cloudChains.enableAllWallets();
    logger.info('Enabling CloudChains master RPC server.');
    cloudChains.loadConfs();
  }

  // Ask the conf controller for the latest manifest data. Also need
  // to provide the conf controller with knowledge about available
  // wallets so that it can limit the number of downloads to only
  // what we need.
  const availableWallets = cloudChains.getWalletConfs().map(c => c.ticker());
  const confController = new ConfController(domStorage, availableWallets);
  let confNeedsManifestUpdate = true;
  if (confController.getManifest().length === 0) {
    confNeedsManifestUpdate = false;
    await updateConfManifest(confController);
  }
  // Create the token manifest from the raw manifest data and fee information
  const tokenManifest = new TokenManifest(confController.getManifest(), confController.getFeeInfo());
  store.dispatch(appActions.setManifest(tokenManifest));

  if(!ccVersionLogged) {
    const binFilePath = cloudChains.getCCSPVFilePath();
    const exists = await fs.pathExists(binFilePath);
    if(!exists) {
      logger.error(`Unable to find CC binary at ${binFilePath}`);
      return;
    }
    // No need to await and hold up the whole process for this
    cloudChains.getCCSPVVersion()
      .then(ccVersion => {
        logger.info(`Using CC CLI version ${ccVersion}`);
        ccVersionLogged = true;
      })
      .catch(err => {
        logger.error(err);
      });
  }

  // cc is installed and has settings
  const { ccWalletStarted } = store.getState().appState;

  // cc needs to be started
  if(!ccWalletStarted) {
    store.dispatch(appActions.setCCWalletCreated(true));
    store.dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
    return;
  } else { // cc has already been started
    store.dispatch(appActions.setActiveView(activeViews.DASHBOARD));
  }

  const walletController = new WalletController(cloudChains, tokenManifest, domStorage);
  try {
    walletController.loadWallets();
  } catch (err) {
    logger.error('fatal error, failed to load CloudChains conf files');
    return; // TODO Failing to load CloudChains conf files fatal?
  }

  // Notify UI of existing cached info
  walletController.dispatchBalances(appActions.setBalances, store);
  walletController.dispatchTransactions(appActions.setTransactions, store);
  walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
  walletController.dispatchWallets(appActions.setWallets, store);
  walletController.dispatchActiveWallet(appActions.setActiveWallet, store);

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

  // Set the active wallet only if it hasn't already been set
  // or if there's only one wallet available.
  const wallets = walletController.getWallets();
  if (wallets.length > 0) {
    if (wallets.length === 1)
      walletController.setActiveWallet(wallets[0].ticker);
    else if (!walletController.getActiveWallet()) { // pick wallet with highest balance
      const balances = walletController.getBalances();
      const sortedWallets = wallets.sort(walletSorter(balances));
      walletController.setActiveWallet(sortedWallets[0].ticker);
    }
  }

  // Active wallets
  walletController.dispatchWallets(appActions.setWallets, store);
  walletController.dispatchActiveWallet(appActions.setActiveWallet, store);

  // Watch for updates
  walletController.pollUpdates(30000); // every 30 sec
  walletController.pollPriceMultipliers(currencyReq, 300000); // every 5 min

  // Update the manifest if necessary
  if (confNeedsManifestUpdate)
    await updateConfManifest(confController);
};

ReactDOM.render(
  <Provider store={store}>
    <App startupProcess={startupProcess} />
  </Provider>,
  document.getElementById('js-main')
);
