import PropTypes from 'prop-types';
import React from 'react';

export const TableColumn = ({ size = 1, children, idx, final, style = {} }) => {
  return (
    <div className={'lw-table-column-heading'} style={{flexGrow: size, flexBasis: 1, textAlign: idx === 0 ? 'left' : final ? 'right' : 'center', ...style }}>
      {children}
    </div>
  );
};
TableColumn.propTypes = {
  children: PropTypes.any,
  final: PropTypes.bool,
  idx: PropTypes.number,
  size: PropTypes.number,
  style: PropTypes.object
};

export const TableRow = ({ idx, children = [], style = {}, sizes = [] }) => {

  children = Array.isArray(children) ? children : [children];

  return (
    <div className={'lw-table-row'} style={style}>
      {children.map((c, i) => React.cloneElement(c, {key: `row-${idx}-col${i}`, idx: i, size: sizes[i], final: i === children.length - 1}))}
    </div>
  );
};
TableRow.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]),
  idx: PropTypes.number,
  sizes: PropTypes.array,
  style: PropTypes.object
};

export const TableData = ({ size = 1, children, idx, final, style }) => {
  return (
    <div className={'lw-table-data-container'}
         style={{flexGrow: size, flexBasis: 1, textAlign: idx === 0 ? 'left' : final ? 'right' : 'center', ...style}}>
      {children}
    </div>
  );
};
TableData.propTypes = {
  children: PropTypes.any,
  final: PropTypes.bool,
  idx: PropTypes.number,
  size: PropTypes.number,
  style: PropTypes.object
};

export const Table = ({ children = [] }) => {

  children = Array.isArray(children) ? children : [children];

  children = children.reduce((arr, c) => Array.isArray(c) ? [...arr, ...c] : [...arr, c], []);

  const columns = [];
  const rows = [];

  for(const child of children) {
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
      {rows.map((r, i) => React.cloneElement(r, {key: `row-${i}`, idx: i, sizes}))}
    </div>
  );
};
Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.array),
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.element)),
  children: PropTypes.any
};
