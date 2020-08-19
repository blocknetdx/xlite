import { Map } from 'immutable';
import path from 'path';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import escapeRegExp from 'lodash/escapeRegExp';
import PerfectScrollbar from 'react-perfect-scrollbar';
import * as appActions from '../../actions/app-actions';
import Localize from './localize';
import { activeViews, IMAGE_DIR } from '../../constants';
import { IconInput } from './inputs';
import Wallet from '../../types/wallet';
import { walletSorter } from '../../util';
import CloudChains from '../../modules/cloudchains';

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

const SidebarButton = ({ active = false, children, onClick = () => {} }) => {
  return (
    <button className={`lw-sidebar-button ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>
  );
};
SidebarButton.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.any,
  onClick: PropTypes.func
};

const iconsDir = path.join(IMAGE_DIR, 'icons');

let Sidebar = ({ activeView, cloudChains, wallets, balances, setActiveView, setActiveWallet, setCCWalletStarted }) => {

  const onLockClick = async function(e) {
    e.preventDefault();
    cloudChains.stopSPV();
    setCCWalletStarted(false);
  };

  return (
    <div className={'lw-sidebar-container'} style={{overflowY: 'hidden', flexWrap: 'nowrap', maxHeight: '100%'}}>
      <SidebarButton active={activeView === activeViews.DASHBOARD} onClick={() => activeView !== activeViews.DASHBOARD ? setActiveView(activeViews.DASHBOARD) : null}><img alt={Localize.text('Dashboard icon', 'sidebar')} srcSet={`${path.join(iconsDir, 'icon-home.png')}, ${path.join(iconsDir, 'icon-home@2x.png')} 2x`} /> <Localize context={'sidebar'}>Dashboard</Localize></SidebarButton>
      <SidebarButton active={activeView === activeViews.PORTFOLIO} onClick={() => activeView !== activeViews.PORTFOLIO ? setActiveView(activeViews.PORTFOLIO) : null}><img alt={Localize.text('Portfolio icon', 'sidebar')} srcSet={`${path.join(iconsDir, 'icon-wallet.png')}, ${path.join(iconsDir, 'icon-wallet@2x.png')} 2x`} /> <Localize context={'sidebar'}>Portfolio</Localize></SidebarButton>
      <SidebarButton active={activeView === activeViews.TRANSACTIONS} onClick={() => activeView !== activeViews.TRANSACTIONS ? setActiveView(activeViews.TRANSACTIONS) : null}><img alt={Localize.text('Dashboard icon', 'sidebar')} srcSet={`${path.join(iconsDir, 'icon-history.png')}, ${path.join(iconsDir, 'icon-history@2x.png')} 2x`} /> <Localize context={'sidebar'}>Transactions</Localize></SidebarButton>
      <SidebarButton><img alt={Localize.text('Settings icon', 'sidebar')} srcSet={`${path.join(iconsDir, 'icon-settings.png')}, ${path.join(iconsDir, 'icon-settings@2x.png')} 2x`} /> <Localize context={'sidebar'}>Settings</Localize></SidebarButton>
      <SidebarButton onClick={onLockClick}><img alt={Localize.text('Lock icon', 'sidebar')} srcSet={`${path.join(iconsDir, 'icon-lock-closed.png')}, ${path.join(iconsDir, 'icon-lock-closed@2x.png')} 2x`} /> <Localize context={'sidebar'}>Lock Wallet</Localize></SidebarButton>
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
  cloudChains: PropTypes.instanceOf(CloudChains),
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(Map),
  setActiveView: PropTypes.func,
  setActiveWallet: PropTypes.func,
  setCCWalletStarted: PropTypes.func
};
Sidebar = connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    cloudChains: appState.cloudChains,
    wallets: appState.wallets,
    balances: appState.balances
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView)),
    setActiveWallet: activeWallet => dispatch(appActions.setActiveWallet(activeWallet)),
    setCCWalletStarted: ccWalletStarted => dispatch(appActions.setCCWalletStarted(ccWalletStarted))
  })
)(Sidebar);

export default Sidebar;
