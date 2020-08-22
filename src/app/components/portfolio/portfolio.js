import PropTypes from 'prop-types';
import React from 'react';
import Balance from '../shared/balance';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart, {chartSampleData} from '../shared/chart';
import {Column, Row} from '../shared/flex';
import { SIDEBAR_WIDTH } from '../../constants';

const Portfolio = ({ windowWidth }) => {

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
          <Chart className={'lw-portfolio-chart'} chartData={chartSampleData} simple={false} simpleStrokeColor={'#ccc'}
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
  windowWidth: PropTypes.number
};

export default Portfolio;
