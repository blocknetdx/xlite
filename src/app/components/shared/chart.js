import {unixTime, oneDaySeconds, oneHourSeconds, oneWeekSeconds, oneMonthSeconds} from '../../util';

import _ from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Renders a canvas chart.
 * chartData expected to be in the format:
 *   [
 *     [unix_epoch1, coin_amount1],
 *     [unix_epoch2, coin_amount2],
 *     [unix_epoch3, coin_amount3],
 *   ]
 * An array of pairs of timestamps and sizes.
 * a[0] = x-axis timestamp
 * a[1] = y-axis amount
 */
export default class Chart extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    chartData: PropTypes.arrayOf(Array),
    simple: PropTypes.bool,
    simpleStrokeColor: PropTypes.string,
    hideAxes: PropTypes.bool,
    defaultWidth: PropTypes.number,
    defaultHeight: PropTypes.number,
    gradientTopColor: PropTypes.string,
    gradientBottomColor: PropTypes.string,
    chartGridColor: PropTypes.string,
    chartScale: PropTypes.string, // Supported scales: day, week, month, half-year, year
  }

  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }

  componentDidMount() {
    this.renderCanvas();
    // redraw canvas hack to correctly render fonts
    setTimeout(() => this.renderCanvas(), 100);
  }

  /**
   * Renders the chart canvas and performs all drawing operations.
   */
  renderCanvas() {
    const { chartData, simple, simpleStrokeColor, hideAxes, defaultWidth, defaultHeight,
      gradientTopColor, gradientBottomColor, chartGridColor, chartScale } = this.props;
    const canvas = this.canvas.current;
    const ctx = canvas.getContext('2d');
    const w = defaultWidth * window.devicePixelRatio;
    const h = defaultHeight * window.devicePixelRatio;
    const xAxisPadding = !simple ? this._pix(38) : 0;    // no axis labels for simple chart
    const yAxisTopPadding = !simple ? this._pix(15) : 0; // ^
    const yAxisBotPadding = !simple ? this._pix(25) : 0; // ^
    const chartWidth = w - xAxisPadding;
    const chartHeight = h - yAxisBotPadding - yAxisTopPadding;

    // Chart data, default to empty data provider
    let data = _.isArray(chartData) ? chartData.slice() : [];
    let xAxisTicks = [];
    if (data.length > 0) {
      const today = unixTime();
      data.sort((a,b) => a[0] - b[0]); // sort by time ascending
      if (chartScale === 'day') {
        const startTime = today-oneDaySeconds;
        data = this._timeScaleFilter(data, startTime, today, oneHourSeconds);
        xAxisTicks = this._timeScaleLabels(startTime, today, oneHourSeconds*2, 'hA', 'ddd');
      } else if (chartScale === 'week' || chartScale === '' || !chartScale) {
        const startTime = today-(oneDaySeconds*7);
        data = this._timeScaleFilter(data, startTime, today, oneDaySeconds);
        xAxisTicks = this._timeScaleLabels(startTime, today, oneDaySeconds, 'MMM DD', 'YYYY', false);
      } else if (chartScale === 'month') {
        const startTime = today-(oneDaySeconds*30);
        data = this._timeScaleFilter(data, startTime, today, oneDaySeconds);
        xAxisTicks = this._timeScaleLabels(startTime, today, oneWeekSeconds, 'MMM Do', 'YYYY', false);
      } else if (chartScale === 'half-year') {
        const startTime = today-(oneDaySeconds*180);
        data = this._timeScaleFilter(data, startTime, today, oneWeekSeconds);
        xAxisTicks = this._timeScaleLabels(startTime, today, oneMonthSeconds, 'MMM YYYY', '', false);
      } else if (chartScale === 'year') {
        const startTime = today-(oneDaySeconds*365);
        data = this._timeScaleFilter(data, startTime, today, oneWeekSeconds);
        xAxisTicks = this._timeScaleLabels(startTime, today, oneMonthSeconds, 'MMM YY', '', false);
      }
    }

    // Retina/HDPI screen support (requires canvas.scaled below)
    ctx.clearRect(0, 0, w, h);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = defaultWidth + 'px';
    canvas.style.height = defaultHeight + 'px';

    // transform into coordinate space
    let x_max = 0;
    let x_min = 0;
    let y_max = 0;
    let y_min = 0;
    for (const [x, y] of data) {
      if (x < x_min)
        x_min = x;
      if (x > x_max)
        x_max = x;
      if (y < y_min)
        y_min = y;
      if (y > y_max)
        y_max = y;
    }
    const y_ratio = chartHeight / y_max;
    for (let i = 0; i < data.length; i++) {
      const arr = data[i];
      arr[2] = i === 0 ? 0 : (chartWidth/data.length*i);
      arr[3] = (y_max-arr[1]) * y_ratio;
    }

    if (data.length > 0) {
      const chart = new Path2D();
      const sx = xAxisPadding + data[0][2];
      const sy = yAxisTopPadding + data[0][3];
      chart.moveTo(sx, sy);
      for (const [a, b, x, y] of data)
        chart.lineTo(xAxisPadding + x, yAxisTopPadding + y);

      // Draw the simple chart and return
      if (simple) {
        chart.moveTo(sx, sy);
        chart.closePath();
        ctx.strokeStyle = simpleStrokeColor;
        ctx.lineWidth = window.devicePixelRatio;
        ctx.stroke(chart);
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        return;
      }

      // Complete the full chart paths for non-simple chart
      chart.lineTo(xAxisPadding + chartWidth, yAxisTopPadding + data[data.length-1][3]);
      chart.lineTo(xAxisPadding + chartWidth, yAxisTopPadding + chartHeight);
      chart.lineTo(xAxisPadding, yAxisTopPadding + chartHeight);
      chart.closePath();
      // Chart fill gradient
      const gradient = ctx.createLinearGradient(0,-h*0.1, 0, h*1.15);
      gradient.addColorStop(0, gradientTopColor);
      gradient.addColorStop(1, gradientBottomColor);
      ctx.fillStyle = gradient;
      ctx.fill(chart);
    }

    // Draw the chart axes
    const axisTickWidth = this._pix(6);

    if (!hideAxes) {
      const xaxis = new Path2D();
      const yaxis = new Path2D();
      // y-axis line
      ctx.save();
      yaxis.moveTo(xAxisPadding, yAxisTopPadding);
      yaxis.lineTo(xAxisPadding, yAxisTopPadding + chartHeight);
      // y-axis ticks
      const yAxisTicks = 5;
      const yaxisGridLinesYAxis = [];
      for (let i = 1; i <= yAxisTicks; i++) {
        const sx = xAxisPadding - axisTickWidth;
        const sy = yAxisTopPadding+chartHeight - (chartHeight/yAxisTicks)*i;
        yaxis.moveTo(sx, sy);
        yaxis.lineTo(sx+axisTickWidth, sy);
        yaxisGridLinesYAxis.push(sy);
      }
      yaxis.closePath();
      ctx.strokeStyle = chartGridColor;
      ctx.stroke(yaxis);
      ctx.restore();

      // y-axis grid lines
      ctx.save();
      for (const y of yaxisGridLinesYAxis) {
        const yaxisGrid = new Path2D();
        yaxisGrid.moveTo(xAxisPadding, y);
        yaxisGrid.lineTo(xAxisPadding+chartWidth, y);
        yaxisGrid.closePath();
        ctx.setLineDash([this._pix(1), this._pix(3)]); // dash, spaces
        ctx.strokeStyle = chartGridColor;
        ctx.stroke(yaxisGrid);
      }
      ctx.restore();

      // y-axis labels
      ctx.save();
      ctx.direction = 'rtl';
      ctx.fillStyle = chartGridColor;
      ctx.font = 'normal normal normal ' + this._pix(10) + 'px IBMPlexMonoMedium';
      for (let i = 1; i <= yAxisTicks; i++) {
        const y = yaxisGridLinesYAxis[i-1];
        ctx.fillText((y_max/yAxisTicks*i).toFixed(0), xAxisPadding - axisTickWidth - this._pix(4), y + this._pix(3));
      }
      ctx.restore();

      // x-axis line
      ctx.save();
      xaxis.moveTo(xAxisPadding - axisTickWidth, yAxisTopPadding + chartHeight);
      xaxis.lineTo(xAxisPadding + chartWidth, yAxisTopPadding + chartHeight);
      xaxis.closePath();
      ctx.strokeStyle = chartGridColor;
      ctx.stroke(xaxis);
      ctx.restore();

      // x-axis labels
      ctx.save();
      for (let i = 0; i < xAxisTicks.length; i++) {
        const label = xAxisTicks[i][0];
        const bold = xAxisTicks[i][1];
        const x = chartWidth/xAxisTicks.length * i;
        ctx.font = 'normal normal ' + bold + ' ' + this._pix(10) + 'px IBMPlexMonoMedium';
        ctx.fillStyle = bold !== 'normal' ? '#ccc' : chartGridColor;
        ctx.fillText(label, xAxisPadding + x, yAxisTopPadding + chartHeight + yAxisBotPadding - this._pix(4));
      }
      ctx.restore();
    }

    // Retina/HDPI screen support
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  render() {
    const { className, style } = this.props;
    return (
      <div className={className}>
        <canvas ref={this.canvas} style={style} />
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
   * Returns data over a period of 1 day from specified end time.
   * @param data {Array<number, number>} x axis, y-axis. Required to be sorted ascending by x-axis component
   * @param startTime {number}
   * @param endTime {number}
   * @param timeScale {number}
   * @return {Array<number, number>} x axis, y-axis
   * @private
   */
  _timeScaleFilter(data, startTime, endTime, timeScale) {
    const newData = [];
    // Filter past day. We want to insert at least 1 record
    // per unit time in order for the graph to look accurate.
    const dataInPeriod = data.filter(t => t[0] >= startTime && t[0] <= endTime);
    const dataCopy = dataInPeriod.slice();
    for (let i = startTime; i <= endTime; i += timeScale) {
      const removeIdx = [];
      const dataThisInterval = dataCopy.filter((t,j) => {
        if (t[0] >= i && t[0] < i + timeScale) {
          removeIdx.push(j);
          return true;
        }
        return false;
      });
      if (dataThisInterval.length === 0) {
        // If no new data yet, reference first item in the data copy
        // If there is new data, reference the last known data
        let d_yaxis = 0;
        if (newData.length > 0)
          d_yaxis = newData[newData.length-1][1];
        else if (dataCopy.length > 0)
          d_yaxis = dataCopy.shift()[1];
        newData.push([i, d_yaxis]);
      } else {
        for (const t of dataThisInterval)
          newData.push(t);
        // Remove known data parameters
        removeIdx.sort((a,b) => a-b);
        for (const j of removeIdx)
          dataCopy.splice(j, 1);
      }
    }
    return newData;
  }

  /**
   * Return the x-axis labels for the time frame.
   * @param startTime {number}
   * @param endTime {number}
   * @param timeScale {number}
   * @param timeFormatNormal {string}
   * @param timeFormatBold {string}
   * @param boldFirst {boolean}
   * @return {Array<string, string>} label, bold state
   * @private
   */
  _timeScaleLabels(startTime, endTime, timeScale, timeFormatNormal, timeFormatBold, boldFirst=true) {
    const labels = [];
    let prevDate = null;
    for (let i = startTime; i <= endTime; i += timeScale) {
      const m = moment(i*1000); // put in milliseconds
      let makeBold = false;
      if (!prevDate || (timeFormatBold !== '' && prevDate.format(timeFormatBold) !== m.format(timeFormatBold)))
        makeBold = !prevDate ? boldFirst : true;
      const fm = makeBold ? m.format(timeFormatBold).toUpperCase() : m.format(timeFormatNormal);
      labels.push([fm, makeBold ? 'bold' : 'normal']);
      prevDate = m; // store prev date
    }
    return labels;
  }
}

const today = unixTime();
const hour = (n) => 3600 * n;
const day = (n) => 86400 * n;
const data = [
  [today-day(340), 6000],
  [today-day(330), 5000],
  [today-day(320), 1000],
  [today-day(310), 4000],
  [today-day(300), 9050],
  [today-day(280), 10500],
  [today-day(260), 11000],
  [today-day(240), 12500],
  [today-day(220), 12000],
  [today-day(200), 7200],
  [today-day(190), 6800],
  [today-day(185), 6500],
  [today-day(180), 1200],
  [today-day(150), 3500],
  [today-day(130), 6500],
  [today-day(120), 9500],
  [today-day(110), 9000],
  [today-day(100), 8000],
  [today-day(90), 2500],
  [today-day(60), 1500],
  [today-day(45), 3500],
  [today-day(30), 3500],
  [today-day(12), 15000],
  [today-day(4), 15250],
  [today-day(3), 12000],
  [today-day(2), 12500],
  [today-day(1), 12150],
  [today-hour(8), 5000],
  [today-hour(4), 5000],
  [today-hour(2), 6500],
  [today-hour(1), 7200],
  [today, 7500],
];
export const chartSampleData = data;

/** Sample chart
ReactDOM.render(
  <Provider store={store}>
    <Chart className={'lw-dashboard-chart'} chartData={chartSampleData} simple={false} simpleStrokeColor={'#ccc'}
           hideAxes={false} defaultWidth={800} defaultHeight={800*9/16}
           gradientTopColor={'#00ffff'} gradientBottomColor={'rgba(0, 71, 255, 0)'}
           chartGridColor={'#949494'} chartScale={'day'} />
  </Provider>,
  document.getElementById('js-main')
);
// Simple chart
ReactDOM.render(
  <Provider store={store}>
    <Chart className={'lw-dashboard-chart'} chartData={chartSampleData} simple={true} simpleStrokeColor={'#ccc'}
           hideAxes={true} defaultWidth={150} defaultHeight={150*9/16} chartGridColor={'#949494'}
           chartScale={'week'} />
  </Provider>,
  document.getElementById('js-main')
);
*/
