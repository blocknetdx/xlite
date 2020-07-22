import { actions, activeViews } from '../constants';
import { Map } from 'immutable';

const getInitialState = () => ({
  activeView: activeViews.TRANSACTIONS,
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth,
  manifest: Map(),
  wallets: [],
  activeWallet: '',
  balances: Map(),
  transactions: Map()
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
    default:
      return state;
  }
};
