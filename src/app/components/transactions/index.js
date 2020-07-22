import { connect } from 'react-redux';
import Transactions from './transactions';

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    transactions: appState.transactions
  })
)(Transactions);
