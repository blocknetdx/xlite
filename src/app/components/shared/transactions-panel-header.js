import React, {useState} from 'react';
import PropTypes from 'prop-types';
import PanelFilters from './button-filters';
import { SquareButton } from './buttons';
import { transactionFilters } from '../../constants';

const TransactionsPanelHeader = ({ selectedFilter }) => {

  const [transactionFilter, setTransactionFilter] = useState(selectedFilter || transactionFilters.all);

  const onReloadButton = () => {
    // ToDo: Implement reload transactions action
  };

  const onFilterButton = () => {
    // ToDo: Implement single filter button action
  };

  return (
    <div className={'lw-transactions-panel-header'}>
      <div className={'lw-transactions-panel-header-title'}>
        <h1>Latest Transactions</h1>
        <i className={'fas fa-undo fa-flip-horizontal'} onClick={onReloadButton} />
      </div>
      <div className={'lw-transactions-panel-header-filters'}>
        <div className={'lw-transactions-panel-text'}>Show:</div>
        <PanelFilters
          selectedFilter={transactionFilters[transactionFilter.toLowerCase()]}
          filters={Object.values(transactionFilters).map(key => key)}
          onFilterSelected={setTransactionFilter}
        />
        <SquareButton title={'Filter'} icon={'fas fa-filter'} onClick={onFilterButton} />
      </div>
    </div>
  );
};

TransactionsPanelHeader.propTypes = {
  selectedFilter: PropTypes.string
};

export default TransactionsPanelHeader;
