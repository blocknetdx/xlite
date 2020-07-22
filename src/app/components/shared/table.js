import PropTypes from 'prop-types';
import React from 'react';

export const TableRow = ({ children }) => {
  return (
    <div className={'lw-table-row'}>
      {children}
    </div>
  );
};
TableRow.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
};

export const Table = ({ columns = [], rows = [], children }) => {
  return (
    <div className={'lw-table-container'}>
      <div className={'lw-table-header'}>
        {columns.map(([ text, width ], i) => {
          return (
            <div className={'lw-table-column-heading'} key={`col-${i}`} style={{flexGrow: width, flexBasis: 1}}>{text}</div>
          );
        })}
      </div>
      {rows.map((r, i) => {
        return (
          <div key={`row-${i}`} className={'lw-table-row'}>
            {r.map((item, ii) => {
              const width = columns[ii][1];
              return (
                <div key={`row-${i}-col-${ii}`} style={{flexGrow: width, flexBasis: 1}}>
                  {item}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.array),
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.element)),
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
};
