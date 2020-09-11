import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { connect, useStore } from 'react-redux';
import * as appActions from '../../actions/app-actions';
import WalletController from '../../modules/wallet-controller-r';
import PanelFilters from './button-filters';
import { SquareButton } from './buttons';
import { transactionFilters } from '../../constants';

let TransactionsPanelHeader = ({ selectedFilter, onTransactionFilter, walletController }) => {

  const store = useStore();
  const [transactionFilter, setTransactionFilter] = useState(selectedFilter || transactionFilters.all);

  const onRefreshButton = () => {
    walletController.updateAllBalances()
      .then(() => {
        walletController.dispatchBalances(appActions.setBalances, store);
        walletController.dispatchTransactions(appActions.setTransactions, store);
      });
  };

  const onFilterButton = () => {
    // ToDo: Implement single filter button action
  };

  return (
    <div className={'lw-transactions-panel-header'}>
      <div className={'lw-transactions-panel-header-title'}>
        <h1>Latest Transactions</h1>
        <i className={'fas fa-undo fa-flip-horizontal'} onClick={onRefreshButton} />
      </div>
      <div className={'lw-transactions-panel-header-filters'}>
        <div className={'lw-transactions-panel-text'}>Show:</div>
        <PanelFilters
          selectedFilter={transactionFilters[transactionFilter.toLowerCase()]}
          filters={Object.values(transactionFilters).map(key => key)}
          onFilterSelected={onTransactionFilter}
        />
        <SquareButton title={'Filter'} icon={'fas fa-filter'} onClick={onFilterButton} />
      </div>
    </div>
  );
};

TransactionsPanelHeader.propTypes = {
  selectedFilter: PropTypes.string,
  onTransactionFilter: PropTypes.func,
  walletController: PropTypes.instanceOf(WalletController)
};

TransactionsPanelHeader = connect(
  ({ appState }) => ({
    walletController: appState.walletController,
  })
)(TransactionsPanelHeader);

export default TransactionsPanelHeader;
