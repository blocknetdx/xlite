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
 * @param manifest {TokenManifest}
 * @returns {{payload: {manifest: TokenManifest}, type: string}}
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

/**
 * @param balances {Map}
 * @returns {{payload: {balances: Map}, type: string}}
 */
export const setBalances = balances => ({
  type: actions.SET_BALANCES,
  payload: {
    balances
  }
});

/**
 * @param transactions {Map}
 * @returns {{payload: {transactions: Map}, type: string}}
 */
export const setTransactions = transactions => ({
  type: actions.SET_TRANSACTIONS,
  payload: {
    transactions
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowReceiveModal = show => ({
  type: actions.SET_SHOW_RECEIVE_MODAL,
  payload: {
    show
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowSendModal = show => ({
  type: actions.SET_SHOW_SEND_MODAL,
  payload: {
    show
  }
});

/**
 * @param multipliers Object
 * @returns {{payload: {multipliers: Object}, type: string}}
 */
export const setCurrencyMultipliers = multipliers => ({
  type: actions.SET_CURRENCY_MULTIPLIERS,
  payload: {
    multipliers
  }
});

/**
 * @param cloudChains {CloudChains}
 * @returns {{payload: {cloudChains: CloudChains}, type: string}}
 */
export const setCloudChains = cloudChains => ({
  type: actions.SET_CLOUDCHAINS,
  payload: {
    cloudChains
  }
});

/**
 * @param startupInit {function}
 * @returns {{payload: {startupInit: function}, type: string}}
 */
export const setStartupInitializer = startupInit => ({
  type: actions.SET_STARTUP_INIT,
  payload: {
    startupInit
  }
});
