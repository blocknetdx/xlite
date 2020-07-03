import './modules/window-zoom-handlers';
import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore } from 'redux';
import { Provider } from 'react-redux';
import isDev from 'electron-is-dev';
import * as appActions from './actions/app-actions';
import appReducer from './reducers/app-reducer';
import App from './components/app';
import { handleError, logger } from './util';
import ConfController from './modules/conf-controller';
import domStorage from './modules/dom-storage';
import { localStorageKeys } from './constants';

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

const confController = new ConfController();
confController.getLatest()
  .then(data => {
    // Only returns data when there is updated data
    if(!data) return;
    const {
      manifestData,
      xbridgeConfs,
      manifest,
      walletConfs,
      manifestSha
    } = data;
    domStorage.setItems({
      [localStorageKeys.MANIFEST]: manifest,
      [localStorageKeys.MANIFEST_DATA]: manifestData,
      [localStorageKeys.XBRIDGE_CONFS]: xbridgeConfs,
      [localStorageKeys.WALLET_CONFS]: walletConfs,
      [localStorageKeys.MANIFEST_SHA]: manifestSha
    });
    store.dispatch(appActions.setManifest(manifest));
    logger.info(`Downloaded updated manifest, wallet, and xbridge confs. Manifest SHA: ${manifestSha}`);
  })
  .catch(handleError);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('js-main')
);
