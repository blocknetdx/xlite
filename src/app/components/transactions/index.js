import { connect } from 'react-redux';
import Transactions from './transactions';

export default connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers
  })
)(Transactions);
