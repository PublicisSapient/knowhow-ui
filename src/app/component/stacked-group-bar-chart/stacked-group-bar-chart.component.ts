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
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ViewContainerRef,
} from '@angular/core';
import * as d3 from 'd3';
import { HelperService } from 'src/app/services/helper.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-stacked-group-bar-chart',
  templateUrl: './stacked-group-bar-chart.component.html',
  styleUrls: ['./stacked-group-bar-chart.component.css'],
})
export class StackedGroupBarChartComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() defectsBreachedSLAs: any;
  @Input() defectsBreachedSLAsAllValues: any;
  @Input() color: string[] = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'];
  @Input() data;
  @Input() kpiId;
  @Input() thresholdValue: number;
  @Input() source = '';
  @Input() selectedtype: string;
  @Input() xAxisLabel: string;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  elem: any;
  hasFilter: boolean = true;
  @Input() xCaption: string;

  elemObserver = new ResizeObserver(() => {
    this.createChart();
  });

  private filteredData: any;
  private activeSeverityKeys = [];
  private isInitialized = false;
  private yAxisLabel;

  private readonly svg: any;
  private readonly width: number = 0;
  private readonly allSeverityKeys = ['s1', 's2', 's3', 's4'];
  private readonly testExecutionKeys = ['AUTOMATED', 'MANUAL'];

  filter = [
    { option: 'S1', value: 's1', selected: true },
    { option: 'S2', value: 's2', selected: true },
    { option: 'S3', value: 's3', selected: true },
    { option: 'S4', value: 's4', selected: true },
  ];

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private service: SharedService,
    private helper: HelperService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.kpiId === 'kpi196' || this.kpiId === 'kpi197') {
      this.hasFilter = false;
    } else if (this.kpiId === 'kpi202') {
      // console.log('data ', this.data);
      // // OVERWRITE with mock data for KPI202
      // this.data = [
      //   {
      //     data: 'KnowHOW',
      //     value: [
      //       {
      //         hoverValue: {},
      //         subFilter: 'DTS-44086',
      //         kpiGroup: 'Past 6 Months#Bug',
      //         dataValue: [
      //           {
      //             name: 'DOR',
      //             data: '5731.616666666667',
      //             value: 5731.616666666667,
      //           },
      //         ],
      //         sprojectName: 'KnowHOW',
      //       },
      //       {
      //         hoverValue: {},
      //         subFilter: 'DTS-47411',
      //         kpiGroup: 'Past 6 Months#Bug',
      //         dataValue: [
      //           {
      //             name: 'DOR',
      //             data: '3712.766666666667',
      //             value: 3712.766666666667,
      //           },
      //         ],
      //         sprojectName: 'KnowHOW',
      //       },
      //       {
      //         hoverValue: {},
      //         subFilter: 'DTS-47528',
      //         kpiGroup: 'Past 6 Months#Bug',
      //         dataValue: [
      //           {
      //             name: 'QA',
      //             data: '0.0',
      //             value: 0,
      //           },
      //           {
      //             name: 'DOR',
      //             data: '3621.516666666667',
      //             value: 3621.516666666667,
      //           },
      //         ],
      //         sprojectName: 'KnowHOW',
      //       },
      //       {
      //         hoverValue: {},
      //         subFilter: 'DTS-48152',
      //         kpiGroup: 'Past 6 Months#Bug',
      //         dataValue: [
      //           {
      //             name: 'QA',
      //             data: '38.63333333333333',
      //             value: 38.63333333333333,
      //           },
      //           {
      //             name: 'DOR',
      //             data: '161.68333333333334',
      //             value: 161.68333333333334,
      //           },
      //         ],
      //         sprojectName: 'KnowHOW',
      //       },
      //       {
      //         hoverValue: {},
      //         subFilter: 'DTS-48279',
      //         kpiGroup: 'Past 6 Months#Bug',
      //         dataValue: [
      //           {
      //             name: 'QA',
      //             data: '0.016666666666666666',
      //             value: 0.016666666666666666,
      //           },
      //           {
      //             name: 'DOR',
      //             data: '3354.05',
      //             value: 3354.05,
      //           },
      //         ],
      //         sprojectName: 'KnowHOW',
      //       },
      //       {
      //         hoverValue: {},
      //         subFilter: 'DTS-48363',
      //         kpiGroup: 'Past 6 Months#Bug',
      //         dataValue: [
      //           {
      //             name: 'DOR',
      //             data: '4227.583333333333',
      //             value: 4227.583333333333,
      //           },
      //         ],
      //         sprojectName: 'KnowHOW',
      //       },
      //     ],
      //   },
      // ];

      // Dynamically extract filter options from this.data
      const kpi202Keys = new Set<string>();
      this.data?.forEach((elem: any) => {
        elem.value?.forEach((val: any) => {
          if (val?.dataValue && Array.isArray(val.dataValue)) {
            val.dataValue.forEach((dv: any) => {
              if (dv.name) kpi202Keys.add(dv.name);
            });
          }
        });
      });
      const kpi202KeysArr = Array.from(kpi202Keys);
      // If no keys found, show a placeholder filter
      if (kpi202KeysArr.length === 0) {
        this.filter = [
          { option: 'No Data', value: 'no_data', selected: false },
        ];
        this.activeSeverityKeys = [];
      } else {
        this.filter = kpi202KeysArr.map((key) => ({
          option: key,
          value: key,
          selected: true,
        }));
        this.activeSeverityKeys = [...kpi202KeysArr];
      }
    }
    if (
      this.selectedtype?.toLowerCase() === 'kanban' ||
      this.service.getSelectedTab()?.toLowerCase() === 'developer'
    ) {
      this.xCaption = this.service.getSelectedDateFilter();
    }
    this.createChart();
    this.elem = this.viewContainerRef.element.nativeElement;
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    this.createChart();
    // Observe the chart container for resize events (important for modal rendering)
    if (this.chartContainer?.nativeElement) {
      this.elemObserver.observe(this.chartContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    // Clean up the observer to prevent memory leaks
    if (this.chartContainer?.nativeElement) {
      this.elemObserver.unobserve(this.chartContainer.nativeElement);
    }
    // Clean up D3 elements
    d3.select(this.chartContainer?.nativeElement).selectAll('*').remove();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.filteredData) {
      this.createChart();
    }
  }

  private createChart(): void {
    console.log(this.kpiId, this.data);
    // Early return if no data is available
    if (this.kpiId === 'kpi195') {
      if (!this.defectsBreachedSLAs || this.defectsBreachedSLAs.length === 0) {
        console.warn(
          'KPI 195: No defectsBreachedSLAs data available, skipping chart creation',
        );
        return;
      }
    } else if (
      this.kpiId === 'kpi196' ||
      this.kpiId === 'kpi197' ||
      this.kpiId === 'kpi202'
    ) {
      if (!this.data || this.data.length === 0) {
        console.warn(
          `KPI ${this.kpiId}: No data available, skipping chart creation`,
        );
        return;
      }
    } else {
      console.warn(`Unknown kpiId: ${this.kpiId}, skipping chart creation`);
      return;
    }

    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    const sprintGroups: { [key: string]: any[] } = {};
    let chartYRange = 0;
    let severityKeys;
    if (this.kpiId === 'kpi195') {
      this.yAxisLabel = 'Breached %';
      severityKeys = this.activeSeverityKeys.length
        ? this.activeSeverityKeys
        : this.allSeverityKeys;

      this.defectsBreachedSLAs?.forEach((project: any) => {
        project.value.forEach((sprint: any, index: number) => {
          if (sprint == null) {
            return;
          }
          const sprintKey = `${index + 1}`;
          if (!sprintGroups[sprintKey]) sprintGroups[sprintKey] = [];

          const severityData: any = {
            project: project.data,
            rate: project.data,
            value: 0,
            ...severityKeys.reduce((acc, severity) => {
              const found = sprint?.drillDown?.find(
                (d: any) => d.severity === severity,
              );
              acc[severity] = found ? found.breachedPercentage : 0;
              return acc;
            }, {}),
          };
          const severityTotal = severityKeys.reduce(
            (total, key) => total + (severityData[key] || 0),
            0,
          );
          chartYRange = Math.max(chartYRange, severityTotal);

          sprintGroups[sprintKey].push(severityData);
        });
      });
    } else if (this.kpiId === 'kpi196' || this.kpiId === 'kpi197') {
      this.yAxisLabel = 'Avg. Execution Time';
      this.data?.forEach((elem: any) => {
        elem.value.forEach((val: any, index: number) => {
          if (val == null) {
            return;
          }
          let temp = 0;
          const sprintKey = `${index + 1}`;
          if (!sprintGroups[sprintKey]) sprintGroups[sprintKey] = [];
          const obj = {};
          for (const prop in val.hoverValue) {
            obj[prop] = val.hoverValue[prop].avgExecutionTimeSec;
            temp += val.hoverValue[prop].avgExecutionTimeSec;
          }
          if (temp > chartYRange) chartYRange = temp;
          const data = {
            project: elem.data,
            ...obj,
          };
          sprintGroups[sprintKey].push(data);
        });
      });
    } else if (this.kpiId === 'kpi202') {
      this.yAxisLabel = 'Time (Hours)';
      this.xCaption = 'Story ID';
      // kpi202 uses trendValueList entries with dataValue
      // Collect all dynamic keys from dataValue across all data
      const kpi202Keys = new Set<string>();
      this.data?.forEach((elem: any) => {
        elem.value?.forEach((val: any) => {
          if (val?.dataValue && Array.isArray(val.dataValue)) {
            val.dataValue.forEach((dv: any) => {
              if (dv.name) kpi202Keys.add(dv.name);
            });
          }
        });
      });
      const kpi202KeysArr = Array.from(kpi202Keys);

      this.data?.forEach((elem: any) => {
        elem.value?.forEach((val: any, index: number) => {
          if (val == null) {
            return;
          }
          const sprintKey = val.subFilter || `Story ${index + 1}`;
          if (!sprintGroups[sprintKey]) sprintGroups[sprintKey] = [];
          let temp = 0;
          const obj: any = {};

          // Initialize to 0
          for (const key of kpi202KeysArr) {
            obj[key] = 0;
          }

          if (val.dataValue && Array.isArray(val.dataValue)) {
            val.dataValue.forEach((dv: any) => {
              if (dv.name) {
                const v = Number(dv.value) || 0;
                obj[dv.name] = v;
                temp += v;
              }
            });
          }

          if (temp > chartYRange) chartYRange = temp;
          sprintGroups[sprintKey].push({ project: elem.data, ...obj });
        });
      });

      // Override the stack keys for kpi202 to use collected keys
      // Store them for use below
      (this as any)._kpi202Keys = kpi202KeysArr;
    }

    const sprints = Object.keys(sprintGroups);
    let projects;
    if (this.kpiId === 'kpi195') {
      projects = [...new Set(this.defectsBreachedSLAs?.map((d) => d.data))];
    } else {
      projects = [...new Set(this.data?.map((d) => d.data))];
    }
    const margin = { top: 30, right: 30, bottom: 30, left: 50 }; // Reduced bottom margin since xCaption is now an HTML div

    const containerNode = this.chartContainer.nativeElement;

    // Define Stack Keys early so we can build the legend
    const stackKeys =
      this.kpiId === 'kpi195'
        ? severityKeys
        : this.kpiId === 'kpi202'
        ? (this as any)._kpi202Keys || this.testExecutionKeys
        : this.testExecutionKeys;

    const defaultColors = [
      '#3498db',
      '#2ecc71',
      '#e74c3c',
      '#f39c12',
      '#9b59b6',
      '#34495e',
    ];

    // For KPI202, ignore this.color since the parent passes Project colors,
    // but KPI202 needs distinct colors for its Stacks.
    const safeColors =
      this.kpiId !== 'kpi202' && this.color?.length
        ? this.color
        : defaultColors;

    let legendHeight = 0;
    // Add Color Legend specifically for KPI202
    if (this.kpiId === 'kpi202' && stackKeys?.length) {
      const colorLegend = d3
        .select(containerNode)
        .append('div')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('gap', '15px')
        .style('margin-bottom', '10px')
        .style('justify-content', 'center')
        .style('padding-top', '5px');

      stackKeys.forEach((key: string, i: number) => {
        const item = colorLegend
          .append('div')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('font-size', '12px')
          .style('color', '#333')
          .style('font-weight', '500');

        item
          .append('span')
          .style('display', 'inline-block')
          .style('width', '14px')
          .style('height', '14px')
          .style('border-radius', '3px')
          .style('margin-right', '6px')
          .style('background-color', safeColors[i % safeColors.length]);

        item.append('span').text(key);
      });

      legendHeight = (colorLegend.node() as HTMLElement).offsetHeight + 15; // include margins
    }

    //  Get container size dynamically
    const containerWidth = containerNode.offsetWidth || 700;
    // Subtract legendHeight AND space for the HTML X-axis label (30px)
    const containerHeight =
      (containerNode.offsetHeight || 400) - legendHeight - 30;

    // Use 12 to naturally make the bars thinner and points closer, fitting more data per scroll view
    const minItemsForScroll = 12;
    let extraWidthFactor = 1.2;
    let useScroll = false;

    // Enable native horizontal scroll specifically for KPIs where requested
    if (this.kpiId === 'kpi202' && sprints.length > minItemsForScroll) {
      extraWidthFactor = sprints.length / minItemsForScroll;
      useScroll = true;
    }

    const width =
      containerWidth * extraWidthFactor - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    d3.select(containerNode)
      .style('position', 'relative')
      .style('overflow-x', 'hidden')
      .style('overflow-y', 'hidden');

    const chartWrapper = d3
      .select(containerNode)
      .append('div')
      .style('display', 'flex')
      .style('flex-direction', 'row')
      .style('width', '100%')
      .style('height', containerHeight + 'px');

    // 1. Fixed SVG for Y-axis (sticky on the left)
    const fixedYAxisContainer = chartWrapper
      .append('div')
      .style('position', 'sticky')
      .style('left', 0)
      .style('z-index', 2)
      .style('background', '#fff');

    const fixedSvg = fixedYAxisContainer
      .append('svg')
      .attr('width', margin.left)
      .attr('height', containerHeight);

    const fixedG = fixedSvg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 2. Scrollable container for the Chart
    const scrollContainer = chartWrapper
      .append('div')
      .style('flex', 1)
      .style('overflow-x', useScroll ? 'auto' : 'hidden')
      .style('overflow-y', 'hidden');

    const svgRoot = scrollContainer
      .append('svg')
      .attr('width', useScroll ? width + margin.right : '100%')
      .attr('height', useScroll ? containerHeight : '100%');

    if (!useScroll) {
      svgRoot
        .attr('viewBox', `0 0 ${width + margin.right} ${containerHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    }

    const svg = svgRoot
      .append('g')
      .attr('transform', `translate(0,${margin.top})`);

    (this as any)._fixedG = fixedG;

    // --- Scales ---
    const x0 = d3.scaleBand().domain(sprints).range([0, width]).padding(0.1);
    const x1 = d3
      .scaleBand()
      .domain(projects)
      .range([0, x0.bandwidth()])
      .padding(0.1);
    const threshold = Number(this.thresholdValue);

    const isThresholdValid =
      this.kpiId === 'kpi195' && Number.isFinite(threshold);

    const range = this.kpiId === 'kpi196' ? 5 : 50;
    const maxLimit = this.kpiId === 'kpi196' ? 100 : 500;

    let domainMax = chartYRange ? chartYRange + range : maxLimit;

    if (isThresholdValid && threshold > domainMax) {
      domainMax = threshold + range;
    }

    const y = d3
      .scaleLinear()
      .domain([0, domainMax])
      .range([height, 0])
      .clamp(true);

    const xGrid = d3
      .axisBottom(x0)
      .tickSize(-height)
      .tickFormat(() => '');
    svg
      .append('g')
      .attr('class', 'x-grid')
      .attr('transform', `translate(0,${height})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#E0E0E0');
    svg.select('.x-grid').select('.domain').remove();

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', '#000')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '12px')
      .style('font-size', '13px')
      .style('color', '#fff')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 3px 6px rgba(0,0,0,0.16)')
      .style('z-index', '1000')
      .style('min-width', '180px')
      .style('transition', 'opacity 0.2s');

    const yGrid = d3
      .axisLeft(y)
      .ticks(6)
      .tickSize(-width)
      .tickFormat(() => '');
    svg
      .append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#E0E0E0');
    svg.select('.grid').select('.domain').remove();

    const projectColors = new Map<string, string>();
    if (this.kpiId === 'kpi195') {
      this.defectsBreachedSLAs.forEach((project: any, index: number) => {
        projectColors.set(project.data, safeColors[index % safeColors.length]);
      });
    } else if (
      this.kpiId === 'kpi196' ||
      this.kpiId === 'kpi197' ||
      this.kpiId === 'kpi202'
    ) {
      this.data.forEach((project: any, index: number) => {
        projectColors.set(project.data, safeColors[index % safeColors.length]);
      });
    }

    sprints.forEach((sprint) => {
      const stackKeys =
        this.kpiId === 'kpi195'
          ? severityKeys
          : this.kpiId === 'kpi202'
          ? (this as any)._kpi202Keys || this.testExecutionKeys
          : this.testExecutionKeys;
      const stack = d3.stack().keys(stackKeys);
      const stackedData = stack(sprintGroups[sprint]);
      const bars = svg
        .append('g')
        .selectAll('.group')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', 'group');

      bars
        .selectAll('rect')
        .data((d: any) => d)
        .enter()
        .append('rect')
        .attr('x', (d: any) => x0(sprint)! + x1(d.data.project)!)
        .attr('y', (d: any) => y(d[1]))
        .attr('height', (d: any) => y(d[0]) - y(d[1]))
        .attr('width', x1.bandwidth())
        .attr('fill', (d: any, i: number, nodes: any[]) => {
          const projectName = d.data.project;
          const severityKey = nodes[i].parentNode.__data__.key;
          if (this.kpiId === 'kpi202') {
            const stackIndex = stackKeys.indexOf(severityKey);
            return safeColors[stackIndex % safeColors.length];
          }
          const severityIndex =
            this.kpiId === 'kpi195'
              ? severityKeys.indexOf(severityKey)
              : stackKeys.indexOf(severityKey);
          const baseColor = projectColors.get(projectName) || '#888';
          return this.generateShade(
            baseColor,
            severityIndex,
            this.kpiId === 'kpi195' ? severityKeys.length : stackKeys.length,
          );
        })
        .on('mouseover', (event, d: any) => {
          const [mouseX, mouseY] = d3.pointer(event, window);
          const projectName = d.data.project;
          const sprintName = sprint;
          const severityKey = event.currentTarget.parentNode.__data__.key;
          const originalData = this.findOriginalData(
            projectName,
            sprintName,
            severityKey,
          );
          if (originalData?.hoverValue) {
            tooltip
              .style('visibility', 'visible')
              .html(
                this.kpiId === 'kpi195'
                  ? `
                <div><strong>Total ${severityKey.toUpperCase()} Resolved:</strong> ${
                      originalData.hoverValue.totalResolvedIssues
                    }</div>
                <div><strong>${severityKey.toUpperCase()} Breached:</strong> ${
                      originalData.hoverValue.breachedPercentage
                    }%</div>
              `
                  : this.kpiId === 'kpi202'
                  ? `
                <div><strong>${severityKey}:</strong> ${
                      originalData?.dataValue?.find(
                        (dv: any) => dv.name === severityKey,
                      )?.data || 0
                    }</div>
              `
                  : `
                <div><strong>Average execution time:</strong> ${originalData.hoverValue[
                  severityKey
                ]?.avgExecutionTimeSec?.toFixed(2)}</div>
                <div><strong>Total ${severityKey.toLocaleLowerCase()} test cases:</strong> ${
                      originalData.hoverValue[severityKey]?.count
                    }</div>
              `,
              )
              .style('left', `${mouseX + 15}px`)
              .style('top', `${mouseY - 15}px`)
              .style('opacity', 1);
          }
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px');
        })
        .on('mouseout', () => tooltip.style('visibility', 'hidden'));

      // --- Labels ---
      bars
        .selectAll('text')
        .data((d: any) => d)
        .enter()
        .append('text')
        .attr(
          'x',
          (d: any) => x0(sprint)! + x1(d.data.project)! + x1.bandwidth() / 2,
        )
        .attr('y', (d: any) => (y(d[0]) + y(d[1])) / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text((d: any) => {
          const value = d[1] - d[0];
          return value >= 1 ? `${value.toFixed(0)}` : '';
        })
        .style('fill', 'black')
        .style('font-size', '10px');
    });

    if (isThresholdValid) {
      const thresholdY = y(threshold);

      svg
        .append('svg:line')
        .attr('x1', 0)
        .attr('x2', width - 30)
        .attr('y1', thresholdY)
        .attr('y2', thresholdY)
        .style('stroke', '#333333')
        .style('stroke-dasharray', '3,3')
        .attr('class', 'thresholdline');

      svg
        .append('text')
        .attr('x', width - 20)
        .attr('y', thresholdY)
        .attr('dy', '.5em')
        .attr('text-anchor', 'end')
        .text(threshold)
        .style('font-size', '16px')
        .style('font-weight', '600')
        .style('fill', '#333333')
        .attr('class', 'thresholdlinetext');
    }

    // --- X Axis ---
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .call((g) => {
        g.select('.domain').attr('stroke', '#EDEFF2');
        g.append('line')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', 0)
          .attr('y2', 0)
          .attr('stroke', '#EDEFF2')
          .attr('stroke-width', 1);
      });
    this.xCaption = this.xCaption ? this.xCaption : this.xAxisLabel;
    // -- Fallback, incase this.xAxisLabel is also empty/undefined
    this.xCaption = this.xCaption ? this.xCaption : 'Sprints';

    // Append X-axis label as an HTML div below the chart wrapper so it's always centered and visible
    d3.select(containerNode)
      .append('div')
      .style('text-align', 'center')
      .style('font-size', '16px')
      .style('color', '#49535e')
      .style('margin-top', '10px')
      .text(this.xCaption);

    // --- Y Axis ---
    const targetG = (this as any)._fixedG || svg;

    targetG
      .append('g')
      .call(d3.axisLeft(y).ticks(6).tickSize(0))
      .call((g) => {
        g.select('.domain').attr('stroke', '#EDEFF2');
        g.append('line')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', height * -1)
          .attr('stroke', '#EDEFF2')
          .attr('stroke-width', 1);
      });

    targetG
      .append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -height / 2)
      .attr('y', -margin.left + 20)
      .attr('text-anchor', 'middle')
      .text(this.yAxisLabel)
      .style('font-size', '16px')
      .style('fill', '#49535e');

    // --- Legend ---
    const hierachy = JSON.parse(localStorage.getItem('selectedTrend'))[0]
      ?.labelName;
    if (hierachy === 'project') {
      this.renderSprintsLegend(
        this.flattenData(
          this.kpiId === 'kpi195' ? this.defectsBreachedSLAs : this.data,
        ),
        this.xCaption,
      );
    }
  }

  flattenData(data) {
    const sprintMap = new Map();
    let sprintCounter = 1;

    if (data && Array.isArray(data)) {
      data.forEach((project) => {
        const projectName = project?.data?.trim() || 'Unknown Project';
        if (project?.value && Array.isArray(project.value)) {
          project.value.forEach((entry, index) => {
            const dateRange = entry?.date?.trim() || `Sprint ${index + 1}`;
            const sprintLabel =
              entry?.sSprintName?.trim() ||
              entry?.sprintNames?.[0]?.trim() ||
              dateRange;
            const sprintKey = index; // assuming index-based alignment

            if (!sprintMap.has(sprintKey)) {
              sprintMap.set(sprintKey, {
                sprintNumber: sprintCounter++,
                projects: {},
                sprints: [],
              });
            }

            const sprintEntry = sprintMap.get(sprintKey);
            const sprintData = sprintEntry.projects;

            // Add date range to x-axis labels if not already present
            if (sprintLabel && !sprintEntry.sprints.includes(sprintLabel)) {
              sprintEntry.sprints.push(sprintLabel);
            }

            // Assign hoverValue data (use empty object if missing)
            sprintData[projectName] = Object.keys(
              entry.hoverValue || {},
            ).reduce((acc, key) => {
              acc[key] = entry.hoverValue[key] || 0;
              return acc;
            }, {});
          });
        }
      });
    }
    return Array.from(sprintMap.values());
  }

  renderSprintsLegend(data, xAxisCaption) {
    const legendData = data.map((item) => ({
      sprintNumber: item.sprintNumber,
      sprintLabel: item.sprints.join(', '),
    }));

    // Select the body and insert the legend container at the top
    const body = d3.select(this.elem);
    // 🧹 Clean up any existing legend container
    body.selectAll('.sprint-legend-container').remove();

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
      legend.style('display', 'block'); // Show the legend by default for modal
      toggleButton.text('Hide X-Axis Legend');
      legend.attr('aria-hidden', 'false');
    } else {
      legend.style('display', 'none'); // Hide the legend by default for dashboard
      legend.attr('aria-hidden', 'true');
      toggleButton.text('Show X-Axis Legend');
    }

    // Wrap the table in a scrollable container
    const scrollContainer = legend
      .append('div')
      .style('overflow-x', 'auto')
      .style('max-width', '100%');

    // Create the table inside scroll container
    const table = scrollContainer
      .append('table')
      .attr('role', 'table')
      .style('width', '100%')
      .style('border-collapse', 'collapse')
      .style('min-width', '400px');

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
      .style('background', (d, i) => (i % 2 === 0 ? '#fff' : '#fafafa'));

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
      .text((d) => {
        return this.getFormatedDateBasedOnType(d.sprintLabel, xAxisCaption);
      })
      .style('padding', '10px 10px')
      .style('border-bottom', '1px solid #eee')
      .style('word-break', 'break-word')
      .style('color', '#666');
    // }
  }

  getFormatedDateBasedOnType(date, xCaptionType) {
    const xCaption = xCaptionType?.toLowerCase();
    return this.helper.getFormatedDateBasedOnType(date, xCaption);
  }

  private findOriginalData(
    projectName: string,
    sprintName: string,
    severityKey: string,
  ): any {
    const sprintNumber = parseInt(sprintName.replace('Sprint ', ''), 10) - 1;

    if (this.kpiId === 'kpi195') {
      const severityGroup = this.defectsBreachedSLAsAllValues.find(
        (item: any) => item.filter === severityKey.toUpperCase(),
      );

      if (severityGroup?.value) {
        const projectSprintData = severityGroup.value.find(
          (dataItem: any) => dataItem.data === projectName,
        );

        return projectSprintData.value[sprintNumber] || null;
      }
    } else {
      const projectData = this.data.find((p: any) => p.data === projectName);
      if (projectData?.value) {
        if (this.kpiId === 'kpi202') {
          return (
            projectData.value.find((v: any) => v.subFilter === sprintName) ||
            null
          );
        } else if (projectData.value.length > sprintNumber) {
          return projectData.value[sprintNumber];
        }
      }
    }

    return null;
  }

  private updateDataAndChart(): void {
    if (this.kpiId === 'kpi202') {
      // Build filtered data for kpi202
      if (!this.data) {
        this.filteredData = {};
        if (this.isInitialized) this.createChart();
        return;
      }
      const sprintGroups: { [key: string]: any[] } = {};
      const severitiesToUse =
        this.activeSeverityKeys && this.activeSeverityKeys.length
          ? this.activeSeverityKeys
          : [];
      this.data.forEach((elem: any) => {
        elem.value?.forEach((val: any, index: number) => {
          if (val == null) return;
          const sprintKey = val.subFilter || `Story ${index + 1}`;
          if (!sprintGroups[sprintKey]) sprintGroups[sprintKey] = [];
          const obj: any = { project: elem.data };
          let hasAny = false;
          severitiesToUse.forEach((key) => {
            const dv = val.dataValue?.find((d: any) => d.name === key);
            const v = dv ? Number(dv.value) || 0 : 0;
            obj[key] = v;
            if (v) hasAny = true;
          });
          // Only push if at least one selected key has data
          if (hasAny) sprintGroups[sprintKey].push(obj);
        });
      });
      this.filteredData = sprintGroups;
      if (this.isInitialized) this.createChart();
      return;
    }

    // Default: kpi195 logic
    if (!this.defectsBreachedSLAs) {
      console.warn('No KPI data available');
      return;
    }

    const sprintGroups: { [key: string]: any[] } = {};

    const severitiesToUse =
      this.activeSeverityKeys && this.activeSeverityKeys.length
        ? this.activeSeverityKeys
        : this.allSeverityKeys;

    this.defectsBreachedSLAs.forEach((project: any) => {
      if (project.value && Array.isArray(project.value)) {
        project.value.forEach((sprint: any, index: number) => {
          const sprintKey = `${index + 1}`;
          if (!sprintGroups[sprintKey]) {
            sprintGroups[sprintKey] = [];
          }

          const severityData: any = { project: project.data || 'Unknown' };

          severitiesToUse.forEach((severity) => {
            if (sprint.drillDown && Array.isArray(sprint.drillDown)) {
              const found = sprint.drillDown.find(
                (d: any) => d.severity === severity,
              );
              severityData[severity] = found ? found.breachedPercentage : 0;
            } else {
              severityData[severity] = 0;
            }
          });

          sprintGroups[sprintKey].push(severityData);
        });
      }
    });

    this.filteredData = sprintGroups;

    if (this.isInitialized) {
      this.createChart();
    }
  }

  private drawGroupedBars(
    sprints: string[],
    projects: string[],
    x0: any,
    x1: any,
    y: any,
    color: any,
    chartHeight: number,
  ): void {
    sprints.forEach((sprint) => {
      const sprintData = this.filteredData[sprint];
      const sprintName = sprint.replace('Sprint ', '');

      projects.forEach((project) => {
        const projectData = sprintData.find((d: any) => d.project === project);
        if (!projectData) return;

        this.activeSeverityKeys.forEach((severity, j) => {
          const value = projectData[severity] || 0;
          if (value > 0) {
            const barWidth = x1.bandwidth() / this.activeSeverityKeys.length;

            const bar = this.svg
              .append('rect')
              .attr('x', x0(sprintName) + x1(project) + j * barWidth)
              .attr('y', y(value))
              .attr('height', chartHeight - y(value))
              .attr('width', barWidth - 2)
              .attr('fill', color(severity))
              .attr('class', 'bar')
              .attr('data-project', project)
              .attr('data-severity', severity)
              .attr('data-sprint', sprintName);

            bar
              .on('mouseover', (event: any) => {
                this.showTooltip(event, {
                  project,
                  severity,
                  value,
                  sprint: sprintName,
                });
              })
              .on('mouseout', () => {
                this.hideTooltip();
              });
          }
        });
      });
    });
  }

  private drawLegend(color: any): void {
    const legend = this.svg
      .append('g')
      .attr('transform', `translate(${this.width - 200}, -25)`);

    this.activeSeverityKeys.forEach((severity, i) => {
      const legendItem = legend
        .append('g')
        .attr('transform', `translate(${i * 50}, 0)`);

      legendItem
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(severity));

      legendItem
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(`S${i + 1}`)
        .style('font-size', '12px')
        .style('fill', '#333');
    });
  }

  private calculateMaxY(): number {
    let maxTotal = 0;
    Object.values(this.filteredData).forEach((projects: any) => {
      projects.forEach((project: any) => {
        const total = this.activeSeverityKeys.reduce(
          (sum, severity) => sum + (project[severity] || 0),
          0,
        );
        if (total > maxTotal) maxTotal = total;
      });
    });
    return Math.max(maxTotal, 100); // Ensure at least 100 for percentage scale
  }

  private generateColorShades(): string[] {
    if (!this.color || this.color.length === 0) {
      return ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];
    }

    const baseColor = this.color[0];
    return this.activeSeverityKeys.map((_, i) =>
      this.generateShade(baseColor, i, this.activeSeverityKeys.length),
    );
  }

  private showTooltip(event: any, data: any): void {
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    tooltip
      .html(
        `
      <strong>${data.project}</strong><br>
      Sprint: ${data.sprint}<br>
      Severity: ${data.severity.toUpperCase()}<br>
      Value: ${data.value}%
    `,
      )
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 28 + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  private hideTooltip(): void {
    d3.selectAll('.chart-tooltip')
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove();
  }

  clearFilters(): void {
    this.activeSeverityKeys = [];
    this.updateDataAndChart();
  }

  handleChange(event: any): void {
    if (event.value && event.value.length > 0) {
      this.activeSeverityKeys = event.value;
    } else {
      this.activeSeverityKeys = [];
    }
    this.updateDataAndChart();
  }

  private generateShade(
    baseColor: string,
    index: number,
    total: number,
  ): string {
    // Your existing generateShade function
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return [h * 360, s * 100, l * 100];
    };

    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
          .toString(16)
          .padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const [h, s, l] = hexToHsl(baseColor);
    const newLightness = l + index * (60 / total) - 30;
    return hslToHex(h, s, Math.min(95, Math.max(15, newLightness)));
  }
}
