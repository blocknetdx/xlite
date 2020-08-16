import React from 'react';
import PropTypes from 'prop-types';
import isArray from 'lodash/isArray';

const Button = React.forwardRef((props, ref) => {
  const { children, id = '', type = 'button', disabled = false, style = {}, transparent = false, title = '', className = '', onClick = () => {} } = props;
  const dataToggle = props['data-toggle'];
  const childrenNumber = children && isArray(children) && children.filter(c => c).length > 1 ? children.length : 1;
  const extraProps = {};
  if(dataToggle) extraProps['data-toggle'] = dataToggle;
  return (
    <button ref={ref} id={id} className={`lw-button ${className} ${childrenNumber > 1 ? 'multiple-children' : ''} ${transparent ? 'lw-button-transparent' : ''}`}
            type={type} disabled={disabled} style={style} title={title} onClick={onClick} {...extraProps}>
      {children}
    </button>
  );
});
Button.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  transparent: PropTypes.bool,
  style: PropTypes.object,
  children: PropTypes.any,
  ['data-toggle']: PropTypes.string,
  onClick: PropTypes.func
};

export {
  Button
};
