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

/**
 * @param walletController {WalletController}
 * @returns {{payload: {walletController: WalletController}, type: string}}
 */
export const setWalletController = walletController => ({
  type: actions.SET_WALLET_CONTROLLER,
  payload: {
    walletController
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowSettings = show => ({
  type: actions.SET_SHOW_SETTINGS,
  payload: {
    show
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowPreferencesModal = show => ({
  type: actions.SET_SHOW_PREFERENCES_MODAL,
  payload: {
    show
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowSecurityModal = show => ({
  type: actions.SET_SHOW_SECURITY_MODAL,
  payload: {
    show
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowBackupModal = show => ({
  type: actions.SET_SHOW_BACKUP_MODAL,
  payload: {
    show
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowAboutModal = show => ({
  type: actions.SET_SHOW_ABOUT_MODAL,
  payload: {
    show
  }
});

/**
 * @param version {string}
 * @returns {{payload: {version: string}, type: string}}
 */
export const setAppVersion = version => ({
  type: actions.SET_XVAULT_VERSION,
  payload: {
    version
  }
});

/**
 * @param version {string}
 * @returns {{payload: {version: string}, type: string}}
 */
export const setCCVersion = version => ({
  type: actions.SET_CC_VERSION,
  payload: {
    version
  }
});

/**
 * @param version {string}
 * @returns {{payload: {version: string}, type: string}}
 */
export const setAltCurrency = altCurrency => ({
  type: actions.SET_ALT_CURRENCY,
  payload: {
    altCurrency
  }
});

/**
 * @param pricing {Map<{string}, {PriceData[]}>}
 * @returns {{payload: {pricing: Map<{string}, {PriceData[]}>}, type: string}}
 */
export const setPricing = pricing => ({
  type: actions.SET_PRICING,
  payload: {
    pricing
  }
});

/**
 * @param pricingController {Pricing}
 * @returns {{payload: {pricingController: Pricing}, type: string}}
 */
export const setPricingController = pricingController => ({
  type: actions.SET_PRICING_CONTROLLER,
  payload: {
    pricingController
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowGuidesModal = show => ({
  type: actions.SET_SHOW_GUIDES_MODAL,
  payload: {
    show
  }
});

/**
 * @param show {boolean}
 * @returns {{payload: {show: boolean}, type: string}}
 */
export const setShowWindowsLibraryDownloadModal = show => ({
  type: actions.SET_SHOW_WINDOWS_LIBRARY_DOWNLOAD_MODAL,
  payload: {
    show
  }
});
