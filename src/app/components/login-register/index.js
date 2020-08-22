import * as appActions from '../../actions/app-actions';
import {activeViews} from '../../constants';
import LoginRegister from './login-register';

import { connect } from 'react-redux';

export default connect(
  ({ appState }) => ({
    cloudChains: appState.cloudChains,
    startupInit: appState.startupInit,
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView)),
    setCCWalletStarted: ccWalletStarted => {
      if (ccWalletStarted)
        dispatch(appActions.setActiveView(activeViews.DASHBOARD));
      else
        dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
    }
  })
)(LoginRegister);
