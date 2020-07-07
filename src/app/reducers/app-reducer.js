import { actions, activeViews } from '../constants';
import { Map } from 'immutable';

const getInitialState = () => ({
  activeView: activeViews.DASHBOARD,
  windowHeight: window.innerHeight,
  windowWidth: window.innerWidth,
  manifest: Map(),
  wallets: [],
  activeWallet: ''
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
    default:
      return state;
  }
};
