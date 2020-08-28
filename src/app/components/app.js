import { activeViews } from '../constants';
import Dashboard from './dashboard';
import Login from './login-register';
import { Navbar } from './shared/navbar';
import Portfolio from './portfolio';
import ReceiveModal from './shared/modal-receive';
import SendModal from './shared/modal-send';
import Sidebar from './shared/sidebar';
import Spinner from './shared/spinner';
import Transactions from './transactions';
import WalletController from '../modules/wallet-controller';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

let App = ({ activeView, windowWidth, windowHeight, showReceiveModal, showSendModal, walletController }) => {

  const styles = {
    container: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      width: windowWidth,
      maxWidth: windowWidth,
      height: windowHeight,
      maxHeight: windowHeight,
      minHeight: 0
    },
    bodyContainer: {
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      minHeight: 0,
      overflowY: 'hidden'
    },
    innerBodyContainer: {
      flexGrow: 1,
      minHeight: 0,
      position: 'relative'
    }
  };

  let body;

  let showNavbar = true;
  const balanceOverTime = walletController ? walletController.getBalanceOverTime.bind(walletController) : () => [[0, 0]];

  switch(activeView) {
    case activeViews.LOGIN_REGISTER:
      body = <Login />;
      showNavbar = false;
      break;
    case activeViews.DASHBOARD:
      body = <Dashboard balanceOverTime={balanceOverTime} />;
      break;
    case activeViews.TRANSACTIONS:
      body = <Transactions />;
      break;
    case activeViews.COIN_TRANSACTIONS:
      body = <Transactions />;
      break;
    case activeViews.PORTFOLIO:
      body = <Portfolio balanceOverTime={balanceOverTime} />;
      break;
    default:
      body = <div className={'lw-loading-spinner'}><Spinner style={{fontSize: '5em'}} /></div>;
      showNavbar = false;
  }

  return (
    <div style={styles.container}>
      {showNavbar ? <Navbar /> : null}
      <div style={styles.bodyContainer}>
        {showNavbar ? <Sidebar /> : null}
        <div style={styles.innerBodyContainer}>
          {body}
        </div>
      </div>
      {showReceiveModal ? <ReceiveModal /> : null}
      {showSendModal ? <SendModal /> : null}
    </div>
  );
};
App.propTypes = {
  showReceiveModal: PropTypes.bool,
  showSendModal: PropTypes.bool,
  windowWidth: PropTypes.number,
  windowHeight: PropTypes.number,
  activeView: PropTypes.string,
  walletController: PropTypes.instanceOf(WalletController),
};
App = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    windowHeight: appState.windowHeight,
    activeView: appState.activeView,
    showReceiveModal: appState.showReceiveModal,
    showSendModal: appState.showSendModal,
    walletController: appState.walletController,
  })
)(App);

export default App;
