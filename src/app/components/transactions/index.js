import { connect } from 'react-redux';
import Transactions from './transactions';

export default connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    activeWallet: appState.activeWallet,
    transactions: appState.transactions,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
    wallets: appState.wallets
  })
)(Transactions);
