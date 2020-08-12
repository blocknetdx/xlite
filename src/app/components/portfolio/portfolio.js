import React from 'react';
import Balance from '../shared/balance';
import AssetsOverviewPanel from '../shared/assets-overview-panel';

const Portfolio = () => {
  return (
    <div className={'lw-portfolio-container'}>
      <Balance />
      <AssetsOverviewPanel />
    </div>
  );
};
Portfolio.propTypes = {};

export default Portfolio;
