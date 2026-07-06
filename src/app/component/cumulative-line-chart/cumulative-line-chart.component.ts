import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-cumulative-line-chart',
  templateUrl: './cumulative-line-chart.component.html',
  styleUrls: ['./cumulative-line-chart.component.css'],
})
export class CumulativeLineChartComponent implements OnInit, OnChanges {
  @Input() data;
  @Input() kpiId;
  @Input() xCaption;
  @Input() yCaption;
  currentDayIndex;
  visibleXAxisLbl = [];
  graphData;
  elem;
  @Input() onPopup = false;

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    this.elem = this.viewContainerRef.element.nativeElement;
    const baseGroups = this.data[0]['dataGroup']?.map((d) => ({ ...d })) || [];
    let forecasts = this.data[0]?.forecasts;
    const mergedGroups = [...baseGroups];
    if (Array.isArray(forecasts) && forecasts.length) {
      mergedGroups.push({
        filter: 'Forecast',
        value: forecasts.map((fc) => ({
          ...fc,
          kpiGroup:
            fc.kpiGroup === 'Predicted Completion'
              ? 'Planned Completion'
              : fc.kpiGroup || fc.kpi_group || 'Planned Completion',
          value: Number(fc.value ?? fc.data ?? 0),
          isForecast: true,
        })),
      });
    }
    const percentiles = this.resolveBenchmarkPercentiles(this.data?.[0]);
    this.graphData = mergedGroups;
    this.draw(percentiles);
  }

  draw(percentiles = null) {
    const elem = this.elem;
    this.visibleXAxisLbl = [];
    d3.select(elem).select('#chart').select('svg').remove();
    d3.select(elem).select('.yaxis-container').select('svg').remove();
    const margin = { top: 30, right: 22, bottom: 20, left: 10 };
    const width =
      d3.select(elem).select('#chart').node().offsetWidth -
      margin.left -
      margin.right;
    const height = 220 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3
      .select(elem)
      .select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const categories = [];
    const maxYValue = [];
    const minYValue = [];
    this.formatDateOnXAxis(this.graphData);

    this.graphData.forEach((d) => {
      const lineData = d.value;
      const lineDataCategorywise = {};
      const maxY = [];
      lineData.forEach((lineDetails) => {
        lineDataCategorywise[lineDetails.kpiGroup] = lineDetails;
        lineDetails['filter'] = d.filter;
        maxY.push(lineDetails['value']);
        if (!categories.includes(lineDetails['kpiGroup'])) {
          categories.push(lineDetails['kpiGroup']);
        }
      });
      d['lineDataCategorywise'] = lineDataCategorywise;
      maxYValue.push(Math.max(...maxY));
      minYValue.push(Math.min(...maxY));
    });

    const benchmarkValue = this.getBenchmarkValue(this.graphData, percentiles);
    if (benchmarkValue !== null) {
      maxYValue.push(benchmarkValue);
    }

    const xCoordinates = this.graphData.map((d) => d.filter);

    var x;
    if (xCoordinates.length === 1) {
      x = d3
        .scaleBand()
        .domain(xCoordinates)
        .range([width / 2 - 10, width / 2 + 10])
        .paddingOuter(0); // center the single point
    } else {
      x = d3.scaleBand().domain(xCoordinates).range([0, width]).paddingOuter(0);
    }

    /**X-Axis Gaps */
    const xLength = xCoordinates.length;
    let gap = 0;
    if (xLength <= 10) {
      gap = 1;
    } else if (xLength > 10 && xLength <= 30) {
      gap = 2;
    } else if (xLength > 30 && xLength <= 50) {
      gap = 3;
    } else if (xLength > 50 && xLength <= 70) {
      gap = 4;
    } else if (xLength > 70 && xLength <= 90) {
      gap = 5;
    } else if (xLength > 90 && xLength <= 110) {
      gap = 6;
    } else {
      gap = 7;
    }

    for (let i = 0; i < xCoordinates.length; i += gap) {
      this.visibleXAxisLbl.push(xCoordinates[i]);
    }
    if (!this.visibleXAxisLbl.includes(xCoordinates[xCoordinates.length - 1])) {
      this.visibleXAxisLbl[this.visibleXAxisLbl.length - 1] =
        xCoordinates[xCoordinates.length - 1];
    }
    /**X-Axis Gaps */

    const svgX = svg
      .append('g')
      .attr('class', 'xAxis')
      .attr('transform', `translate(0, ${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d, i) => (this.visibleXAxisLbl.includes(d) ? d : '')),
      );

    const yMin = Math.floor(Math.min(...minYValue) / 5) * 5;
    const yMax = Math.ceil(Math.max(...maxYValue) / 5) * 5;
    const y = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

    const svgY = d3
      .select(elem)
      .select('.yaxis-container')
      .append('svg')
      .attr('width', width + 50)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(50,${margin.top})`)
      .attr('class', 'yAxis')
      .call(d3.axisLeft(y).ticks(6).tickSize(0));

    // Add zero baseline if data contains negative values
    if (yMin < 0) {
      svg
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(0))
        .attr('y2', y(0))
        .attr('stroke', '#999')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,2');
    }

    // highlight todays Date
    if (this.currentDayIndex >= 0) {
      svg
        .select('.xAxis')
        .selectAll(`.tick:nth-of-type(${this.currentDayIndex + 1}) text`)
        .style('color', '#079FFF');
    }

    //Add horizontal  gridlines for each y tick
    svgY
      .append('g')
      .selectAll('line.gridline')
      .data(y.ticks(6))
      .enter()
      .append('svg:line')
      .attr('x1', 0)
      .attr('x2', width + 50)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .style('stroke', '#dedede')
      .style('fill', 'none')
      .attr('class', 'gridline');

    //Add vertical gridlines for each x tick
    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .selectAll('line.gridline')
      .data(xCoordinates)
      .enter()
      .append('svg:line')
      .attr('x1', (d) => x(d) + x.bandwidth() / 2)
      .attr('x2', (d) => x(d) + x.bandwidth() / 2)
      .attr('y1', 0)
      .attr('y2', -height)
      .style('stroke', '#dedede')
      .style('stroke-dasharray', '4,4')
      .style('fill', 'none')
      .attr('class', 'gridline');

    const color = d3
      .scaleOrdinal()
      .domain(categories)
      // .range(['#5AA5A2', '#4472C4', '#D99748', '#CDBA38', '#D8725F']);
      .range(['#FBCF5F', '#6079C5', '#A4F6A5', '#83A1C1']);
    const tooltipContainer = d3.select(elem).select('.tooltip-container');

    const showTooltip = (linedata) => {
      tooltipContainer
        .selectAll('div')
        .data(linedata)
        .join('div')
        .attr('class', 'tooltip')
        .style('left', (d) => x(d.filter) + x.bandwidth() / 2 + 'px')
        .style('top', (d) => y(d.value) + 8 + 'px')
        .text((d) => d.value)
        .transition()
        .duration(500)
        .style('display', 'block')
        .style('opacity', 1);
    };
    const hideTooltip = () => {
      tooltipContainer
        .selectAll('.tooltip')
        .transition()
        .duration(500)
        .style('display', 'none')
        .style('opacity', 0);
      tooltipContainer.selectAll('.tooltip').remove();
    };

    // Define the div for circle tooltip only
    const circleToolTipContainer = d3
      .select(this.elem)
      .select('#container')
      .append('div')
      .attr('class', 'tooltip')
      .style('display', 'none')
      .style('opacity', 0);

    for (const kpiGroup of categories) {
      const lineData = this.graphData
        .filter((d) => d['lineDataCategorywise'].hasOwnProperty(kpiGroup))
        .map((d) => d['lineDataCategorywise'][kpiGroup]);
      if (lineData.length === 1) {
        const isForecastPoint = lineData[0]?.isForecast;
        // Just draw a single point instead of a line
        svg
          .append('circle')
          .attr('cx', x(lineData[0]?.filter) + x.bandwidth() / 2)
          .attr('cy', y(lineData[0]?.value))
          .attr('r', 4)
          .attr('fill', color(kpiGroup))
          .style('stroke-width', 2)
          .style('fill', 'none')
          .style('pointer-events', 'all')
          .style('cursor', 'pointer')
          .on('mouseover', function (event, linedata) {
            d3.select(this).style('stroke-width', 4);
            showTooltip(linedata);
          })
          .on('mouseout', function (event, d) {
            if (isForecastPoint) {
              return;
            }
            d3.select(this).style('stroke-width', 2);
            hideTooltip();
          });
      } else {
        const forecastIndex = lineData.findIndex((p: any) => p?.isForecast);
        const actualPoints =
          forecastIndex > -1 ? lineData.slice(0, forecastIndex + 1) : lineData;
        const solidPoints =
          forecastIndex > -1 ? actualPoints.slice(0, -1) : actualPoints;
        if (solidPoints.length) {
          svg
            .append('g')
            .attr('transform', `translate(0,0)`)
            .append('path')
            .datum(solidPoints)
            .attr(
              'd',
              d3
                .line()
                .x((d) => x(d.filter) + x.bandwidth() / 2)
                .y((d) => y(d.value)),
            )
            .attr('stroke', (d) => color(kpiGroup))
            .style('stroke-width', 2)
            .style('fill', 'none')
            .style('cursor', 'pointer')
            .on('mouseover', function (event, linedata) {
              d3.select(this).style('stroke-width', 4);
              showTooltip(actualPoints);
            })
            .on('mouseout', function (event, d) {
              d3.select(this).style('stroke-width', 2);
              hideTooltip();
            });
        }

        if (forecastIndex > -1) {
          const forecastPoint = lineData[forecastIndex];
          const lastActualPoint = [...lineData]
            .filter((p) => !p?.isForecast)
            .slice(-1)[0];
          const seg =
            lastActualPoint && forecastPoint
              ? [lastActualPoint, forecastPoint]
              : null;

          if (seg) {
            svg
              .append('g')
              .attr('transform', `translate(0,0)`)
              .append('path')
              .datum(seg)
              .attr(
                'd',
                d3
                  .line()
                  .x((d: any) => x(d?.filter) + x.bandwidth() / 2)
                  .y((d: any) => y(d?.value)),
              )
              .attr('stroke', (d: any) => color(kpiGroup))
              .style('stroke-width', 2)
              .style('fill', 'none')
              .style('stroke-dasharray', '4 4')
              .style('cursor', 'pointer')
              .on('mouseover', function (event) {
                d3.select(this).style('stroke-width', 4);
                showTooltip(actualPoints);
              })
              .on('mouseout', function (event) {
                d3.select(this).style('stroke-width', 2);
                hideTooltip();
              });
          }
        }
      }

      const circlegroup = svg
        .append('g')
        .attr('class', 'circle-group')
        .attr('transform', `translate(0,0)`)
        .selectAll('circle')
        .data(lineData)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.filter) + x.bandwidth() / 2)
        .attr('cy', (d) => y(d.value))
        .attr('r', 3)
        .style('stroke-width', 5)
        .attr('stroke', 'transparent')
        .attr('fill', color(kpiGroup))
        .style('pointer-events', 'all')
        .on('mouseover', function (event, d) {
          // This hover will triger for the circle only i.e. if data have hovervalue then it will appear for same otherwise on circle hover it will show the all joint line data.
          if (d && d?.hoverValue) {
            d3.select(this)
              .transition()
              .duration(500)
              .style('cursor', 'pointer')
              .attr('r', 3)
              .style('stroke-width', 10);
            circleToolTipContainer
              .transition()
              .duration(200)
              .style('display', 'block')
              .style('position', 'fixed')
              .style('opacity', 0.9);

            const circle = event.target;
            const { top: yPosition, left: xPosition } =
              circle.getBoundingClientRect();

            let htmlString = '';
            Object.keys(d?.hoverValue).forEach((key) => {
              htmlString += `<div class="tooltip-content"><span>${key}:</span> <span>${d?.hoverValue?.[key]}</span></div>`;
            });

            circleToolTipContainer
              .html(htmlString)
              .style('left', xPosition + 'px')
              .style('top', yPosition + 20 + 'px');
          } else {
            d3.select(this)
              .transition()
              .duration(500)
              .style('cursor', 'pointer')
              .attr('r', 3)
              .style('stroke-width', 10);
            showTooltip(lineData);
          }
        })
        .on('mouseout', function (event, d) {
          if (d && d?.hoverValue) {
            circleToolTipContainer
              .transition()
              .duration(500)
              .style('display', 'none')
              .style('opacity', 0);
          } else {
            d3.select(this)
              .transition()
              .duration(500)
              .attr('r', 3)
              .style('stroke-width', 5);
            hideTooltip();
          }
        });
    }

    // Benchmark Line
    /* if (benchmarkValue !== null) {
      const tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'benchmark-tooltip')
        .style('position', 'absolute')
        .style('background', '#202429')
        .style('color', '#fff')
        .style('padding', '6px 10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);

      const yVal = y(benchmarkValue);

      svg
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yVal)
        .attr('y2', yVal)
        .style('stroke', '#15BA40')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '4,4')
        .style('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
          tooltip.style('opacity', 1).html('Recommended Target');
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 20 + 'px');
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 20 + 'px');
        })
        .on('mouseout', () => {
          tooltip.style('opacity', 0);
        });

      // Label
      svg
        .append('text')
        .attr('x', width)
        .attr('y', yVal - 5)
        .attr('text-anchor', 'end')
        .style('fill', '#15BA40')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(benchmarkValue);
    } */
    //Add xCaption
    d3.select(elem)
      .select('#container')
      .select('.x-caption span')
      .text(this.xCaption);

    //Add YCaption
    d3.select(elem)
      .select('.yaxis-container')
      .append('div')
      .attr('class', 'y-caption')
      .style('margin-left', '-5px')
      .append('span')
      .text(this.yCaption);

    const legendDiv = d3
      .select(elem)
      .select('#legendContainer')
      .style('margin-left', 60 + 'px');

    legendDiv
      .transition()
      .duration(200)
      .style('display', 'block')
      .style('opacity', 1)
      .attr('class', 'p-d-flex p-flex-wrap normal-legend');

    let htmlString = '';

    categories.forEach((d) => {
      htmlString += `<div class="legend_item"><div class="legend_color_indicator" style="background-color: ${color(
        d,
      )}"></div> <span class="p-m-1"> ${d}</span></div>`;
    });

    legendDiv.html(htmlString).style('bottom', 0 + 'px');

    if (this.kpiId === 'kpi125') {
      const dottedLineData = this.generateDottedLineDataForKpi();
      categories.push(this.data[0].additionalGroup[0]);
      svg
        .append('g')
        .attr('transform', `translate(0,0)`)
        .append('path')
        .datum(dottedLineData)
        .attr(
          'd',
          d3
            .line()
            .x((d) => x(d.filter) + x.bandwidth() / 2)
            .y((d) => y(d.value)),
        )
        .attr('stroke', '#D8725F')
        .style('stroke-width', 3)
        .style('stroke-dasharray', '4,4')
        .style('fill', 'none')
        .style('cursor', 'pointer')
        .on('mouseover', function (event, linedata) {
          d3.select(this).style('stroke-width', 5);
          showTooltip(linedata);
        })
        .on('mouseout', function (event, d) {
          d3.select(this).style('stroke-width', 3);
          hideTooltip();
        });

      htmlString += `<div class="legend_item"><div class="legend_color_indicator_dashed"></div> <span class="p-m-1"> ${this.data[0].additionalGroup[0]}</span></div>`;
      legendDiv.html(htmlString);
    }
  }

  formatDateOnXAxis(data) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
    return data.map((d, i) => {
      if (Array.isArray(d?.value) && d.value.some((p) => p?.isForecast)) {
        d['filter'] = 'Forecast';
        return d;
      }

      const date = new Date(d['filter']);
      const currentDate = new Date();

      if (date.toDateString() === currentDate.toDateString()) {
        this.currentDayIndex = i;
      }
      d['filter'] = `${days[date.getDay()]} ${
        date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
      }/${
        date.getMonth() + 1 < 10
          ? '0' + (date.getMonth() + 1)
          : date.getMonth() + 1
      }`;
      return d;
    });
  }

  generateDottedLineDataForKpi() {
    const dottedLineData = [];
    if (this.data[0].additionalGroup) {
      const dottedLineDataIndex = this.graphData.findIndex((d) =>
        d['lineDataCategorywise'].hasOwnProperty('Predicted Completion'),
      );
      if (dottedLineDataIndex !== -1) {
        const startlineDataPoint = {
          ...this.graphData[dottedLineDataIndex]['lineDataCategorywise'][
            'Predicted Completion'
          ],
          kpiGroup: this.data[0].additionalGroup[0],
        };
        let endlineDataPoint;
        dottedLineData.push(startlineDataPoint);
        if (
          this.graphData[
            dottedLineDataIndex
          ].lineDataCategorywise.hasOwnProperty('Completion Till Date')
        ) {
          endlineDataPoint = {
            ...this.graphData[dottedLineDataIndex]['lineDataCategorywise'][
              'Completion Till Date'
            ],
            kpiGroup: this.data[0].additionalGroup[0],
          };
        } else {
          endlineDataPoint = {
            ...this.graphData[dottedLineDataIndex - 1]['lineDataCategorywise'][
              'Completion Till Date'
            ],
            kpiGroup: this.data[0].additionalGroup[0],
          };
        }
        dottedLineData.push(endlineDataPoint);
      }
    }
    return dottedLineData;
  }

  getBenchmarkValue(
    mergedGroups: any[],
    percentiles?: Record<string, number>,
  ): number | null {
    if (!mergedGroups?.length || !percentiles) {
      return null;
    }

    // Find highest actual value across all groups (excluding forecast)
    let highestActualValue = 0;
    mergedGroups.forEach((group) => {
      const groupMax = Math.max(
        ...group.value
          .filter((p) => !p?.isForecast)
          .map((p) => Number(p?.value ?? p?.data))
          .filter(Number.isFinite),
      );
      if (groupMax > highestActualValue) {
        highestActualValue = groupMax;
      }
    });

    const sortedPercentiles = [
      percentiles['seventyPercentile'],
      percentiles['eightyPercentile'],
      percentiles['nintyPercentile'],
    ]
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    // Logic: Find lowest percentile > max value. If max > all, use highest percentile.
    const result =
      sortedPercentiles.find((val) => val > highestActualValue) ??
      sortedPercentiles[sortedPercentiles.length - 1];
    return Number.isFinite(result) ? Math.round(result) : result;
  }

  resolveBenchmarkPercentiles(
    dataEntry?: Record<string, any>,
  ): Record<string, number> | null {
    return dataEntry?.['benchmarkPercentiles']
      ? dataEntry['benchmarkPercentiles']
      : null;
  }
}
