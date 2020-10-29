// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';

export class DropdownItem {

  /**
   * @type {string}
   */
  text = '';

  /**
   * @type {string}
   */
  value = '';

  constructor(text, value) {
    this.text = text;
    this.value = value;
  }

}

export const Dropdown = ({ items = [], placeholder = '', value = '', style = {}, onSelect }) => {

  const selectedItem = items.find(i => i.value === value);

  return (
    <div className={'dropdown'} style={style}>
      <a href={'#'} ref={node => node ? $(node).dropdown() : null} className={'lw-coin-select'} data-toggle={'dropdown'}>
        <div>{selectedItem ? selectedItem.text : placeholder}</div>
        <i className={'fas fa-caret-down'} />
      </a>
      <div className={'dropdown-menu'}>
        {items
          .filter(i => i.value !== value)
          .map(i => {
            const onClick = e => {
              e.preventDefault();
              onSelect(i.value);
            };
            return (
              <button key={i.value} className="dropdown-item lw-coin-select-item" type="button" onClick={onClick}>
                <div>{i.text}</div>
              </button>
            );
          })
        }
      </div>
    </div>
  );
};
Dropdown.propTypes = {
  items: PropTypes.arrayOf(PropTypes.instanceOf(DropdownItem)),
  placeholder: PropTypes.string,
  value: PropTypes.string,
  style: PropTypes.object,
  onSelect: PropTypes.func
};
