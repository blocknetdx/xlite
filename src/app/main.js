// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { setShowWindowsLibraryDownloadModal } from './actions/app-actions';

window.$ = require('jquery');
require('popper.js');
require('bootstrap');

import './util/public-path-r'; // must be first
import './modules/window-zoom-handlers';
import * as appActions from './actions/app-actions';
import { activeViews, MIN_UI_HEIGHT, MIN_UI_WIDTH, platforms, UNKNOWN_CC_VERSION } from './constants';
import Alert from './modules/alert';
import App from './components/app';
import appReducer from './reducers/app-reducer';
import CloudChains from './modules/cloudchains-r';
import ConfController from './modules/conf-controller-r';
import domStorage from './modules/dom-storage';
import Localize from './components/shared/localize';
import {logger} from './modules/logger-r';
import LWDB from './modules/lwdb';
import Pricing from './modules/pricing-r';
import TokenManifest from './modules/token-manifest';
import WalletController from './modules/wallet-controller-r';
import { timeout } from './util';

import { combineReducers, createStore } from 'redux';
import {Map as IMap} from 'immutable';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

// Context bridge api
const {api} = window;
const {isDev} = api;

// TODO Remove prior to release (Beta only)
if (!domStorage.getItem('BETA_0_9_7g')) {
  (async () => {
    await LWDB.delete('LWDB');
    // const db = new LWDB('LWDB');
    // await db.clear();
  })();
  domStorage.clear();
  domStorage.setItem('BETA_0_9_7g', true);
}

// Init db
const db = new LWDB('LWDB');

const combinedReducers = combineReducers({
  appState: appReducer
});

const store = createStore(combinedReducers);
if(isDev) {
  // (async () => await db.clear())(); // <- clear all indexeddb data
  // domStorage.clear(); // <- clear all stored data
  // domStorage.removeItem('TX_LAST_FETCH_TIME_BLOCK'); // <- clear BLOCK transaction fetch time
  // domStorage.removeItem('TX_LAST_FETCH_TIME_LTC'); // <- clear LTC transaction fetch time
  console.log('state', store.getState());
  store.subscribe(() => {
    const state = store.getState();
    console.log(new Date().toLocaleString() + ' state', state);
  });
}

const updateScrollbars = (innerWidth, innerHeight) => {
  if(innerWidth < MIN_UI_WIDTH) {
    $('html').css({
      overflowX: 'scroll'
    });
  } else {
    $('html').css({
      overflowX: 'hidden'
    });
  }
  if(innerHeight < MIN_UI_HEIGHT) {
    $('html').css({
      overflowY: 'scroll'
    });
  } else {
    $('html').css({
      overflowY: 'hidden'
    });
  }
};

let shutdownRequested = false;
api.general_onShutdown(() => {
  if (shutdownRequested)
    return;
  shutdownRequested = true;
  // Display shutdown alert and add delay before full shutdown request
  Alert.message(Localize.text('Shutdown', 'shutdown'),
    Localize.text('Wallet is shutting down, please wait...', 'shutdown'));
  timeout(1000).then(() => {
    api.general_requestClose();
  });
});

api.general_onUpdateAvailable(async function(version) {
  const { isConfirmed } = await Alert.confirm(
    Localize.text('New update available!', 'universal'),
    Localize.text('Xlite v{{version}} is available. Would you like to download the update now?', 'universal', {version})
  );
  if(isConfirmed) {
    api.general_downloadAvailableUpdate();
  }
});
api.general_onUpdateDownloaded(async function(version) {
  const { isConfirmed } = await Alert.confirm(
    Localize.text('Update ready to install', 'universal'),
    Localize.text('Xlite v{{version}} has been downloaded and will install on next restart. Would you like to restart now?', 'universal', {version}),
    Localize.text('Yes, restart now', 'universal'),
    Localize.text('No', 'universal')
  );
  if(isConfirmed) {
    api.general_restartInstallUpdate();
  }
});

// Add window event handlers
window.addEventListener('paste', async function(e) {
  const type = $(e.target).attr('type');
  if(type === 'password') {
    // a timeout is necessary to allow the paste event to take place before clearing the clipboard
    await timeout(10000);
    api.general_setClipboard('');
  }
});
let resizeTimeout;
window.addEventListener('resize', e => {
  const { innerWidth: origInnerWidth, innerHeight: origInnerHeight, outerWidth, outerHeight } = e.target;
  let innerWidth = origInnerWidth;
  let innerHeight = origInnerHeight;
  if(innerWidth < MIN_UI_WIDTH)
    innerWidth = MIN_UI_WIDTH;
  if(innerHeight < MIN_UI_HEIGHT)
    innerHeight = MIN_UI_HEIGHT;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateScrollbars(origInnerWidth, origInnerHeight);
    if(innerWidth) {
      store.dispatch(appActions.setWindowSize(innerWidth, innerHeight));
      // Store screen size in main process storage
      // need to use outer height because inner height is relative to the zoom level
      api.general_storeScreenSize({width: outerWidth, height: outerHeight});
    }
  }, 200);
});

