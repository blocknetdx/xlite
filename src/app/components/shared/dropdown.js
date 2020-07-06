import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import { Button } from './buttons';

export const DropdownButton = React.forwardRef((props, ref) => {
  const newProps = omit(props, ['children']);
  return (
    <Button ref={ref} {...newProps} data-toggle={'dropdown'}>{props.children}</Button>
  );
});
DropdownButton.propTypes = {
  children: PropTypes.any
};

export const DropdownItem = props => {
  const newProps = omit(props, ['children']);
  return (
    <button className="dropdown-item" type="button" {...newProps}>{props.children}</button>
  );
};
DropdownItem.propTypes = {
  children: PropTypes.any
};

export const DropdownDivider = () => {
  return (
    <div className="dropdown-divider" />
  );
};

export const Dropdown = ({ children, right = false, left = false }) => {
  return (
    <div className={'dropdown'}>
      {children[0]}
      <div className={`dropdown-menu ${right ? 'dropdown-menu-right' : left ? 'dropdown-menu-left' : ''}`}>
        {children.slice(1)}
      </div>
    </div>
  );
};
Dropdown.propTypes = {
  right: PropTypes.bool,
  left: PropTypes.bool,
  children: PropTypes.any
};
