// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SquareButton } from './buttons';

const ButtonFilters = ({ selectedFilter, filters = [], onFilterSelected }) => {
  const [ activeFilter, setActiveFilter ] = useState(selectedFilter);

  return (
    <div className={'lw-balance-filters'}>
      {filters.map((filter, key) => {
        const onFilterClick = e => {
          e.preventDefault();
          setActiveFilter(filter);
          onFilterSelected(filter);
        };
        return <SquareButton key={key} id={filter} title={filter} active={activeFilter === filter} onClick={onFilterClick} />;
      })}
    </div>
  );
};
ButtonFilters.propTypes = {
  selectedFilter: PropTypes.string,
  filters: PropTypes.array,
  onFilterSelected: PropTypes.func
};

export default ButtonFilters;
