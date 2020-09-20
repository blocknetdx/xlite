import PropTypes from 'prop-types';
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

export const TableColumn = ({ className = '', size = 1, children, idx, final, style = {} }) => {
  return (
    <div className={`lw-table-column-heading ${className}`} style={{flexGrow: size, flexBasis: 1, textAlign: idx === 0 ? 'left' : final ? 'right' : 'center', ...style }}>
      {children}
    </div>
  );
};
TableColumn.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
  final: PropTypes.bool,
  idx: PropTypes.number,
  size: PropTypes.number,
  style: PropTypes.object
};

export const TableRow = ({ idx, children = [], style = {}, sizes = [], clickable = false, small, onClick = () => {} }) => {

  children = Array.isArray(children) ? children : [children];

  return (
    <div className={`lw-table-row ${clickable ? 'clickable' : ''}`}
         style={style}
         onClick={e => {
           if(!clickable)
             return;
           e.preventDefault();
           onClick();
         }}>
      {children
        .filter(c => c !== null)
        .map((c, i) => React.cloneElement(c, {key: `row-${idx}-col${i}`, small, idx: i, size: sizes[i], final: i === children.length - 1}))
      }
    </div>
  );
};
TableRow.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]),
  idx: PropTypes.number,
  sizes: PropTypes.array,
  style: PropTypes.object,
  clickable: PropTypes.bool,
  small: PropTypes.bool,
  onClick: PropTypes.func
};

export const TableData = ({ size = 1, children, className = '', idx, final, style, small }) => {
  return (
    <div className={`lw-table-data-container ${small ? 'lw-table-data-container-small' : ''} ${className}`}
         style={{flexGrow: size, flexBasis: 1, textAlign: idx === 0 ? 'left' : final ? 'right' : 'center', ...style}}>
      {children}
    </div>
  );
};
TableData.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  final: PropTypes.bool,
  idx: PropTypes.number,
  size: PropTypes.number,
  style: PropTypes.object,
  small: PropTypes.bool,
};

export const Table = ({ children = [], small = false }) => {

  children = Array.isArray(children) ? children : [children];

  children = children.reduce((arr, c) => Array.isArray(c) ? [...arr, ...c] : [...arr, c], []);

  const columns = [];
  const rows = [];

  for(const child of children) {
    if(child === null) continue;
    if(child.type.name === 'TableColumn') {
      columns.push(child);
    } else if(child.type.name === 'TableRow') {
      rows.push(child);
    }
  }

  const sizes = columns.map(c => c.props.size);

  return (
    <div className={'lw-table-container'}>
      <div className={'lw-table-header'}>
        {columns.map((c, i) => React.cloneElement(c, {key: `col-${i}`, idx: i, final: i === columns.length - 1}))}
      </div>
      <div className={'lw-table-body'}>
        <PerfectScrollbar>
          {rows.map((r, i) => React.cloneElement(r, {key: `row-${i}`, small, idx: i, sizes}))}
        </PerfectScrollbar>
      </div>
    </div>
  );
};
Table.propTypes = {
  children: PropTypes.any,
  small: PropTypes.bool,
};