// Default to loading screen
store.dispatch(appActions.setActiveView(activeViews.LOADING));

/**
 * Startup initialization should happen on login.
 * @param walletController {WalletController}
 * @param confController {ConfController}
 * @param pricingController {Pricing}
 * @param confNeedsManifestUpdate {boolean}
 * @return {function(boolean)}
 */
function startupInit(walletController, confController, pricingController, confNeedsManifestUpdate) {
  return async (slowLoad = false) => {
    try {
      await walletController.loadWallets();
    } catch (err) {
      // Fatal error, warn user and exit program
      await Alert.error(Localize.text('Issue'), Localize.text('Failed to load CloudChains wallet configs.'));
      await api.general_requestClose('fatal error, failed to load CloudChains conf files');
      return;
    }

    // Let listeners know about initial data
    walletController.dispatchWallets(appActions.setWallets, store);
    walletController.dispatchBalances(appActions.setBalances, store);
    walletController.dispatchTransactions(appActions.setTransactions, store);
    walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
    // Use MAX_SAFE_INTEGER to ensure latest prices are pulled from cache
    walletController.dispatchPrices(pricingController, appActions.setPricing, store, Number.MAX_SAFE_INTEGER);

    // Update pricing info
    walletController.updatePrices(pricingController)
      .then(prices => store.dispatch(appActions.setPricing(prices)));

    // Update currency information
    walletController.updatePriceMultipliers()
      .then(() => walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store));

    // Wait for rpc to become available and then fetch (this also updates txs and balances)
    await walletController.waitForRpcAndFetch(slowLoad ? 12500 : 10000, store);

    // Watch for updates
    walletController.pollUpdates(30000, () => { // every 30 sec
      const handler = ticker => {
        walletController.dispatchBalances(appActions.setBalances, store);
        walletController.dispatchTransactionsTicker(ticker, appActions.setTransactions, store);
      };
      walletController.updateAllBalancesStream(false, handler);
    });
    walletController.pollPriceMultipliers(300000, () => { // every 5 min
      walletController.updatePriceMultipliers()
        .then(() => walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store));
      // Update pricing info
      walletController.updatePrices(pricingController)
        .then(prices => store.dispatch(appActions.setPricing(prices)));
    });

    // Update the manifest if necessary
    if (confNeedsManifestUpdate)
      confController.updateManifest();
  };
} // end startupInit

(async function() {
  let locale = await api.general_userLocale();
  if (!locale)
    locale = 'en';
  const localeData = await api.general_getLocaleData(locale);
  Localize.initialize({
    locale,
    localeData: localeData
  });

  updateScrollbars(window.innerWidth, window.innerHeight);

  store.dispatch(appActions.setAppVersion((await api.general_getAppVersion())));

  const ccVersion = await api.cloudChains_getCCSPVVersion();
  store.dispatch(appActions.setCCVersion(ccVersion));

  const cloudChains = new CloudChains(api, db, domStorage);
  if (await cloudChains.isNewInstall()) { // If new install clear the storage
    domStorage.clear();
    await db.clear();
    if(api.general_getPlatform() === platforms.win && ccVersion === UNKNOWN_CC_VERSION)
      store.dispatch(setShowWindowsLibraryDownloadModal(true));
  }

  const dispatchLoadingTransactions = loadingTransactions => {
    store.dispatch(appActions.setLoadingTransactions(loadingTransactions));
  };

  const confController = new ConfController(api);
  const confManifest = await confController.getManifest();
  const xbInfos = await confController.getXBridgeInfo();
  // Create the token manifest from the raw manifest data and fee information
  const tokenManifest = new TokenManifest(confManifest, xbInfos);
  const walletController = new WalletController(api, tokenManifest, domStorage, db, dispatchLoadingTransactions);
  // Create the wallet controller
  const pricingController = new Pricing(api, domStorage);

  // These calls to the store will trigger the UI startup process.
  // i.e. the loading screen is displayed until these calls complete
  // below.
  store.dispatch(appActions.setManifest(tokenManifest));
  store.dispatch(appActions.setCloudChains(cloudChains));
  store.dispatch(appActions.setWalletController(walletController));
  store.dispatch(appActions.setPricingController(pricingController));
  store.dispatch(appActions.setStartupInitializer(startupInit(walletController, confController, pricingController, confManifest.length === 0)));
  store.dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
})();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('js-main')
);
