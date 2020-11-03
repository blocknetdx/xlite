// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { actions, altCurrencies, MIN_UI_HEIGHT, MIN_UI_WIDTH } from '../constants';
import { Map } from 'immutable';
import TokenManifest from '../modules/token-manifest';

const getInitialState = () => ({
  cloudChains: null,
  startupInit: null,
  ccWalletStarted: false,
  activeView: '',
  currencyMultipliers: {},
  windowHeight: window.innerHeight < MIN_UI_HEIGHT ? MIN_UI_HEIGHT : window.innerHeight,
  windowWidth: window.innerWidth < MIN_UI_WIDTH ? MIN_UI_WIDTH : window.innerWidth,
  manifest: new TokenManifest([], []),
  pricing: Map(),
  pricingController: null,
  wallets: [],
  activeWallet: '',
  altCurrency: altCurrencies.USD,
  balances: Map(),
  transactions: Map(),
  showReceiveModal: false,
  showSendModal: false,
  walletController: null,
  showSettings: false,
  showPreferencesModal: false,
  showSecurityModal: false,
  showBackupModal: false,
  showAboutModal: false,
  showGuidesModal: false,
  showWindowsLibraryDownloadModal: false,
  xVaultVersion: '',
  ccVersion: '',
  openExternalLinks: false,
  loadingTransactions: true,
});

export default (state = getInitialState(), { type, payload }) => {
  switch(type) {
    case actions.SET_WINDOW_SIZE:
      return {
        ...state,
        windowWidth: payload.width,
        windowHeight: payload.height
      };
    case actions.SET_MANIFEST:
      return {
        ...state,
        manifest: payload.manifest
      };
    case actions.SET_ACTIVE_VIEW:
      return {
        ...state,
        activeView: payload.activeView
      };
    case actions.SET_WALLETS:
      return {
        ...state,
        wallets: payload.wallets
      };
    case actions.SET_ACTIVE_WALLET:
      return {
        ...state,
        activeWallet: payload.activeWallet
      };
    case actions.SET_BALANCES:
      return {
        ...state,
        balances: payload.balances
      };
    case actions.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: payload.transactions
      };
    case actions.SET_SHOW_RECEIVE_MODAL:
      return {
        ...state,
        showReceiveModal: payload.show
      };
    case actions.SET_SHOW_SEND_MODAL:
      return {
        ...state,
        showSendModal: payload.show
      };
    case actions.SET_CURRENCY_MULTIPLIERS:
      return {
        ...state,
        currencyMultipliers: payload.multipliers
      };
    case actions.SET_CLOUDCHAINS:
      return {
        ...state,
        cloudChains: payload.cloudChains
      };
    case actions.SET_STARTUP_INIT:
      return {
        ...state,
        startupInit: payload.startupInit
      };
    case actions.SET_WALLET_CONTROLLER:
      return {
        ...state,
        walletController: payload.walletController
      };
    case actions.SET_SHOW_SETTINGS:
      return {
        ...state,
        showSettings: payload.show
      };
    case actions.SET_SHOW_PREFERENCES_MODAL:
      return {
        ...state,
        showPreferencesModal: payload.show
      };
    case actions.SET_SHOW_SECURITY_MODAL:
      return {
        ...state,
        showSecurityModal: payload.show
      };
    case actions.SET_SHOW_BACKUP_MODAL:
      return {
        ...state,
        showBackupModal: payload.show
      };
    case actions.SET_SHOW_GUIDES_MODAL:
      return {
        ...state,
        showGuidesModal: payload.show
      };
    case actions.SET_SHOW_ABOUT_MODAL:
      return {
        ...state,
        showAboutModal: payload.show
      };
    case actions.SET_XVAULT_VERSION:
      return {
        ...state,
        xVaultVersion: payload.version
      };
    case actions.SET_CC_VERSION:
      return {
        ...state,
        ccVersion: payload.version
      };
    case actions.SET_ALT_CURRENCY:
      return {
        ...state,
        altCurrency: payload.altCurrency
      };
    case actions.SET_PRICING:
      return {
        ...state,
        pricing: payload.pricing
      };
    case actions.SET_PRICING_CONTROLLER:
      return {
        ...state,
        pricingController: payload.pricingController
      };
    case actions.SET_SHOW_WINDOWS_LIBRARY_DOWNLOAD_MODAL:
      return {
        ...state,
        showWindowsLibraryDownloadModal: payload.show
      };
    case actions.SET_LOADING_TRANSACTIONS:
      return {
        ...state,
        loadingTransactions: payload.loadingTransactions
      };
    default:
      return state;
  }
};
