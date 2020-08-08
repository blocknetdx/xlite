import './modules/window-zoom-handlers';
import { ipcRenderer } from 'electron';
import fs from 'fs-extra';
import { Map } from 'immutable';
import path from 'path';
import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import isDev from 'electron-is-dev';
import * as appActions from './actions/app-actions';
import appReducer from './reducers/app-reducer';
import App from './components/app';
import { getCloudChainsDir, getLocaleData, handleError, logger, walletSorter } from './util';
import ConfController from './modules/conf-controller';
import domStorage from './modules/dom-storage';
import {altCurrencies, HTTP_REQUEST_TIMEOUT, ipcMainListeners, localStorageKeys} from './constants';
import WalletController from './modules/wallet-controller';
import Localize from './components/shared/localize';
import Wallet from './types/wallet';
import TokenManifest from './modules/token-manifest';
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

(async function() {
  // Ask the conf controller for the latest manifest data.
  const manifestUrl = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/blockchainconfigfilehashmap.json';
  const confController = new ConfController(domStorage);
  const manifestHeadReq = async () => { return await request.head(manifestUrl).timeout(HTTP_REQUEST_TIMEOUT); };
  if (await confController.needsUpdate(manifestHeadReq)) {
    const confRequest = async (url) => { return await request.get(url).timeout(HTTP_REQUEST_TIMEOUT).responseType('blob'); };
    await confController.updateLatest(manifestUrl, confController.getManifestHash(), 'manifest-latest.json', confRequest);
  }
  // Create the token manifest from the raw manifest data
  const tokenManifest = new TokenManifest(confController.getManifest());
  store.dispatch(appActions.setManifest(tokenManifest));

  try {
    const cloudChainsDir = getCloudChainsDir();
    const cloudChainsSettingsDir = path.join(cloudChainsDir, 'settings');
    const ccExists = await fs.exists(cloudChainsDir);
    const ccSettingsExists = await fs.exists(cloudChainsSettingsDir);

    if(!ccExists || !ccSettingsExists) throw new Error('Cannot find CloudChains settings folder');

    const walletController = new WalletController(cloudChainsSettingsDir, tokenManifest);
    await walletController.initialize();

    const allWallets = walletController.getWallets()
      .map(w => new Wallet(w));

    let balances = Map();
    let transactions = Map();
    for(const wallet of allWallets) {
      const { ticker } = wallet;
      const [ total, spendable ] = await wallet.getBalance();
      balances = balances.set(ticker, [total, spendable]);
      let txs;
      try {
        txs = await wallet.getTransactions();
      } catch(err) {
        handleError(err);
        txs = [];
      }
      transactions = transactions.set(ticker, txs);
    }

    setInterval(async function() {
      for(const wallet of allWallets) {
        const { ticker } = wallet;
        const [ total, spendable ] = await wallet.getBalance();
        const prevBalances = store.getState().appState.balances;
        const [ prevTotal, prevSpendable ] = prevBalances.get(wallet.ticker);
        if(prevTotal !== total || prevSpendable !== spendable) {
          store.dispatch(appActions.setBalances(prevBalances.set(ticker, [total, spendable])));
        }
        let txs;
        try {
          txs = await wallet.getTransactions();
        } catch(err) {
          handleError(err);
          txs = [];
        }
        const prevTransactions = store.getState().appState.transactions;
        store.dispatch(appActions.setTransactions(prevTransactions.set(ticker, txs)));
      }
    }, 30000);

    const updateAltCurrencies = async function() {

      const multipliers = {};

      const innerAllWallets = [...allWallets];

      for(let i = 0; i < innerAllWallets.length; i++) {

        const wallet = innerAllWallets[i];
        const { ticker } = wallet;

        const conversionCurrencies = [
          ...Object.keys(altCurrencies),
          'BTC'
        ];

        const { body } = await request
          .get(`https://min-api.cryptocompare.com/data/price?fsym=${ticker}&tsyms=${conversionCurrencies.join(',')}`);

        for(const conversionCurrency of Object.keys(body)) {
          const multiplier = body[conversionCurrency];
          multipliers[ticker] = multipliers[ticker] || {};
          multipliers[ticker][conversionCurrency] = multiplier;
        }

      }
      domStorage.setItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS, JSON.stringify(multipliers));
      store.dispatch(appActions.setCurrencyMultipliers(multipliers));
    };

    setInterval(async function() {
      try {
        await updateAltCurrencies();
      } catch(err) {
        handleError(err);
      }
    }, 300000);

    {
      const currencyMultipliersJson = domStorage.getItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS);
      if(currencyMultipliersJson) {
        const currencyMultipliers = JSON.parse(currencyMultipliersJson);
        store.dispatch(appActions.setCurrencyMultipliers(currencyMultipliers));
        updateAltCurrencies()
          .catch(handleError);
      } else {
        await updateAltCurrencies();
      }
    }

    store.dispatch(appActions.setTransactions(transactions));
    store.dispatch(appActions.setBalances(balances));

    const sortedWallets = allWallets
      .sort(walletSorter(balances));

    store.dispatch(appActions.setWallets(sortedWallets));
    store.dispatch(appActions.setActiveWallet(sortedWallets[0].ticker));

  } catch(err) {
    handleError(err);
  }
})();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('js-main')
);
