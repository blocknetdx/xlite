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
import WalletController from '../modules/wallet-controller-r';

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AboutModal from './shared/modal-about';
import SecurityModal from './shared/modal-security';
import PreferencesModal from './shared/modal-preferences';
import BackupModal from './shared/modal-backup';
import GuidesModal from './shared/modal-guides';
import WindowsDownloadLibraryModal from './shared/modal-windows-library-download';

let App = ({ activeView, windowWidth, windowHeight, showReceiveModal, showSendModal, showPreferencesModal, showSecurityModal, showBackupModal, showAboutModal, showGuidesModal, showWindowsLibraryDownloadModal, walletController }) => {

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
      overflowY: 'hidden',
      overflowX: 'hidden',
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
      {showPreferencesModal ? <PreferencesModal /> : null}
      {showSecurityModal ? <SecurityModal /> : null}
      {showBackupModal ? <BackupModal /> : null}
      {showAboutModal ? <AboutModal /> : null}
      {showGuidesModal ? <GuidesModal /> : null}
      {showWindowsLibraryDownloadModal ? <WindowsDownloadLibraryModal /> : null}
    </div>
  );
};
App.propTypes = {
  showReceiveModal: PropTypes.bool,
  showSendModal: PropTypes.bool,
  windowWidth: PropTypes.number,
  windowHeight: PropTypes.number,
  activeView: PropTypes.string,
  showPreferencesModal: PropTypes.bool,
  showSecurityModal: PropTypes.bool,
  showBackupModal: PropTypes.bool,
  showAboutModal: PropTypes.bool,
  showGuidesModal: PropTypes.bool,
  showWindowsLibraryDownloadModal: PropTypes.bool,
  walletController: PropTypes.instanceOf(WalletController),
};
App = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    windowHeight: appState.windowHeight,
    activeView: appState.activeView,
    showReceiveModal: appState.showReceiveModal,
    showSendModal: appState.showSendModal,
    showPreferencesModal: appState.showPreferencesModal,
    showSecurityModal: appState.showSecurityModal,
    showBackupModal: appState.showBackupModal,
    showAboutModal: appState.showAboutModal,
    showGuidesModal: appState.showGuidesModal,
    showWindowsLibraryDownloadModal: appState.showWindowsLibraryDownloadModal,
    walletController: appState.walletController,
  })
)(App);

export default App;
