import React from 'react';
import PropTypes from 'prop-types';
import Localize from './localize';
import PerfectScrollbar from 'react-perfect-scrollbar';

const FilterMenu = ({ items = [], active = false, onClick = () => {} }) => {
  return (
    <div className={`lw-filtermenu-container ${active ? 'active': null}`}>
      <PerfectScrollbar>
        {items
          .map(({ id, text, image }) => {
            return (
              <button className={'lw-sidebar-filterable-list-item'} key={id} onClick={() => onClick(id)}><img alt={Localize.text('Coin logo', 'sidebar')} srcSet={image} />{text}</button>
            );
          })}
      </PerfectScrollbar>
    </div>
  );
};

FilterMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  active: PropTypes.bool,
  onClick: PropTypes.func
};

export default FilterMenu;
