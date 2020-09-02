import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import Balance from '../shared/balance';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart from '../shared/chart';
import {Column, Row} from '../shared/flex';
import {multiplierForCurrency} from '../../util';
import { SIDEBAR_WIDTH } from '../../constants';

const Portfolio = ({ windowWidth, altCurrency, currencyMultipliers, balanceOverTime }) => {
  const [chartData, setChartData] = useState([[0, 0]]);
  const [chartScale, setChartScale] = useState('half-year');

  // TODO Wire up the filter buttons, chart supports year/half-year/month/week/day
  useEffect(() => {
    if (multiplierForCurrency('BTC', altCurrency, currencyMultipliers) > 0)
      balanceOverTime(chartScale, altCurrency, currencyMultipliers)
        .then(data => {
          setChartData(data);
        });
  }, [balanceOverTime, chartScale, altCurrency, currencyMultipliers]);

  const containerHorizPadding = 25;
  const headCol1Width = 160;
  const headCol3Width = 200;
  const headCol2Width = windowWidth - SIDEBAR_WIDTH - headCol1Width - headCol3Width - containerHorizPadding * 2;

  return (
    <div className={'lw-portfolio-container'}>
      <Row style={{height: 100, minHeight: 100, maxHeight: 150}}>
        <Column>
          <Balance />
        </Column>
        <Column>
          <Chart className={'lw-portfolio-chart'} chartData={chartData} currency={altCurrency} simple={false} simpleStrokeColor={'#ccc'}
                 hideAxes={true} defaultWidth={headCol2Width} defaultHeight={100}
                 gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
                 chartGridColor={'#949494'} chartScale={'half-year'} />
        </Column>
      </Row>
      <AssetsOverviewPanel />
    </div>
  );
};
Portfolio.propTypes = {
  windowWidth: PropTypes.number,
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  balanceOverTime: PropTypes.func, // function('day|week|month|half-year|year', currency, currencyMultiplier)
};

export default Portfolio;
