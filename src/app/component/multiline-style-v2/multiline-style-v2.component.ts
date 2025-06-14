/*******************************************************************************
 * Copyright 2014 CapitalOne, LLC.
 * Further development Copyright 2022 Sapient Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

import {
  Component,
  Input,
  ViewContainerRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';

import * as d3 from 'd3';
import { SharedService } from 'src/app/services/shared.service';
@Component({
  selector: 'app-multiline-style-v2',
  templateUrl: './multiline-style-v2.component.html',
  styleUrls: ['./multiline-style-v2.component.css'],
})
export class MultilineStyleV2Component implements OnChanges, OnDestroy, OnInit {
  @Input() data: any; // json data
  @Input() thresholdValue: any;
  @Input() name: string; // name of kpi
  @Input() kpiId: string; // id of the kpi
  @Input() yCaption: string; // label at y axis
  @Input() isChildComponent: boolean;
  @Input() xCaption: string;
  @Input() unit?: string;
  @Input() color?: Array<string>;
  @Input() selectedtype: string;
  elem;
  @Input() source: string = '';
  sprintList: Array<any> = [];
  height: number = 0;
  @Input() viewType: string = 'chart';
  hierarchyLevel: string = '';
  @Input() xAxisLabel: string;
  @Input() yAxisLabel: string;

  resizeObserver = new ResizeObserver((entries) => {
    this.draw();
  });

  counter: number = 0;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private service: SharedService,
  ) {
    // used to make chart independent from previous made chart
    this.elem = this.viewContainerRef.element.nativeElement;
  }

  ngOnInit(): void {
    this.service.showTableViewObs.subscribe((view) => {
      this.viewType = view;
    });
    this.hierarchyLevel = JSON.parse(
      localStorage.getItem('selectedTrend'),
    )[0].labelName;
  }

  // Runs when property "data" changed
  ngOnChanges(changes: SimpleChanges) {
    if (this.selectedtype?.toLowerCase() === 'kanban') {
      this.xCaption = this.service.getSelectedDateFilter();
    }
    if (Object.keys(changes)?.length > 0) {
      this.draw();
    } else {
      d3.select(this.elem).select('svg').remove();
      d3.select(this.elem).select('.bstimeslider').remove();
      this.draw();
    }
  }

  transformData(data, lineTypes) {
    const transformedData = [];
    for (let i = 0; i < data.length; i++) {
      const { value, ...projectInfo } = data[i];
      const newData = value.map((dataPoint) => {
        const { dataValue, ...rest } = dataPoint;
        return dataValue.map((d) => ({ ...d, ...rest }));
      });

      const newLineData = lineTypes.map((lineType) => ({
        ...projectInfo,
        value: newData.map((d) =>
          d.find((lineData) => lineData.lineType === lineType),
        ),
      }));
      transformedData.push(...newLineData);
    }
    return transformedData;
  }

  draw() {
    const viewType = this.viewType;
    const selectedProjectCount = this.service.getSelectedTrends().length;
    const sprintList = this.data[0]?.value.map(
      (details) => details.sSprintName,
    );
    const dataCategory = this.data.map((d) => d.data);
    const lineTypes = this.data[0]?.value[0].dataValue.map(
      (lineData) => lineData.lineType,
    );
    const lineDetails = this.data[0]?.value[0].dataValue.map(
      (lineData) => lineData.name,
    );
    const formattedData = this.transformData(this.data, lineTypes);

    // this is used for removing svg already made when value is updated
    d3.select(this.elem).select('#verticalSVG').select('svg').remove();
    d3.select(this.elem).select('#horizontalSVG').select('svg').remove();
    d3.select(this.elem).select('#xCaptionContainer').select('text').remove();
    d3.select(this.elem)
      .select('#horizontalSVG')
      .select('tooltip-container')
      .remove();
    d3.select(this.elem).select('#xCaptionContainer').select('div').remove();

    const data = formattedData;
    const thresholdValue = this.thresholdValue;
    const elem = this.elem;
    let width = 450;
    const height =
      viewType === 'large' && selectedProjectCount === 1 ? 280 : 230;
    this.height = height;
    const margin = 60;
    const duration = 250;
    const lineOpacity = '1';
    const lineOpacityHover = '0.85';
    const otherLinesOpacityHover = '0.1';
    const lineStroke = '2px';
    const lineStrokeHover = '4px';
    const circleOpacity = '1';
    const circleOpacityOnLineHover = '0.25';
    const circleRadius = 3;
    const circleRadiusHover = 4;
    const marginLeft = 40;
    const marginTop = 35;
    const color = this.color;
    const kpiId = this.kpiId;
    const showUnit = this.unit;
    const containerWidth =
      d3.select(this.elem).select('#graphContainer').node().offsetWidth ||
      window.innerWidth;
    const resizeWidth =
      containerWidth > data[0]?.value.length * 20 * 8
        ? containerWidth
        : data[0]?.value.length * 20 * 8;
    width = data.length <= 5 ? containerWidth - 70 : resizeWidth;
    let maxXValueCount = 0;
    let maxObjectNo = 0;
    let maxYValue = 0;

    // used to find object whose value is max on x axis
    for (const maxCount in data) {
      if (maxXValueCount < data[maxCount].value.length) {
        maxXValueCount = data[maxCount].value.length;
        maxObjectNo = parseInt(maxCount, 10);
      }
    }

    // used to find maxvalue of y axis
    for (const i in data) {
      for (let j = 0; j < data[i].value.length; j++) {
        data[i].value[j].xName = data[i]?.value[j]?.hasOwnProperty('xAxisTick')
          ? data[i]?.value[j]?.xAxisTick
          : j + 1;
        if (maxYValue < parseInt(data[i].value[j].value, 10)) {
          maxYValue = data[i].value[j].value;
        }
      }
    }

    if (maxYValue === 0) {
      maxYValue = 50;
    }

    if (thresholdValue && thresholdValue !== '') {
      if (thresholdValue > maxYValue) {
        maxYValue = thresholdValue;
      }
    }

    /* Format Data */
    data.forEach(function (d) {
      d.value.forEach(function (dataObj: { value: number }) {
        dataObj.value = +dataObj.value;
      });
    });

    const colorCategory =
      color && d3.scaleOrdinal().domain(dataCategory).range(color);

    let xScale;
    if (viewType === 'large' && selectedProjectCount === 1) {
      xScale = d3
        .scaleBand()
        .rangeRound([0, width - margin])
        .padding(0)
        .domain(sprintList);
    } else {
      xScale = d3
        .scaleBand()
        .rangeRound([0, width - margin])
        .padding(0)
        .domain(
          data[maxObjectNo]?.value?.map(function (d, i) {
            return i + 1;
          }),
        );
    }

    let divisor = 10;
    let power = 1;
    let quotient = maxYValue;
    while (quotient >= 1) {
      quotient = quotient / Math.pow(divisor, power);
      ++power;
    }
    divisor = Math.pow(10, power > 1 ? power - 1 : 1);
    if (maxYValue >= 0 && maxYValue <= 5) {
      maxYValue = 5;
    } else if (maxYValue > 5 && maxYValue <= 50) {
      maxYValue = 50;
    } else if (maxYValue > 50 && maxYValue <= 100) {
      maxYValue = 100;
    } else if (maxYValue > 100 && maxYValue <= 200) {
      maxYValue = 200;
    } else if (maxYValue > 200 && maxYValue <= 500) {
      maxYValue = 500;
    } else if (maxYValue > 500) {
      maxYValue += divisor;
    }

    if (this.kpiId === 'kpi149') {
      maxYValue = 5;
    }

    const yScale = d3
      .scaleLinear()
      .domain([0, maxYValue])
      .range([height - margin, 0]);

    if (selectedProjectCount === 1) {
      d3.select(this.elem).select('#horizontalSVG').select('div').remove();
      d3.select(this.elem)
        .select('#horizontalSVG')
        .select('tooltip-container')
        .remove();
      /** Adding tooltip container */
      const tooltipContainer = d3
        .select(this.elem)
        .select('#horizontalSVG')
        .append('div')
        .attr('class', 'tooltip-container')
        .attr('height', height + 35 + 'px')
        .attr('width', width + 'px');

      tooltipContainer
        .selectAll('div')
        .data(data[0].value)
        .join('div')
        .attr('class', 'tooltip2')
        .style('left', (d, i) => {
          let left = d.date || d.sSprintName;
          if (viewType === 'large') {
            return xScale(left) + xScale.bandwidth() / 2 - 5 + 'px';
          } else {
            return xScale(i + 1) + xScale.bandwidth() / 2 - 5 + 'px';
          }
        })
        .style('top', (d) => {
          return yScale(d.value) + 7 + 'px';
        })
        .text((d) => Math.round(d.value * 100) / 100 + ' ' + showUnit)
        .transition()
        .duration(500)
        .style('display', 'block')
        .style('opacity', 1);
    } else {
      d3.select(this.elem).select('#horizontalSVG').select('div').remove();
      d3.select(this.elem)
        .select('#horizontalSVG')
        .select('tooltip-container')
        .remove();
    }

    /* Add SVG */

    const svgX = d3
      .select(this.elem)
      .select('#horizontalSVG')
      .append('svg')
      .attr('height', height + 35 + 'px')
      .attr('width', width + 'px')
      .style('text-align', 'center')
      .append('g')
      .attr('transform', `translate(${0}, ${marginTop})`);

    const svgY = d3
      .select(this.elem)
      .select('#verticalSVG')
      .append('svg')
      .attr('width', '50px')
      .attr('height', height + 35 + 'px')
      .style('text-align', 'center')
      .append('g')
      .attr('transform', `translate(${marginLeft + 15}, ${marginTop})`);

    /* Invoke the tip in the context of your visualization */

    // Define the div for the tooltip
    const div = d3
      .select(this.elem)
      .select('#multiLine')
      .append('div')
      .attr('class', 'tooltip')
      .style('display', 'none')
      .style('opacity', 0);

    /* Add Axis into SVG */
    const xAxis = d3.axisBottom(xScale);
    /*var xAxis = d3.axisBottom(xScale).ticks(7);
     */
    const yAxis = d3.axisLeft(yScale).ticks(5);

    const XCaptionSVG = d3
      .select(this.elem)
      .select('#xCaptionContainer')
      .append('text');

    svgX
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height - margin})`)
      .call(xAxis);

    const XCaption = XCaptionSVG.append('text')
      .attr('x', width / 2 - 24)
      .attr('y', 46)
      .attr('transform', 'rotate(0)')
      .attr('fill', '#437495')
      .attr('font-size', '12px');

    this.xCaption = this.xCaption ? this.xCaption : this.xAxisLabel;
    // -- Fallback, incase this.xAxisLabel is also empty/undefined
    this.xCaption = this.xCaption ? this.xCaption : 'Sprints';
    XCaption.text(this.xCaption);

    /* if (kpiId === 'kpi114' || kpiId === 'kpi74' || kpiId === 'kpi997') {
      XCaption.text('Months');
    } */

    // this is used for adding horizontal lines in graph
    const YCaption = svgY
      .append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('x', -30)
      .attr('y', -45)
      .attr('transform', 'rotate(-90)')
      .attr('fill', '#437495')
      .attr('font-size', '12px');

    // adding yaxis caption
    this.yCaption = this.yCaption ? this.yCaption : this.yAxisLabel;
    // -- Fallback, incase this.yAxisLabel is also empty/undefined
    this.yCaption = this.yCaption ? this.yCaption : 'Values';
    YCaption.text(this.yCaption);

    // threshold line
    if (thresholdValue && thresholdValue !== '') {
      svgX
        .append('svg:line')
        .attr('x1', 0)
        .attr('x2', width - margin - 10)
        .attr('y1', yScale(thresholdValue))
        .attr('y2', yScale(thresholdValue))
        .style('stroke', '#333333')
        .style('stroke-dasharray', '4,4')
        .attr('class', 'thresholdline');
      svgX
        .append('text')
        .attr('x', width - 40)
        .attr('y', yScale(thresholdValue))
        .attr('dy', '.5em')
        .attr('text-anchor', 'end')
        .text(this.thresholdValue)
        .attr('class', 'thresholdlinetext');
    }

    // gridlines
    svgX
      .selectAll('line.gridline')
      .data(yScale.ticks(5))
      .enter()
      .append('svg:line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', function (d) {
        return yScale(d);
      })
      .attr('y2', function (d) {
        return yScale(d);
      })
      .style('stroke', '#dedede')
      .style('fill', 'none')
      .attr('class', 'gridline');

    const xAxisGrid = d3
      .axisBottom(xScale)
      .tickSize(-(height - 60))
      .tickFormat('')
      .ticks(5);
    svgX
      .append('g')
      .attr('class', 'y-axis-grid')
      .call(xAxisGrid)
      .attr('transform', `translate(${0}, ${height - 60})`);

    d3.select(this.elem)
      .select('.y-axis-grid')
      .selectAll('line')
      .style('stroke', '#EAEDF0')
      .style('fill', 'none');

    d3.select(this.elem)
      .select('#horizontalSVG')
      .select('.x-axis')
      .selectAll('.tick line')
      .style('display', 'none');

    d3.select(this.elem)
      .select('#verticalSVG')
      .select('.y.axis')
      .selectAll('.tick line')
      .style('display', 'none');

    d3.select(this.elem)
      .select('#horizontalSVG')
      .select('.x-axis')
      .select('.domain')
      .style('display', 'none');

    /* Add line into SVG acoording to data */
    const line = d3
      .line()
      .x((d, i) => {
        if (viewType === 'large' && selectedProjectCount === 1) {
          return xScale(d.date || d.sSprintName);
        } else {
          return xScale(i + 1);
        }
      })
      .y((d) => yScale(d.value));

    const lines = svgX
      .append('g')
      .attr('class', 'lines')
      .attr('transform', `translate(${xScale.bandwidth() / 2}, ${0})`);

    function tweenDash() {
      const l = this.getTotalLength();
      const i = d3.interpolateString('0,' + l, l + ',' + l);
      return function (t) {
        return i(t);
      };
    }

    function transition(path) {
      path
        .transition()
        .duration(1500)
        .attrTween('stroke-dasharray', tweenDash)
        .on('end', () => {
          d3.select(this).call(transition);
        });
    }

    lines
      .selectAll('.line-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'line-group')
      .on('mouseover', function (d, i) {
        svgX
          .append('text')
          .attr('class', 'title-text')
          .text(d.data)
          .attr('text-anchor', 'middle')
          .attr('x', (width - margin) / 2)
          .attr('y', -10);
      })
      .on('mouseout', function (d) {
        svgX.select('.title-text').remove();
      })
      .append('path')
      .attr('class', function (d, i) {
        const className = 'line' + i;
        return 'line ' + className;
      })
      .attr('d', (d) => line(d.value))
      .call(transition)
      .style('stroke', (d, i) => colorCategory && colorCategory(d.data))
      .style('stroke-dasharray', (d) => {
        if (d.value[0].lineType === 'dotted') {
          return '4,4';
        }
      })
      .style('opacity', lineOpacity)
      .style('fill', 'none')
      .style('stroke-width', '2')
      .on('mouseover', function (d) {
        d3.select(elem)
          .selectAll('.line')
          .style('opacity', otherLinesOpacityHover);
        d3.select(elem)
          .selectAll('.circle')
          .style('opacity', circleOpacityOnLineHover);
        d3.select(this)
          .style('opacity', lineOpacityHover)
          .style('stroke-width', lineStrokeHover)
          .style('cursor', 'pointer');
      })
      .on('mouseout', function (d) {
        d3.selectAll('.line').style('opacity', lineOpacity);
        d3.selectAll('.circle').style('opacity', circleOpacity);
        d3.select(this)
          .style('stroke-width', lineStroke)
          .style('cursor', 'none');
      });

    /* Add circles (data) on the line */
    lines
      .selectAll('circle-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', function (d, i) {
        return 'circlegroup' + i;
      })
      .style('fill', (d, i) => colorCategory && colorCategory(d.data))
      .style('stroke', (d, i) => colorCategory && colorCategory(d.data))
      .selectAll('circle')
      .data((d) => d.value)
      .enter()
      .append('g')
      .attr('class', 'circle')
      .on('mouseover', function (event, d) {
        const topValue = 80;
        if (d.hoverValue) {
          div
            .transition()
            .duration(200)
            .style('display', 'block')
            .style('position', 'fixed')
            .style('opacity', 0.9);

          const circle = event.target;
          const { top: yPosition, left: xPosition } =
            circle.getBoundingClientRect();

          div
            .html(
              `${d.date || d.sSprintName}` +
                ' : ' +
                "<span class='toolTipValue'> " +
                `${Math.round(d.value * 100) / 100 + ' ' + showUnit}` +
                '</span>',
            )
            .style('left', xPosition - 50 + 'px')
            // .style('top', yScale(d.value) - topValue + 'px');
            .style('top', yPosition + 20 + 'px');
          for (const hoverData in d.hoverValue) {
            div
              .append('p')
              .html(
                `${hoverData}` +
                  ' : ' +
                  "<span class='toolTipValue'> " +
                  `${d.hoverValue[hoverData]}` +
                  ' </span>',
              );
          }
        }
      })
      .on('mouseout', function (d) {
        div
          .transition()
          .duration(500)
          .style('display', 'none')
          .style('opacity', 0);
      })
      .append('circle')
      .attr('cx', function (d, i) {
        if (viewType === 'large' && selectedProjectCount === 1) {
          return xScale(d.date || d.sSprintName);
        } else {
          return xScale(i + 1);
        }
      })
      .attr('cy', (d) => yScale(d.value))
      .attr('r', circleRadius)
      .style('stroke-width', 1)
      .style('opacity', circleOpacity)
      .on('mouseover', function (d) {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr('r', circleRadiusHover);
      })
      .on('mouseout', function (d) {
        d3.select(this).transition().duration(duration).attr('r', circleRadius);
      });

    // used to allign data on x axis ticks
    svgX
      .select('.x')
      .selectAll('.tick')
      .each(function (dataObj) {
        const tick = d3.select(this);
        if (data[0]?.value[0] && data[0]?.value[0]?.xAxisTick) {
          const textElement = this.getElementsByTagName('text');
          textElement[0].textContent = data[0].value[dataObj - 1]?.xAxisTick;
        }
        const string = tick.attr('transform');
        const translate = string
          .substring(string.indexOf('(') + 1, string.indexOf(')'))
          .split(',');
        translate[0] = parseInt(translate[0], 10);
        tick.attr(
          'transform',
          'translate(' + translate[0] + ',' + translate[1] + ')',
        );
        if (dataObj === 1) {
          svgX
            .select('.lines')
            .attr(
              'transform',
              'translate(' + translate[0] + ',' + translate[1] + ')',
            );
        }
      });

    const legendContainer = d3
      .select(this.elem)
      .select('#xCaptionContainer')
      .append('div')
      .attr('class', 'legend-container')
      .style('position', 'relative');

    const legend = legendContainer
      .append('div')
      .append('svg')
      .attr('height', 30)
      .attr('width', 100)
      .attr('cursor', 'pointer')
      .append('g')
      .attr('class', 'd3-legend');

    legend
      .append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('x', 32)
      .attr('y', 7)
      .style('fill', (d, i) => '#DF9292');

    legend
      .append('text')
      .attr('x', 52)
      .attr('y', 8)
      .attr('dy', '.85em')
      .style('text-anchor', 'start')
      .style('font-size', 10)
      .text((d) => 'Legend');

    const legendTooltip = legendContainer
      .append('div')
      .style('position', 'absolute')
      .attr('class', 'legend-tooltip');

    legend
      .on('mouseover', () => {
        legendTooltip
          .transition()
          .duration(200)
          .style('display', 'flex')
          .style('opacity', 1)
          .style('padding', '20px 10px')
          .style('max-width', 'unset')
          .style('width', '400px');

        let htmlString = ``;
        for (let d of dataCategory) {
          htmlString += `<div>`;
          lineTypes.forEach((lineType, i) => {
            htmlString += `<div class="legend-item"><span>${
              lineDetails[i]
            }: &nbsp &nbsp</span><div class="legend_color_indicator_dashed" style="border-top:  ${
              lineType === 'solid' ? '3px solid ' : '3px dashed '
            }${colorCategory(
              d,
            )}"></div> <span class="p-m-1">&nbsp${d} </span></div>`;
          });
          htmlString += `</div>`;
        }

        legendTooltip
          .html(htmlString)
          .style('left', 80 + 'px')
          .style('top', -60 + 'px');
      })
      .on('mouseout', () => {
        legendTooltip
          .transition()
          .duration(500)
          .style('display', 'none')
          .style('opacity', 0)
          .style('padding', '5px')
          .style('max-width', '220px')
          .style('width', 'auto');
      });

    const content = this.elem.querySelector('#horizontalSVG');
    content.scrollLeft += width;

    if (
      this.hierarchyLevel === 'project' &&
      kpiId !== 'kpi166' &&
      kpiId !== 'kpi156' &&
      kpiId !== 'kpi116' &&
      kpiId !== 'kpi118' &&
      kpiId !== 'kpi13' &&
      kpiId !== 'kpi170' &&
      kpiId !== 'KPI127' &&
      kpiId !== 'kpi997' &&
      kpiId !== 'kpi184'
    ) {
      this.renderSprintsLegend(this.flattenData(this.data), this.xCaption);
    }
  }

  ngAfterViewInit() {
    this.resizeObserver.observe(
      d3.select(this.elem).select('#graphContainer').node(),
    );
  }

  flattenData(data) {
    let sprintMap = new Map();
    let sprintCounter = 1;

    data.forEach((project) => {
      const projectName = project.data.trim();
      project.value.forEach((sprint, index) => {
        const xAxisLabelName = sprint;
        const sprintKey = index;

        if (!sprintMap.has(sprintKey)) {
          sprintMap.set(sprintKey, {
            sprintNumber: sprintCounter++,
            projects: {},
            sprints: [],
          });
        }

        const sprintEntry = sprintMap.get(sprintKey);
        const sprintData = sprintEntry.projects;

        // Add sprint name if not already present
        const xAxisName =
          xAxisLabelName.sSprintName?.trim() || xAxisLabelName.date?.trim();
        if (xAxisName && !sprintEntry.sprints.includes(xAxisName)) {
          sprintEntry.sprints.push(xAxisName);
        }

        // Assign hoverValue data
        sprintData[projectName] = Object.keys(sprint.hoverValue || {}).reduce(
          (acc, key) => {
            acc[key] = sprint.hoverValue[key] || 0;
            return acc;
          },
          {},
        );
      });
    });

    return Array.from(sprintMap.values());
  }

  renderSprintsLegend(data, xAxisCaption) {
    this.counter++;
    if (this.counter === 1) {
      const legendData = data.map((item) => {
        return {
          sprintNumber: item.sprintNumber,
          sprintLabel: item.sprints.join(', '),
        };
      });

      // Select the body and insert the legend container at the top
      const body = d3.select(this.elem);

      const container = body
        .insert('div') // Insert at top of body
        .attr('class', 'sprint-legend-container')
        .style('margin', '20px 0 0 0')
        .style('font-family', 'Arial, sans-serif')
        .style('font-size', '14px')
        .style('max-width', '100%');

      // Toggle Button
      const toggleButton = container
        .append('button')
        .style('margin', '0 0 10px 0')
        .style('padding', '0')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .style('background', 'none')
        .style('border', 'none')
        .style('color', '#0b4bc8')
        .style('text-decoration', 'underline')
        .style('text-underline-offset', '5px')
        .attr('class', 'p-element p-component')
        .on('click', function () {
          const isVisible = legend.style('display') !== 'none';
          legend.style('display', isVisible ? 'none' : 'block');
          legend.style('aria-hidden', isVisible ? 'true' : 'false');
          legend.style('tabindex', isVisible ? '-1' : '0');
          toggleButton.text(
            isVisible ? 'Show X-Axis Legend' : 'Hide X-Axis Legend',
          );
        });

      // Legend Box
      const legend = container
        .append('div')
        .attr('class', 'sprint-legend')
        .style('padding', '0')
        .style('border', '1px solid #ddd')
        .style('border-radius', '6px')
        .style('margin-top', '10px')
        .attr('role', 'region')
        .attr('aria-labelledby', 'legend-title');

      if (this.source === 'fromReport') {
        legend.style('display', 'block'); // Hide the legend by default
        toggleButton.text('Hide X-Axis Legend');
        legend.attr('aria-hidden', 'false');
      } else {
        legend.style('display', 'none'); // Show the legend by default
        legend.attr('aria-hidden', 'true');
        toggleButton.text('Show X-Axis Legend');
      }

      // Wrap the table in a scrollable container
      const scrollContainer = legend
        .append('div')
        .style('overflow-x', 'auto') // Make horizontally scrollable on small screens
        .style('max-width', '100%');

      // Create the table inside scroll container
      const table = scrollContainer
        .append('table')
        .attr('role', 'table')
        .style('width', '100%')
        .style('border-collapse', 'collapse')
        .style('min-width', '400px'); // Minimum width to enable scrolling if needed

      // Table Header
      const thead = table.append('thead').attr('role', 'rowgroup');

      const headerRow = thead.append('tr').attr('role', 'row');

      headerRow
        .append('th')
        .attr('role', 'columnheader')
        .attr('scope', 'col')
        .text('X-Axis')
        .style('text-align', 'left')
        .style('padding', '12px 10px')
        .style('border-bottom', '2px solid #ccc')
        .style('background-color', '#f0f0f0')
        .style('color', '#222')
        .style('width', '10%')
        .style('font-weight', '600');

      headerRow
        .append('th')
        .attr('role', 'columnheader')
        .attr('scope', 'col')
        .text('Legend')
        .style('text-align', 'left')
        .style('padding', '12px 10px')
        .style('border-bottom', '2px solid #ccc')
        .style('background-color', '#f0f0f0')
        .style('color', '#222')
        .style('font-weight', '600');

      // Table Body
      const tbody = table.append('tbody').attr('role', 'rowgroup');

      const rows = tbody
        .selectAll('tr')
        .data(legendData)
        .enter()
        .append('tr')
        .attr('role', 'row')
        .style('background', (d, i) => (i % 2 === 0 ? '#fff' : '#fafafa')); // Zebra striping

      // Table Cells
      rows
        .append('td')
        .attr('role', 'cell')
        .text((d) => `${xAxisCaption} ${d.sprintNumber}:`)
        .style('padding', '10px 10px')
        .style('border-bottom', '1px solid #eee')
        .style('width', '10%')
        .style('color', '#333');

      rows
        .append('td')
        .attr('role', 'cell')
        .text((d) => d.sprintLabel)
        .style('padding', '10px 10px')
        .style('border-bottom', '1px solid #eee')
        .style('word-break', 'break-word')
        .style('color', '#666');
    }
  }

  ngOnDestroy() {
    // this is used for removing svg already made when value is updated
    d3.select(this.elem).select('#verticalSVG').select('svg').remove();
    d3.select(this.elem).select('#horizontalSVG').select('svg').remove();
    d3.select(this.elem).select('#xCaptionContainer').select('text').remove();
    d3.select(this.elem).select('#legendContainer').remove();
    this.data = [];
    this.resizeObserver.unobserve(this.elem);
  }
}
