import React, {useState} from 'react';
import PropTypes from 'prop-types';
import PanelFilters from './button-filters';
import { transactionFilters } from '../../constants';

const TransactionsPanelHeader = ({ selectedFilter }) => {

  const [transactionFilter, setTransactionFilter] = useState(selectedFilter || transactionFilters.all);

  return (
    <div className={'lw-transactions-panel-header'}>
      <div className={'lw-transactions-panel-header-title'}>
        <h1>Latest Transactions</h1>
        <i className={'fas fa-undo fa-flip-horizontal'} />
      </div>
      <div className={'lw-transactions-panel-header-filters'}>
        <div className={'lw-transactions-panel-text'}>Show:</div>
        <PanelFilters
          selectedFilter={transactionFilters[transactionFilter.toLowerCase()]}
          filters={Object.values(transactionFilters).map(key => key)}
          onFilterSelected={setTransactionFilter}
        />
      </div>
    </div>
  );
};

TransactionsPanelHeader.propTypes = {
  selectedFilter: PropTypes.string
};

export default TransactionsPanelHeader;
