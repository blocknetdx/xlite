import {Map as IMap} from 'immutable';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import escapeRegExp from 'lodash/escapeRegExp';
import PerfectScrollbar from 'react-perfect-scrollbar';
import * as appActions from '../../actions/app-actions';
import Localize from './localize';
import { activeViews, SIDEBAR_WIDTH } from '../../constants';
import { IconInput } from './inputs';
import Wallet from '../../types/wallet-r';
import { walletSorter } from '../../util';

const {api} = window;

const SidebarFilterableList = ({ placeholder, items, onClick = () => {} }) => {

  const [ filter, setFilter ] = useState('');
  const filterPatt = filter ? new RegExp(escapeRegExp(filter), 'i') : null;

  const filteredItems = items
    .filter(({ text }) => filterPatt ? filterPatt.test(text) : true);

  return (
    <div className={'lw-sidebar-filterable-list-container'}>
      <IconInput icon={'fas fa-search'} placeholder={placeholder} value={filter} onChange={setFilter} />
      {items.length > 0 && filteredItems.length === 0 ? <div><Localize context={'sidebar'}>No matches found.</Localize></div> : null}
      <PerfectScrollbar>
        {filteredItems
          .map(({ id, text, image }) => {
            return (
              <button className={'lw-sidebar-filterable-list-item'} key={id} onClick={() => onClick(id)}><img alt={Localize.text('Coin logo', 'sidebar')} srcSet={image} />{text}</button>
            );
          })}
      </PerfectScrollbar>
    </div>
  );
};
SidebarFilterableList.propTypes = {
  placeholder: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.object),
  onClick: PropTypes.func
};

const SidebarDivider = () => {
  return (
    <div className={'lw-sidebar-divider'} />
  );
};

const SidebarButton = ({ active = false, className = '', children, style = {}, onClick = () => {} }) => {
  return (
    <button className={`lw-sidebar-button ${className} ${active ? 'active' : ''}`} style={style} onClick={onClick}>{children}</button>
  );
};
SidebarButton.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.any,
  style: PropTypes.object,
  onClick: PropTypes.func
};

