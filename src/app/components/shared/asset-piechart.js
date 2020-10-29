// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import _ from 'lodash';
import { all, create } from 'mathjs';
const math = create(all, {
  number: 'BigNumber',
  precision: 2
});
const { bignumber } = math;
import Localize from './localize';
import PropTypes from 'prop-types';
import React from 'react';

export class AssetPieChartData {
  /**
   * @type {string}
   */
  ticker = '';
  /**
   * @type {string}
   */
  name = '';
  /**
   * USD/BTC label
   * @type {string}
   */
  currency = '';
  /**
   * @type {number}
   */
  amount = 0;
  /**
   * @type {string}
   */
  color = '';

  /**
   *
   * @param ticker {string}
   * @param name {string}
   * @param currency {string}
   * @param amount {number}
   * @param color {string}
   */
  constructor(ticker, name, currency, amount, color) {
    this.ticker = ticker;
    this.name = name;
    this.currency = currency;
    this.amount = amount;
    this.color = color;
  }
}

/**
 * Renders an asset pie chart.
 * chartData expected to be in the format:
 *   [
 *     AssetPieChartData,
 *     AssetPieChartData,
 *     AssetPieChartData,
 *   ]
 */
export default class AssetPieChart extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    chartData: PropTypes.arrayOf(PropTypes.instanceOf(AssetPieChartData)),
    defaultWidth: PropTypes.number,
    lineWidth: PropTypes.number,
  }

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
    this.state = { showSelected: false, selectedPt: {x: 0, y: 0} };
    this.onMouseMove = (event) => {
      const pt = {x: (event.clientX)*window.devicePixelRatio,
                  y: (event.clientY)*window.devicePixelRatio};
      this.setState({ showSelected: true, selectedPt: pt });
    };
    this.onMouseLeave = (event) => {
      this.setState({ showSelected: false, selectedPt: {x: 0, y: 0} });
    };
  }

  componentDidMount() {
    // setTimeout hack to ensure fonts properly loaded
    setTimeout(this.renderCanvas.bind(this), 100);
  }

  componentDidUpdate() {
    this.renderCanvas();
  }

  /**
   * Renders the chart canvas and performs all drawing operations.
   */
  renderCanvas() {
    const { chartData, defaultWidth, lineWidth } = this.props;
    const canvas = this.canvas.current;
    const ctx = canvas.getContext('2d');
    const w = defaultWidth * window.devicePixelRatio;
    const h = w;
    const padding = this._pix(lineWidth);
    const chartWidth = w - padding*2;
    const chartHeight = h - padding*2;

    // Retina/HDPI screen support (requires canvas.scaled below)
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = defaultWidth + 'px';
    canvas.style.height = defaultWidth + 'px';

    // AssetPieChart data, default to empty data provider
    const data = _.isArray(chartData) ? chartData.slice() : [];
    let totalAmount = 0;
    for (const pieData of data)
      totalAmount += pieData.amount;
    let currency = 'USD';
    if (totalAmount > 0)
      currency = data[0].currency;

    // Draw the chart
    const radius = chartWidth/2;
    const origin = {x: padding+radius, y: padding+radius};
    const circleRadians = 2*Math.PI;

    ctx.lineWidth = this._pix(lineWidth);
    ctx.strokeStyle = 'gray';
    ctx.lineCap = 'butt';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';

    const { showSelected, selectedPt } = this.state;
    const boundingRect = canvas.getBoundingClientRect();
    selectedPt.x -= boundingRect.x * window.devicePixelRatio;
    selectedPt.y -= boundingRect.y * window.devicePixelRatio;
    let selectedChartData = null;

    // Render individual data items if we have coin
    if (totalAmount > 0) {
      let fromAngle = 0;
      let selectedAngleFrom = 0;
      let selectedAngleTo = 0;
      let selectionFlag = false;
      const angleOffset = -this._degToRad(90);

      // Draw each chart data pie piece
      for (let i = 0; i < data.length; i++) {
        const pieData = data[i];
        const perc = pieData.amount / totalAmount;
        const dataAngle = circleRadians * perc;

        if (i === 0) // on first iteration set from angle
          fromAngle = angleOffset - dataAngle/2;
        // set the pie piece end angle
        const toAngle = fromAngle + dataAngle;

        { // draw the pie piece
          ctx.save();
          ctx.strokeStyle = pieData.color;
          const p = new Path2D();
          p.arc(origin.x, origin.y, radius, fromAngle, toAngle);
          ctx.stroke(p);
          ctx.restore();
        }

        // If the user is requesting selection, determine which pie piece
        // is being selected if any.
        if (!selectionFlag && showSelected) {
          const normalizedX = selectedPt.x - origin.x;
          const normalizedY = selectedPt.y - origin.y;
          const calcAngle = Math.atan2(normalizedY, normalizedX);
          const selAngle = calcAngle < 0 ? calcAngle + 2*Math.PI : calcAngle;
          const normalizedFromAngle = fromAngle < 0 ? fromAngle + 2*Math.PI : fromAngle;
          const normalizedToAngle = toAngle < 0 ? toAngle + 2*Math.PI : toAngle;
          if (data.length === 1) // if there's only 1 item select it regardless of angle
            selectionFlag = true;
          else if (normalizedFromAngle > normalizedToAngle) {
            if ((selAngle >= normalizedFromAngle && selAngle < normalizedToAngle+2*Math.PI)
              || (selAngle >= normalizedFromAngle-2*Math.PI && selAngle < normalizedToAngle))
              selectionFlag = true;
          } else if (selAngle >= normalizedFromAngle && selAngle < normalizedToAngle)
            selectionFlag = true;
          if (selectionFlag) {
            selectedAngleFrom = fromAngle;
            selectedAngleTo = toAngle;
            selectedChartData = pieData;
          }
        }
        fromAngle = toAngle; // move around circle from last angle
      }

      // Draw the selection over the selected pie piece
      if (showSelected && (selectedAngleFrom !== 0 && selectedAngleTo !== 0 || data.length === 1)) {
        ctx.save();
        ctx.lineWidth = this._pix(2);
        ctx.strokeStyle = 'cyan';
        ctx.lineCap = 'square';
        const radiusLower = radius-padding/2;
        const radiusUpper = radius+padding/2;
        const path1 = new Path2D();
        path1.arc(origin.x, origin.y, radiusLower, selectedAngleFrom, selectedAngleTo); // bottom
        ctx.stroke(path1);
        const path2 = new Path2D();
        path2.arc(origin.x, origin.y, radiusUpper, selectedAngleFrom, selectedAngleTo); // top
        ctx.stroke(path2);
        // Only draw end caps if there's more than 1 pie piece
        if (data.length > 1) {
          // Draw left end cap
          const path3 = new Path2D();
          const p1 = {x: origin.x + radiusLower * Math.cos(selectedAngleFrom), y: origin.y + radiusLower * Math.sin(selectedAngleFrom)};
          const p2 = {x: origin.x + radiusUpper * Math.cos(selectedAngleFrom), y: origin.y + radiusUpper * Math.sin(selectedAngleFrom)};
          path3.moveTo(p1.x, p1.y); // draw left border
          path3.lineTo(p2.x, p2.y);
          // Draw right end cap
          const p3 = {x: origin.x + radiusLower * Math.cos(selectedAngleTo), y: origin.y + radiusLower * Math.sin(selectedAngleTo)};
          const p4 = {x: origin.x + radiusUpper * Math.cos(selectedAngleTo), y: origin.y + radiusUpper * Math.sin(selectedAngleTo)};
          path3.moveTo(p3.x, p3.y); // draw right border
          path3.lineTo(p4.x, p4.y);
          ctx.stroke(path3);
        }
        ctx.restore();
      }
    } else { // render the no-coin state
      const p = new Path2D();
      p.arc(origin.x, origin.y, radius, 0, 2*Math.PI);
      ctx.stroke(p);
    }

    // Determine center pie chart labels
    let percentLabel = '100%';
    let centerLabel = Localize.text('Portfolio', 'pie chart on portfolio screen');
    const defaultAmount = (totalAmount < 1 ? bignumber(totalAmount).toFixed(2)
                                           : bignumber(totalAmount).toFixed(0));
    let amountLabel = currency + ' ' + defaultAmount;
    if (showSelected && selectedChartData) {
      percentLabel = (selectedChartData.amount/totalAmount*100).toFixed(0) + '%';
      centerLabel = selectedChartData.name;
      const amount = (selectedChartData.amount < 1 ? bignumber(selectedChartData.amount).toFixed(2)
                                                   : bignumber(selectedChartData.amount).toFixed(0));
      amountLabel = currency + ' ' + amount;
    }

    const fontSizeOffset = .4;
    const centerLabelHeight = this._pix(24);
    const centerLabelOffsetY = _.floor(centerLabelHeight * fontSizeOffset);
    const labelMargin = this._pix(17);

    // Percent label
    ctx.save();
    ctx.font = 'normal normal normal ' + this._pix(14) + 'px IBMPlexSans';
    ctx.fillText(percentLabel, origin.x, origin.y - centerLabelOffsetY - labelMargin);
    ctx.restore();
    // Portfolio label
    ctx.save();
    ctx.font = 'normal normal 600 ' + centerLabelHeight + 'px IBMPlexSans';
    ctx.fillText(centerLabel, origin.x, origin.y + centerLabelOffsetY);
    ctx.restore();
    // Currency label
    const amountLabelHeight = this._pix(14);
    ctx.save();
    ctx.font = 'normal normal normal ' + amountLabelHeight + 'px IBMPlexSans';
    ctx.fillText(amountLabel, origin.x, origin.y + centerLabelOffsetY + labelMargin + _.floor(amountLabelHeight * (2 * fontSizeOffset)));
    ctx.restore();

    // Retina/HDPI screen support
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  render() {
    const { className, style } = this.props;
    return (
      <div className={className}>
        <canvas ref={this.canvas} style={style} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave} />
      </div>
    );
  }

  /**
   * Returns a scaled pixel.
   * @param n
   * @return {number}
   */
  _pix(n) {
    return n * window.devicePixelRatio;
  }

  /**
   * Converts degrees to radians.
   * @param n {number} Degrees
   * @return {number} Radians
   * @private
   */
  _degToRad(n) {
    return n * Math.PI/180;
  }
}

