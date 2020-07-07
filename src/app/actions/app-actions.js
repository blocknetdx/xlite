import { actions } from '../constants';

/**
 * @param width {number}
 * @param height {number}
 * @returns {{payload: {width: number, height: number}, type: string}}
 */
export const setWindowSize = (width, height) => ({
  type: actions.SET_WINDOW_SIZE,
  payload: {
    width,
    height,
  },
});

/**
 * @param manifest {Map}
 * @returns {{payload: {manifest: Map}, type: string}}
 */
export const setManifest = manifest => ({
  type: actions.SET_MANIFEST,
  payload: {
    manifest
  }
});

/**
 * @param activeView {string}
 * @returns {{payload: {activeView: string}, type: string}}
 */
export const setActiveView = activeView => ({
  type: actions.SET_ACTIVE_VIEW,
  payload: {
    activeView
  }
});

/**
 * @param wallets {Object[]}
 * @returns {{payload: {wallets: Object[]}, type: string}}
 */
export const setWallets = wallets => ({
  type: actions.SET_WALLETS,
  payload: {
    wallets
  }
});

/**
 * @param activeWallet {string}
 * @returns {{payload: {activeWallet: string}, type: string}}
 */
export const setActiveWallet = activeWallet => ({
  type: actions.SET_ACTIVE_WALLET,
  payload: {
    activeWallet
  }
});
