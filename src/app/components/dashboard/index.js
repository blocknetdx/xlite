import { connect } from 'react-redux';
import Dashboard from './dashboard';

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    wallets: appState.wallets,
    windowHeight: appState.windowHeight,
    windowWidth: appState.windowWidth,
    altCurrency: appState.altCurrency,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers,
  })
)(Dashboard);