/**
 * Wallet color.
 * @param ticker
 * @return {string}
 */
export const chartColorForTicker = (ticker) => {
  switch (ticker) {
    case 'BLOCK':
      return '#101341';
    case 'BTC':
      return '#F7931A';
    case 'BCH':
      return '#8DC351';
    case 'DASH':
      return '#008DE4';
    case 'DGB':
      return '#002352';
    case 'DOGE':
      return '#C3A634';
    case 'LTC':
      return '#BFBBBB';
    case 'PHR':
      return '#00d188';
    case 'PIVX':
      return '#7d67a8';
    case 'POLIS':
      return '#088AC8';
    case 'RVN':
      return '#384182';
    case 'SYS':
      return '#0089CF';
    default:
      return '#666';
  }
};

const data = [
  new AssetPieChartData('BLOCK', 'Blocknet', 'USD', 3000, chartColorForTicker('BLOCK')),
  new AssetPieChartData('BTC', 'Bitcoin', 'USD', 3000, chartColorForTicker('BTC')),
  new AssetPieChartData('BCH', 'Bitcoin Cash', 'USD', 3000, chartColorForTicker('BCH')),
  new AssetPieChartData('DASH', 'Dash', 'USD', 3000, chartColorForTicker('DASH')),
  new AssetPieChartData('DGB', 'DigiByte', 'USD', 3000, chartColorForTicker('DGB')),
  new AssetPieChartData('DOGE', 'Dogecoin', 'USD', 3000, chartColorForTicker('DOGE')),
  new AssetPieChartData('LTC', 'Litecoin', 'USD', 3000, chartColorForTicker('LTC')),
  new AssetPieChartData('PHR', 'Phore', 'USD', 3000, chartColorForTicker('PHR')),
  new AssetPieChartData('PIVX', 'Pivx', 'USD', 3000, chartColorForTicker('PIVX')),
  new AssetPieChartData('POLIS', 'Polis', 'USD', 3000, chartColorForTicker('POLIS')),
  new AssetPieChartData('RVN', 'Ravencoin', 'USD', 3000, chartColorForTicker('RVN')),
  new AssetPieChartData('SYS', 'Syscoin', 'USD', 3000, chartColorForTicker('SYS')),
];
export const chartSampleData = data;

/** Sample chart
ReactDOM.render(
  <Provider store={store}>
 <AssetPieChart className={'lw-portfolio-piechart'} defaultWidth={262} chartData={chartSampleData} lineWidth={12} />
  </Provider>,
  document.getElementById('js-main')
);
*/
