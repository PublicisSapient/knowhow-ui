import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as d3 from 'd3';

interface PullRequest {
  size: string;
  ID: string;
}

interface WeekData {
  date: string;
  kpiGroup: string;
  sprojectName: string;
  hoverValue: {
    'No of lines': number;
  };
  PullRequests: PullRequest[];
}

interface MaturityData {
  data: string;
  maturity: string;
  value: WeekData[];
}

interface ChartData {
  filter1: string;
  filter2: string;
  value: MaturityData[];
}

interface PlotPoint {
  weekNumber: number;
  size: number;
  prId: string;
  date: string;
}

@Component({
  selector: 'app-scatter-plot-chart',
  standalone: false,
  templateUrl: './scatter-plot-chart.component.html',
  styleUrl: './scatter-plot-chart.component.css',
})
export class ScatterPlotChartComponent {
  @ViewChild('chartSvg', { static: true }) svgRef!: ElementRef;
  @ViewChild('tooltip', { static: true }) tooltipRef!: ElementRef;

  @Input() data: ChartData = {
    filter1: 'develop -> knowhow-api -> KnowHOW',
    filter2: 'gurdeep.singh@publicissapient.com',
    value: [
      {
        data: 'KnowHOW',
        maturity: '1',
        value: [
          {
            date: '29-Sep-2025 to 05-Oct-2025',
            kpiGroup:
              'develop -> knowhow-api -> KnowHOW#gurdeep.singh@publicissapient.com',
            sprojectName: 'KnowHOW',
            hoverValue: { 'No of lines': 100 },
            PullRequests: [
              { size: '109', ID: '1234' },
              { size: '1876', ID: '43' },
              { size: '109', ID: '34' },
            ],
          },
          {
            date: '06-Oct-2025 to 15-Oct-2025',
            kpiGroup:
              'develop -> knowhow-api -> KnowHOW#gurdeep.singh@publicissapient.com',
            sprojectName: 'KnowHOW',
            hoverValue: { 'No of lines': 1320 },
            PullRequests: [
              { size: '1549', ID: '12' },
              { size: '876', ID: '438' },
              { size: '1879', ID: '342' },
            ],
          },
          {
            date: '16-Oct-2025 to 22-Oct-2025',
            kpiGroup:
              'develop -> knowhow-api -> KnowHOW#gurdeep.singh@publicissapient.com',
            sprojectName: 'KnowHOW',
            hoverValue: { 'No of lines': 890 },
            PullRequests: [
              { size: '450', ID: '56' },
              { size: '1200', ID: '78' },
              { size: '650', ID: '90' },
            ],
          },
          {
            date: '23-Oct-2025 to 29-Oct-2025',
            kpiGroup:
              'develop -> knowhow-api -> KnowHOW#gurdeep.singh@publicissapient.com',
            sprojectName: 'KnowHOW',
            hoverValue: { 'No of lines': 1100 },
            PullRequests: [
              { size: '890', ID: '101' },
              { size: '1650', ID: '102' },
              { size: '320', ID: '103' },
            ],
          },
        ],
      },
    ],
  };

  ngOnInit(): void {
    this.createChart();
  }

  private processData(): PlotPoint[] {
    const points: PlotPoint[] = [];

    if (this.data.value && this.data.value.length > 0) {
      const weeklyData = this.data.value[0].value;

      weeklyData.forEach((week, weekIndex) => {
        week.PullRequests.forEach((pr) => {
          points.push({
            weekNumber: weekIndex + 1,
            size: parseInt(pr.size, 10),
            prId: pr.ID,
            date: week.date,
          });
        });
      });
    }

    return points;
  }

  private applyJitter(
    points: PlotPoint[],
  ): Array<PlotPoint & { jitterX: number }> {
    // Group points by week and size to detect overlaps
    const grouped = d3.group(points, (d) => `${d.weekNumber}-${d.size}`);
    const jitteredPoints: Array<PlotPoint & { jitterX: number }> = [];

    grouped.forEach((group) => {
      if (group.length === 1) {
        // No overlap, no jitter needed
        jitteredPoints.push({ ...group[0], jitterX: 0 });
      } else {
        // Multiple points at same position, apply jitter
        const jitterSpacing = 0.08; // Small horizontal offset
        const totalWidth = (group.length - 1) * jitterSpacing;

        group.forEach((point, index) => {
          const jitterOffset = index * jitterSpacing - totalWidth / 2;
          jitteredPoints.push({ ...point, jitterX: jitterOffset });
        });
      }
    });

    return jitteredPoints;
  }

  private createChart(): void {
    const plotPoints = this.processData();

    if (plotPoints.length === 0) {
      console.warn('No data to display');
      return;
    }

    const jitteredPoints = this.applyJitter(plotPoints);

    const svg = d3.select(this.svgRef.nativeElement);
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const maxWeek = d3.max(plotPoints, (d) => d.weekNumber) || 4;
    const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

    const xScale = d3
      .scaleLinear()
      .domain([0.5, maxWeek + 0.5])
      .range([0, chartWidth]);

    const maxSize = d3.max(plotPoints, (d) => d.size) || 2000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxSize * 1.1]) // Add 10% padding at top
      .range([chartHeight, 0])
      .nice();

    // Radius scale using square root for better visual distribution
    const maxRadius = 15;
    const minRadius = 3;
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxSize])
      .range([minRadius, maxRadius]);

    // Grid lines
    const gridGroup = g.append('g').attr('class', 'grid-lines');

    // Horizontal grid lines
    const yTicks = yScale.ticks(5);
    yTicks.forEach((tick) => {
      gridGroup
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yScale(tick))
        .attr('y2', yScale(tick))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('shape-rendering', 'crispEdges');
    });

    // Vertical grid lines
    weeks.forEach((week) => {
      const xPos = xScale(week);
      gridGroup
        .append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('shape-rendering', 'crispEdges');
    });

    // X-axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(weeks)
      .tickFormat((d) => d.toString())
      .tickSize(0)
      .tickPadding(10);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#666');

    // X-axis label
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Week');

    // Y-axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(0).tickPadding(10);

    g.append('g')
      .call(yAxis)
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#666');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Lines');

    // Tooltip
    const tooltip = d3.select(this.tooltipRef.nativeElement);

    // Plot points with animation and jitter
    g.selectAll('.data-point')
      .data(jitteredPoints)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.weekNumber + d.jitterX))
      .attr('cy', chartHeight)
      .attr('r', 0)
      .attr('fill', '#6079c5')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', '#3d5a9e')
          .attr('stroke-width', 2);

        tooltip
          .style('opacity', '1')
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .html(`<strong>PR #${d.prId}</strong><br/>Size: ${d.size} lines`);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.7).attr('stroke', 'none');

        tooltip.style('opacity', '0');
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr('cy', (d) => yScale(d.size))
      .attr('r', (d) => radiusScale(d.size));
  }
}