let Sidebar = ({ activeView, wallets, balances, showSettings, setActiveView, setActiveWallet, setCCWalletStarted, setShowSettings, showPreferencesModal, showSecurityModal, showBackupModal, showAboutModal }) => {

  const [ imageDir, setImageDir ] = useState('');

  useEffect(() => {
    api.general_getImageDir('').then(dir => {
      setImageDir(dir);
    });
  });

  const onLockClick = async function(e) {
    e.preventDefault();
    setCCWalletStarted(false);
  };

  const onDashboard = () => {
    if (activeView !== activeViews.DASHBOARD) {
      setActiveWallet('');
      setActiveView(activeViews.DASHBOARD);
    }
  };
  return (
    <div className={'lw-sidebar-container'} style={{width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, overflowY: 'hidden', flexWrap: 'nowrap', maxHeight: '100%'}}>

      <div className={`lw-sidebar-settings-panel ${showSettings ? '' : 'hidden'}`}>
        <SidebarButton onClick={() => setShowSettings(false)} style={{color: '#a4afb7'}}><img alt={Localize.text('Dashboard icon', 'sidebar')} srcSet={imageDir ? `${imageDir}/icons/icon-back.png, ${imageDir}/icons/icon-back@2x.png 2x` : null} /> <Localize context={'universal'}>Back</Localize></SidebarButton>
        <SidebarButton onClick={() => showPreferencesModal()}><i className={'fas fa-cog'} /> <Localize context={'sidebar'}>Preferences</Localize></SidebarButton>
        <SidebarButton onClick={() => showSecurityModal()}><i className={'fas fa-shield-alt'} /> <Localize context={'sidebar'}>Security</Localize></SidebarButton>
        <SidebarButton onClick={() => showBackupModal()}><i className={'fas fa-cloud-download-alt'} /> <Localize context={'sidebar'}>Backup</Localize></SidebarButton>
        <SidebarButton onClick={() => showAboutModal()}><i className={'fas fa-info-circle'} /> <Localize context={'sidebar'}>About</Localize></SidebarButton>
        <SidebarButton onClick={() => api.general_openUrl('https://docs.blocknet.co/')}><i className={'fas fa-question-circle'} /> <Localize context={'sidebar'}>Setup guides</Localize></SidebarButton>
      </div>

      <SidebarButton active={activeView === activeViews.DASHBOARD} onClick={onDashboard}><img alt={Localize.text('Dashboard icon', 'sidebar')} srcSet={imageDir ? `${imageDir}/icons/icon-home.png, ${imageDir}/icons/icon-home@2x.png 2x` : null} /> <Localize context={'sidebar'}>Dashboard</Localize></SidebarButton>
      <SidebarButton active={activeView === activeViews.PORTFOLIO} onClick={() => activeView !== activeViews.PORTFOLIO ? setActiveView(activeViews.PORTFOLIO) : null}><img alt={Localize.text('Portfolio icon', 'sidebar')} srcSet={imageDir ? `${imageDir}/icons/icon-wallet.png, ${imageDir}/icons/icon-wallet@2x.png 2x` : null} /> <Localize context={'sidebar'}>Portfolio</Localize></SidebarButton>
      <SidebarButton active={activeView === activeViews.TRANSACTIONS} onClick={() => activeView !== activeViews.TRANSACTIONS ? setActiveView(activeViews.TRANSACTIONS) : null}><img alt={Localize.text('Dashboard icon', 'sidebar')} srcSet={imageDir ? `${imageDir}/icons/icon-history.png, ${imageDir}/icons/icon-history@2x.png 2x` : null} /> <Localize context={'sidebar'}>Transactions</Localize></SidebarButton>
      <SidebarButton onClick={() => setShowSettings(true)}><img alt={Localize.text('Settings icon', 'sidebar')} srcSet={imageDir ? `${imageDir}/icons/icon-settings.png, ${imageDir}/icons/icon-settings@2x.png 2x` : null} /> <Localize context={'sidebar'}>Settings</Localize></SidebarButton>
      <SidebarButton onClick={onLockClick}><img alt={Localize.text('Lock icon', 'sidebar')} srcSet={imageDir ? `${imageDir}/icons/icon-lock-closed.png, ${imageDir}/icons/icon-lock-closed@2x.png 2x` : null} /> <Localize context={'sidebar'}>Lock Wallet</Localize></SidebarButton>
      <SidebarDivider />
      <SidebarFilterableList
        placeholder={Localize.text('Search assets', 'sidebar')}
        items={[...wallets]
          .sort(walletSorter(balances))
          .map(w => ({id: w.ticker, text: w.name, image: w.imagePath}))
        }
        onClick={ticker => {
          setActiveWallet(ticker);
          setActiveView(activeViews.COIN_TRANSACTIONS);
        }} />
    </div>
  );
};
Sidebar.propTypes = {
  activeView: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(IMap),
  showSettings: PropTypes.bool,
  setActiveView: PropTypes.func,
  setActiveWallet: PropTypes.func,
  setCCWalletStarted: PropTypes.func,
  setShowSettings: PropTypes.func,
  showPreferencesModal: PropTypes.func,
  showSecurityModal: PropTypes.func,
  showBackupModal: PropTypes.func,
  showAboutModal: PropTypes.func
};
Sidebar = connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    wallets: appState.wallets,
    balances: appState.balances,
    showSettings: appState.showSettings
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView)),
    setActiveWallet: activeWallet => dispatch(appActions.setActiveWallet(activeWallet)),
    setCCWalletStarted: ccWalletStarted => {
      if (ccWalletStarted)
        dispatch(appActions.setActiveView(activeViews.DASHBOARD));
      else
        dispatch(appActions.setActiveView(activeViews.LOGIN_REGISTER));
    },
    setShowSettings: show => dispatch(appActions.setShowSettings(show)),
    showPreferencesModal: () => dispatch(appActions.setShowPreferencesModal(true)),
    showSecurityModal: () => dispatch(appActions.setShowSecurityModal(true)),
    showBackupModal: () => dispatch(appActions.setShowBackupModal(true)),
    showAboutModal: () => dispatch(appActions.setShowAboutModal(true)),
  })
)(Sidebar);

export default Sidebar;
