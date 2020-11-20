// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
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
import moment from 'moment';
import $ from 'jquery';

const Portfolio = ({ windowWidth, altCurrency, currencyMultipliers, balanceOverTime }) => {
  const [chartData, setChartData] = useState([[0, 0]]);
  const initialChartScale = domStorage.getItem(localStorageKeys.ACTIVE_CHART_FILTER) || 'half-year';
  const [chartScale, setChartScale] = useState(initialChartScale);
  const [headCol2Width, setHeadCol2Width] = useState(0);

  useEffect(() => {
    if (multiplierForCurrency('BTC', altCurrency, currencyMultipliers) > 0)
      balanceOverTime(chartScale, altCurrency, currencyMultipliers)
        .then(data => {
          setChartData(data);
        });
  }, [balanceOverTime, chartScale, altCurrency, currencyMultipliers]);

  useEffect(() => {
    setTimeout(() => {
      const { clientWidth = 0 } = $('#js-portfolioHeaderCol2')[0] || {};
      setHeadCol2Width(clientWidth);
    }, 0);
  }, [windowWidth]);

  const onBalanceFilterSelected = filter => {
    const selectedChartScale = Object.keys(balanceFilters).find(key => balanceFilters[key] === filter) || 'half-year';
    domStorage.setItem(localStorageKeys.ACTIVE_CHART_FILTER, selectedChartScale);
    setChartScale(selectedChartScale);
  };

  const hidePercent = windowWidth < 1200;
  const hideVolume = windowWidth < 1150;
  const hidePriceGraph = windowWidth < 1100;
  const hideCoinText = windowWidth < 1050;

  return (
    <div className={'lw-portfolio-container'}>
      <Row style={{height: 115, minHeight: 115, maxHeight: 150}}>
        <Column>
          <Balance />
        </Column>
        <Column id={'js-portfolioHeaderCol2'} style={{minWidth: 0, marginLeft: 30, marginRight: 20, height: 100, flexGrow: 1, overflowX: 'hidden'}}>
          {headCol2Width ?
            <Chart className={'lw-portfolio-chart'} chartData={chartData} currency={altCurrency} simple={false} simpleStrokeColor={'#ccc'}
                   hideAxes={true} defaultWidth={headCol2Width} defaultHeight={100}
                   gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
                   chartGridColor={'#949494'} chartScale={chartScale} />
            :
            null
          }
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

// const generateTestData = () => {
//   const testChartData = [];
//   const min = 200;
//   const max = 300;
//   for(let i = 0; i < 365; i++) {
//     const num = Math.floor(Math.random() * (max - min + 1) + min);
//     testChartData.push([moment().subtract(i, 'd').unix(), num]);
//   }
//   return testChartData;
// };

export default Portfolio;
