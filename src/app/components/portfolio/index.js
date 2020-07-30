import { connect } from 'react-redux';
import Portfolio from './portfolio';

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers,
    wallets: appState.wallets
  })
)(Portfolio);
