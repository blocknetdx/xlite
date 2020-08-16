import { connect } from 'react-redux';
import LoginRegister from './login-register';
import { setActiveView, setCCWalletStarted } from '../../actions/app-actions';

export default connect(
  ({ appState }) => ({
    cloudChains: appState.cloudChains,
    ccWalletCreated: appState.ccWalletCreated
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(setActiveView(activeView)),
    setCCWalletStarted: ccWalletStarted => dispatch(setCCWalletStarted(ccWalletStarted))
  })
)(LoginRegister);
