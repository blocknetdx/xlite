import React from 'react';
import Balance from '../shared/balance';
import AssetsOverviewPanel from '../shared/assets-overview-panel';
import Chart, {chartSampleData} from '../shared/chart';
import {Column, Row} from '../shared/flex';

const Portfolio = () => {
  return (
    <div className={'lw-portfolio-container'}>
      <Row style={{height: 100, minHeight: 100, maxHeight: 150}}>
        <Column>
          <Balance />
        </Column>
        <Column>
          <Chart className={'lw-portfolio-chart'} chartData={chartSampleData} simple={false} simpleStrokeColor={'#ccc'}
                 hideAxes={true} defaultWidth={600} defaultHeight={100}
                 gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
                 chartGridColor={'#949494'} chartScale={'half-year'} />
        </Column>
      </Row>
      <AssetsOverviewPanel />
    </div>
  );
};
Portfolio.propTypes = {};

export default Portfolio;
