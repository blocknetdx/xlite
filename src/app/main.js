window.$ = require('jquery');
require('popper.js');
require('bootstrap');

import * as appActions from './actions/app-actions';
import {activeViews, MIN_UI_HEIGHT, MIN_UI_WIDTH} from './constants';
import Alert from './modules/alert';
import App from './components/app';
import appReducer from './reducers/app-reducer';
import CloudChains from './modules/cloudchains-r';
import ConfController from './modules/conf-controller-r';
import domStorage from './modules/dom-storage';
import Localize from './components/shared/localize';
import TokenManifest from './modules/token-manifest';
import WalletController from './modules/wallet-controller-r';

import { combineReducers, createStore } from 'redux';
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

let resizeTimeout;
window.addEventListener('resize', e => {
  let { innerWidth, innerHeight } = e.target;
  if(innerWidth < MIN_UI_WIDTH)
    innerWidth = MIN_UI_WIDTH;
  if(innerHeight < MIN_UI_HEIGHT)
    innerHeight = MIN_UI_HEIGHT;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if(innerWidth) {
      store.dispatch(appActions.setWindowSize(innerWidth, innerHeight));
      // Store screen size in main process storage
      api.general_storeScreenSize({width: innerWidth, height: innerHeight});
    }
  }, 200);
});

// Default to loading screen
store.dispatch(appActions.setActiveView(activeViews.LOADING));

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
      await walletController.loadWallets();
    } catch (err) {
      // Fatal error, warn user and exit program
      await Alert.error(Localize.text('Issue'), Localize.text('Failed to load CloudChains wallet configs.'));
      await api.general_requestClose('fatal error, failed to load CloudChains conf files');
      return;
    }

    // Notify UI of existing cached info
    await walletController.dispatchBalances(appActions.setBalances, store);
    await walletController.dispatchTransactions(appActions.setTransactions, store);
    await walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
    await walletController.dispatchWallets(appActions.setWallets, store);

    // Update latest balance info
    await walletController.updateAllBalances();
    await walletController.dispatchBalances(appActions.setBalances, store);
    await walletController.dispatchTransactions(appActions.setTransactions, store);

    // Update currency information
    await walletController.updatePriceMultipliers();
    await walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);

    // Active wallets
    await walletController.dispatchWallets(appActions.setWallets, store);

    // Watch for updates
    await walletController.pollUpdates(30000, async () => { // every 30 sec
      await walletController.updateAllBalances();
      walletController.dispatchBalances(appActions.setBalances, store);
      walletController.dispatchTransactions(appActions.setTransactions, store);
    });
    await walletController.pollPriceMultipliers(300000, async () => { // every 5 min
      await walletController.updatePriceMultipliers();
      walletController.dispatchPriceMultipliers(appActions.setCurrencyMultipliers, store);
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

  // These calls to the store will trigger the UI startup process.
  // i.e. the loading screen is displayed until these calls complete
  // below.
  store.dispatch(appActions.setManifest(tokenManifest));
  store.dispatch(appActions.setCloudChains(cloudChains));
  store.dispatch(appActions.setWalletController(walletController));
  store.dispatch(appActions.setStartupInitializer(startupInit(walletController, confController, confManifest.length === 0)));
  store.dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
})();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('js-main')
);
