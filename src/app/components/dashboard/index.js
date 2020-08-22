import { connect } from 'react-redux';
import Dashboard from './dashboard';

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    wallets: appState.wallets,
    windowWidth: appState.windowWidth
  })
)(Dashboard);
