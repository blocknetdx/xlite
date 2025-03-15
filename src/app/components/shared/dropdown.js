// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown as BootstrapDropdown } from 'react-bootstrap';

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
  const selectedItem = items.find(i => i.value === value) || null;

  return (
    <BootstrapDropdown style={style}>
      <BootstrapDropdown.Toggle variant="light" className="lw-coin-select">
        {selectedItem ? selectedItem.text : placeholder}
      </BootstrapDropdown.Toggle>

      <BootstrapDropdown.Menu>
        {items.filter(i => i.value !== value).length > 0 ? (
          items
            .filter(i => i.value !== value)
            .map(i => (
              <BootstrapDropdown.Item key={i.value} onClick={() => onSelect(i.value)}>
                {i.text}
              </BootstrapDropdown.Item>
            ))
        ) : (
          <BootstrapDropdown.Item disabled>----</BootstrapDropdown.Item>
        )}
      </BootstrapDropdown.Menu>
    </BootstrapDropdown>
  );
};

Dropdown.propTypes = {
  items: PropTypes.arrayOf(PropTypes.instanceOf(DropdownItem)),
  placeholder: PropTypes.string,
  value: PropTypes.string,
  style: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

export default Dropdown;
