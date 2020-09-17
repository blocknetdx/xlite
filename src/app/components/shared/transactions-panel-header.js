import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { connect, useStore } from 'react-redux';
import * as appActions from '../../actions/app-actions';
import WalletController from '../../modules/wallet-controller-r';
import Wallet from '../../types/wallet-r';
import PanelFilters from './button-filters';
import FilterMenu from './filter-menu';
import { SquareButton } from './buttons';
import {activeViews, transactionFilters} from '../../constants';
import { publicPath } from '../../util/public-path-r';
import {walletSorter} from '../../util';
import {Map as IMap} from 'immutable';
import Localize from './localize';

let TransactionsPanelHeader = ({ selectedFilter, onTransactionFilter, walletController, wallets, balances, setActiveView, setActiveWallet, activeView }) => {

  const store = useStore();
  const [transactionFilter] = useState(selectedFilter || transactionFilters.all);
  const [filterMenuActive, setFilterMenuActive] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);

  const onRefreshButton = () => {
    walletController.updateAllBalances()
      .then(() => {
        walletController.dispatchBalances(appActions.setBalances, store);
        walletController.dispatchTransactions(appActions.setTransactions, store);
      });
  };

  const onFilterButton = () => {
    setFilterMenuActive(!filterMenuActive);
  };

  const onFilterMenuClick = ticker => {
    setSelectedTicker(ticker);
    setFilterMenuActive(false);
    setActiveWallet(ticker);
    setActiveView(activeViews.COIN_TRANSACTIONS);
  };

  const isCoinTransactions = activeView === activeViews.COIN_TRANSACTIONS;
  const wallet = selectedTicker ? wallets.find(w => w.ticker === selectedTicker) : null;
  const headerTitle = isCoinTransactions && wallet ? `Latest ${wallet.name} Transactions` : 'Latest Transactions';

  return (
    <div className={'lw-transactions-panel-header'}>
      <div className={'lw-transactions-panel-header-title'}>
        <h1>{headerTitle}</h1>
        <i className={'fas fa-undo fa-flip-horizontal'} onClick={onRefreshButton} />
      </div>
      <div className={'lw-transactions-panel-header-filters'}>
        <div className={'lw-transactions-panel-text'}>Show:</div>
        <PanelFilters
          selectedFilter={transactionFilters[transactionFilter.toLowerCase()]}
          filters={Object.values(transactionFilters).map(key => key)}
          onFilterSelected={onTransactionFilter}
        />
        <SquareButton title={Localize.text('Filter', 'transactions-panel-header')} image={`${publicPath}/images/icons/icon-filter.svg`} active={filterMenuActive} onClick={onFilterButton} />
      </div>
      <FilterMenu
        items={[...wallets]
        .sort(walletSorter(balances))
        .map(w => ({id: w.ticker, text: w.name, image: w.imagePath}))
        }
        active={filterMenuActive}
        onClick={onFilterMenuClick}
      />
    </div>
  );
};

TransactionsPanelHeader.propTypes = {
  selectedFilter: PropTypes.string,
  onTransactionFilter: PropTypes.func,
  walletController: PropTypes.instanceOf(WalletController),
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(IMap),
  setActiveView: PropTypes.func,
  setActiveWallet: PropTypes.func,
  activeView: PropTypes.string
};

TransactionsPanelHeader = connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    balances: appState.balances,
    wallets: appState.wallets,
    walletController: appState.walletController,
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView)),
    setActiveWallet: activeWallet => dispatch(appActions.setActiveWallet(activeWallet)),
  })
)(TransactionsPanelHeader);

export default TransactionsPanelHeader;
