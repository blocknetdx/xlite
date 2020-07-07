import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import escapeRegExp from 'lodash/escapeRegExp';
import PerfectScrollbar from 'react-perfect-scrollbar';
import * as appActions from '../../actions/app-actions';
import Localize from './localize';
import { activeViews } from '../../constants';
import { IconInput } from './inputs';
import Wallet from '../../types/wallet';

const SidebarFilterableList = ({ placeholder, items, onClick = () => {} }) => {

  const [ filter, setFilter ] = useState('');
  const filterPatt = filter ? new RegExp(escapeRegExp(filter), 'i') : null;

  return (
    <div className={'lw-sidebar-filterable-list-container'}>
      <IconInput icon={'fas fa-search'} placeholder={placeholder} value={filter} onChange={setFilter} />
      <PerfectScrollbar>
        {items
          .filter(({ text }) => filterPatt ? filterPatt.test(text) : true)
          .map(({ id, text, image }) => {
            return (
              <button className={'lw-sidebar-filterable-list-item'} key={id} onClick={() => onClick(id)}><img alt={Localize.text('Coin logo', 'sidebar')} src={image} />{text}</button>
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

let Sidebar = ({ activeView, wallets, setActiveView, setActiveWallet }) => {
  return (
    <div className={'lw-sidebar-container'} style={{overflowY: 'hidden', flexWrap: 'nowrap', maxHeight: '100%'}}>
      <SidebarButton active={activeView === activeViews.DASHBOARD} onClick={() => activeView !== activeViews.DASHBOARD ? setActiveView(activeViews.DASHBOARD) : null}><i className={'fas fa-home'} /> <Localize context={'sidebar'}>Dashboard</Localize></SidebarButton>
      <SidebarButton active={activeView === activeViews.PORTFOLIO} onClick={() => activeView !== activeViews.PORTFOLIO ? setActiveView(activeViews.PORTFOLIO) : null}><i className={'fas fa-dollar-sign'} /> <Localize context={'sidebar'}>Portfolio</Localize></SidebarButton>
      <SidebarButton active={activeView === activeViews.TRANSACTIONS} onClick={() => activeView !== activeViews.TRANSACTIONS ? setActiveView(activeViews.TRANSACTIONS) : null}><i className={'fas fa-history'} /> <Localize context={'sidebar'}>Transactions</Localize></SidebarButton>
      <SidebarDivider />
      <SidebarFilterableList
        placeholder={Localize.text('Search assets', 'sidebar')}
        items={wallets.map(w => ({id: w.ticker, text: `${w.name} (${w.ticker})`, image: w.imagePath}))}
        onClick={ticker => setActiveWallet(ticker)} />
    </div>
  );
};
Sidebar.propTypes = {
  activeView: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  setActiveView: PropTypes.func,
  setActiveWallet: PropTypes.func
};
Sidebar = connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    wallets: appState.wallets
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView)),
    setActiveWallet: activeWallet => dispatch(appActions.setActiveWallet(activeWallet))
  })
)(Sidebar);

export default Sidebar;
