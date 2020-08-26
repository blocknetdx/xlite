import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { activeViews } from '../constants';
import Login from './login-register';
import Dashboard from './dashboard';
import { Navbar } from './shared/navbar';
import Sidebar from './shared/sidebar';
import Transactions from './transactions';
import ReceiveModal from './shared/modal-receive';
import SendModal from './shared/modal-send';
import Portfolio from './portfolio';
import Spinner from './shared/spinner';

let App = ({ activeView, windowWidth, windowHeight, showReceiveModal, showSendModal }) => {

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

  switch(activeView) {
    case activeViews.LOGIN_REGISTER:
      body = <Login />;
      showNavbar = false;
      break;
    case activeViews.DASHBOARD:
      body = <Dashboard />;
      break;
    case activeViews.TRANSACTIONS:
      body = <Transactions />;
      break;
    case activeViews.COIN_TRANSACTIONS:
      body = <Transactions />;
      break;
    case activeViews.PORTFOLIO:
      body = <Portfolio />;
      break;
    default:
      body = <div className={'lw-loading-spinner'}><Spinner style={{'font-size': '5em'}} /></div>;
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
};
App = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    windowHeight: appState.windowHeight,
    activeView: appState.activeView,
    showReceiveModal: appState.showReceiveModal,
    showSendModal: appState.showSendModal
  })
)(App);

export default App;
