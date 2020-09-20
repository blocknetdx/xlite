import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import domStorage from '../../modules/dom-storage';
import Balance from '../shared/balance';
import BalanceFilters from '../shared/button-filters';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart from '../shared/chart';
import {Column, Row} from '../shared/flex';
import {multiplierForCurrency} from '../../util';
import { SIDEBAR_WIDTH, balanceFilters, localStorageKeys } from '../../constants';

const Portfolio = ({ windowWidth, altCurrency, currencyMultipliers, balanceOverTime }) => {
  const [chartData, setChartData] = useState([[0, 0]]);
  const initialChartScale = domStorage.getItem(localStorageKeys.ACTIVE_CHART_FILTER) || 'half-year';
  const [chartScale, setChartScale] = useState(initialChartScale);

  useEffect(() => {
    if (multiplierForCurrency('BTC', altCurrency, currencyMultipliers) > 0)
      balanceOverTime(chartScale, altCurrency, currencyMultipliers)
        .then(data => {
          setChartData(data);
        });
  }, [balanceOverTime, chartScale, altCurrency, currencyMultipliers]);

  const onBalanceFilterSelected = filter => {
    const selectedChartScale = Object.keys(balanceFilters).find(key => balanceFilters[key] === filter) || 'half-year';
    domStorage.setItem(localStorageKeys.ACTIVE_CHART_FILTER, selectedChartScale);
    setChartScale(selectedChartScale);
  };

  const containerHorizPadding = 25;
  const headCol1Width = 282;
  const headCol3Width = 250;
  const headCol2Width = windowWidth - SIDEBAR_WIDTH - headCol1Width - headCol3Width - containerHorizPadding * 2;

  const hidePercent = windowWidth < 1200;
  const hideVolume = windowWidth < 1150;
  const hidePriceGraph = windowWidth < 1100;
  const hideCoinText = windowWidth < 1050;

  console.log('hidePercent', hidePercent, 'hideVolume', hideVolume, 'hidePriceGraph', hidePriceGraph, 'hideCoinText', hideCoinText);

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
                 chartGridColor={'#949494'} chartScale={chartScale} />
        </Column>
        <Column style={{margin: 'auto 0 20px auto'}}>
          <BalanceFilters selectedFilter={balanceFilters[chartScale]} filters={Object.values(balanceFilters).map(key => key)} onFilterSelected={onBalanceFilterSelected} />
        </Column>
      </Row>
      <AssetsOverviewPanel hidePercent={hidePercent} hideVolume={hideVolume} hidePriceGraph={hidePriceGraph} hideCoinText={hideCoinText} />
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
