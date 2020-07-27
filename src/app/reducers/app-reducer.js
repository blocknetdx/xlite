import { actions, activeViews, altCurrencies } from '../constants';
import { Map } from 'immutable';

const getInitialState = () => ({
  activeView: activeViews.TRANSACTIONS,
  currencyMultipliers: {},
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth,
  manifest: Map(),
  wallets: [],
  activeWallet: '',
  altCurrency: altCurrencies.USD,
  balances: Map(),
  transactions: Map(),
  showReceiveModal: false,
  showSendModal: false
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
    default:
      return state;
  }
};
