
window.$ = require('jquery');
require('popper.js');
require('bootstrap');

import './modules/window-zoom-handlers';
import * as appActions from './actions/app-actions';
import {activeViews, MIN_UI_HEIGHT, MIN_UI_WIDTH} from './constants';
import Alert from './modules/alert';
import App from './components/app';
import appReducer from './reducers/app-reducer';
import CloudChains from './modules/cloudchains-r';
import ConfController from './modules/conf-controller-r';
import domStorage from './modules/dom-storage';
import Localize from './components/shared/localize';
import {logger} from './modules/logger-r';
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
 * Return pricing data from cache.
 * @param pricing {Pricing}
 * @param walletController {WalletController}
 * @return {Promise<Map<{string}, {PriceData[]}>>}
 */
const updatePrices = async (pricing, walletController) => {
  let prices = new IMap();
  try {
    // Always pull from cache (do not trigger network requests here)
    const tickers = (await walletController.getWallets()).map(w => w.ticker);
    const priceData = await pricing.updatePricing(tickers, ['USD']);
    prices = new IMap(priceData);
  } catch (e) {
    logger.error('failed initial pricing update', e.message);
  }
  return prices;
};

/**
 * Startup initialization should happen on login.
 * @param walletController {WalletController}
 * @param confController {ConfController}
 * @param pricingController {Pricing}
 * @param confNeedsManifestUpdate {boolean}
 * @return {function}
 */
function startupInit(walletController, confController, pricingController, confNeedsManifestUpdate) {
  return async () => {
    try {
      await walletController.loadWallets();
    } catch (err) {
      // Fatal error, warn user and exit program
      await Alert.error(Localize.text('Issue'), Localize.text('Failed to load CloudChains wallet configs.'));
      await api.general_requestClose('fatal error, failed to load CloudChains conf files');
      return;
    }

    // Notify UI of existing cached info
    walletController.dispatchBalances(appActions.setBalances, store);
    walletController.dispatchTransactions(appActions.setTransactions, store);
    walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
    walletController.dispatchWallets(appActions.setWallets, store);

    // Update latest balance info
    walletController.updateAllBalances()
      .then(() => {
        walletController.dispatchBalances(appActions.setBalances, store);
        walletController.dispatchTransactions(appActions.setTransactions, store);
      });

    // Update pricing info
    updatePrices(pricingController, walletController)
      .then(prices => store.dispatch(appActions.setPricing(prices)));

    // Update currency information
    walletController.updatePriceMultipliers()
      .then(() => walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store));

    // Watch for updates
    walletController.pollUpdates(30000, () => { // every 30 sec
      walletController.updateAllBalances()
        .then(() => {
          walletController.dispatchBalances(appActions.setBalances, store);
          walletController.dispatchTransactions(appActions.setTransactions, store);
        });
    });
    walletController.pollPriceMultipliers(300000, () => { // every 5 min
      walletController.updatePriceMultipliers()
        .then(() => walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store));
      // Update pricing info
      updatePrices(pricingController, walletController)
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
  store.dispatch(appActions.setCCVersion((await api.cloudChains_getCCSPVVersion())));

  const confController = new ConfController(api);
  const confManifest = await confController.getManifest();
  const xbInfos = await confController.getXBridgeInfo();
  // Create the token manifest from the raw manifest data and fee information
  const tokenManifest = new TokenManifest(confManifest, xbInfos);
  const walletController = new WalletController(api, tokenManifest, domStorage);
  // Create the wallet controller
  const cloudChains = new CloudChains(api);
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
