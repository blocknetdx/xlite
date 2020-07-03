import './modules/window-zoom-handlers';
import fs from 'fs-extra';
import path from 'path';
import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import isDev from 'electron-is-dev';
import * as appActions from './actions/app-actions';
import appReducer from './reducers/app-reducer';
import App from './components/app';
import { convertManifestToMap, getCloudChainsDir, handleError, logger } from './util';
import ConfController from './modules/conf-controller';
import domStorage from './modules/dom-storage';
import { localStorageKeys } from './constants';
import WalletController from './modules/wallet-controller';

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

(async function() {
  try {
    const confController = new ConfController();
    let data;
    // We don't want to stop the app from loading if there is a problem fetching
    // the new manifest data. So, we wrap it in its own try/catch
    try {
      data = await confController.getLatest();
    } catch(err) {
      handleError(err);
    }
    let manifestArr;
    if(data) {
      const {
        manifestData,
        xbridgeConfs,
        manifest: newManifest,
        walletConfs,
        manifestSha
      } = data;
      domStorage.setItems({
        [localStorageKeys.MANIFEST]: newManifest,
        [localStorageKeys.MANIFEST_DATA]: manifestData,
        [localStorageKeys.XBRIDGE_CONFS]: xbridgeConfs,
        [localStorageKeys.WALLET_CONFS]: walletConfs,
        [localStorageKeys.MANIFEST_SHA]: manifestSha
      });
      logger.info(`Downloaded updated manifest, wallet, and xbridge confs. Manifest SHA: ${manifestSha}`);
      manifestArr = newManifest;
    } else {
      manifestArr = domStorage.getItem(localStorageKeys.MANIFEST);
    }
    const manifest = convertManifestToMap(manifestArr);
    store.dispatch(appActions.setManifest(manifest));

    const cloudChainsDir = getCloudChainsDir();
    const cloudChainsSettingsDir = path.join(cloudChainsDir, 'settings');
    const ccExists = await fs.exists(cloudChainsDir);
    const ccSettingsExists = await fs.exists(cloudChainsSettingsDir);

    if(!ccExists || !ccSettingsExists) throw new Error('Cannot find CloudChains settings folder');

    const walletController = new WalletController(cloudChainsSettingsDir, manifest);
    await walletController.initialize();

    const allWallets = walletController.getWallets();
    const enabledWallets = walletController.getEnabledWallets();

    console.log('allWallets', allWallets);
    console.log('enabledWallets', enabledWallets);

    for(const w of enabledWallets) {
      const res = await w.rpc.getInfo();
      console.log(res);
    }

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
