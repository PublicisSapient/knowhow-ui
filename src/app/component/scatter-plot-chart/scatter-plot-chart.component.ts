import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { Colors } from 'src/app/dashboardv2/dashboard-common-file';
import { HelperService } from 'src/app/services/helper.service';
import { SharedService } from 'src/app/services/shared.service';

interface PullRequest {
  size: string;
  label: string;
  hoverValue: {
    'No of lines': number;
  };
}

interface WeekData {
  date: string;
  kpiGroup: string;
  sprojectName: string;
  bubblePoints: PullRequest[];
}

interface MaturityData {
  data: string;
  value: WeekData[];
}

interface PlotPoint {
  weekNumber: number;
  size: number;
  prId: string;
  date: string;
}

@Component({
  selector: 'app-scatter-plot-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scatter-plot-chart.component.html',
  styleUrl: './scatter-plot-chart.component.css',
})
export class ScatterPlotChartComponent {
  // @ViewChild('chartSvg', { static: true }) svgRef!: ElementRef;
  // @ViewChild('tooltip', { static: true }) tooltipRef!: ElementRef;

  private readonly sizeBands: Array<{
    label: string;
    color: string;
    matches: (size: number) => boolean;
  }> = [
    {
      label: 'Under 100',
      color: Colors.under100,
      matches: (size) => size < 100,
    },
    {
      label: '100-300',
      color: Colors.band100To300,
      matches: (size) => size >= 100 && size < 300,
    },
    {
      label: '300-500',
      color: Colors.band300To500,
      matches: (size) => size >= 300 && size < 500,
    },
    {
      label: '500+',
      color: Colors.band500Plus,
      matches: (size) => size >= 500,
    },
  ];

  @Input() data: MaturityData[];
  @Input() selectedtype: string;
  @Input() kpiId: string;
  @Input() yCaption: string;
  @Input() xCaption: string;
  @Input() unit?: string;
  @Input() source = '';

  @ViewChild('chartContainer', { static: false }) chartContainer: ElementRef;
  @ViewChild('chartSvg', { static: false }) svgRef!: ElementRef;
  @ViewChild('tooltip', { static: false }) tooltipRef!: ElementRef;

  elem: any;
  counter = 0;

  constructor(public helper: HelperService, public service: SharedService) {}

  get prSizeLegend(): { label: string; color: string }[] {
    return this.sizeBands.map(({ label, color }) => ({ label, color }));
  }

  ngAfterViewInit(): void {
    if (this.svgRef?.nativeElement) {
      this.elem = this.svgRef.nativeElement.parentElement;
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (Object.keys(changes)?.length > 0) {
      d3.select(this.svgRef?.nativeElement).selectAll('*').remove();
      d3.select(this.elem).select('.sprint-legend-container').remove();
      this.counter = 0; // Reset counter for legend
      this.createChart();

      if (
        this.selectedtype?.toLowerCase() === 'kanban' ||
        this.service.getSelectedTab()?.toLowerCase() === 'developer'
      ) {
        this.xCaption = this.service.getSelectedDateFilter();
      }
      if (changes['activeTab']) {
        /** settimeout applied because dom is loading late */
        setTimeout(() => {
          this.createChart();
        }, 0);
      }
    }
  }

  private processData(): PlotPoint[] {
    const points: PlotPoint[] = [];

    // Check if data exists and has the expected structure
    if (!this.data || this.data.length === 0) {
      console.warn('No data available');
      return points;
    }

    // Access the first item's value array directly
    const weeklyData = this.data[0].value;

    if (!weeklyData || weeklyData.length === 0) {
      console.warn('No weekly data available');
      return points;
    }

    // Process each week's PR values
    weeklyData.forEach((week, weekIndex) => {
      if (
        week.bubblePoints &&
        Array.isArray(week.bubblePoints) &&
        week.bubblePoints.length > 0
      ) {
        if (week.bubblePoints.length === 0) {
          console.warn(`Week ${weekIndex + 1} has empty bubblePoints array`);
        }

        week.bubblePoints.forEach((pr) => {
          points.push({
            weekNumber: weekIndex + 1,
            size: parseInt(pr.size, 10),
            prId: pr.label,
            date: week.date,
          });
        });
      } else {
        console.warn(
          `Week ${
            weekIndex + 1
          } has no bubblePoints or bubblePoints is not an array:`,
          week,
        );
        points.push({
          weekNumber: weekIndex + 1,
          size: 0,
          prId: 'N/A',
          date: week.date,
        });
      }
    });

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
        const jitterSpacing = 0.08;
        const totalWidth = (group.length - 1) * jitterSpacing;

        group.forEach((point, index) => {
          const jitterOffset = index * jitterSpacing - totalWidth / 2;
          jitteredPoints.push({ ...point, jitterX: jitterOffset });
        });
      }
    });

    return jitteredPoints;
  }

  private roundToNearestLarge(value: number): number {
    if (value <= 0) {
      return 0;
    }
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    return Math.ceil(value / magnitude) * magnitude;
  }

  private createChart(): void {
    const plotPoints = this.processData();

    if (plotPoints.length === 0) {
      console.warn('No data points to display, but will render empty chart');
    }

    const jitteredPoints =
      plotPoints.length > 0 ? this.applyJitter(plotPoints) : [];

    const svg = d3.select(this.svgRef?.nativeElement);
    const width = 825;
    const height = 350;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const maxWeek =
      plotPoints.length > 0
        ? d3.max(plotPoints, (d) => d.weekNumber)
        : this.data?.[0]?.value?.length || 4;
    const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);

    const xScale = d3
      .scaleLinear()
      .domain([0.5, maxWeek + 0.5])
      .range([0, chartWidth]);

    const maxSize =
      plotPoints.length > 0
        ? this.roundToNearestLarge(d3.max(plotPoints, (d) => d.size))
        : 100;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.max(maxSize * 1.1, 100)])
      .range([chartHeight, 0])
      .nice();

    // Radius scale
    const maxRadius = 15;
    const minRadius = 0.5;
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
      .text(this.xCaption || 'Week');

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
      .text(this.yCaption || 'Lines');

    // Tooltip
    const tooltip = d3.select(this.tooltipRef?.nativeElement);

    // Plot points with animation and jitter (only if there are points)
    // if (jitteredPoints.length > 0) {
    g.selectAll('.data-point')
      .data(jitteredPoints)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.weekNumber + d.jitterX))
      .attr('cy', chartHeight)
      .attr('r', 0)
      .attr('fill', (d) => this.getBubbleColor(d.size))
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const color = this.getBubbleColor(d.size);
        d3.select(event.currentTarget)
          .attr('opacity', 1)
          .attr('stroke', color)
          .attr('stroke-width', 2);

        const circle = event.target;
        const { top: yPosition, left: xPosition } =
          circle.getBoundingClientRect();

        tooltip
          .style('display', 'block')
          .style('position', 'fixed')
          .style('opacity', '0.9')
          .style('left', xPosition + 10 + 'px')
          .style('top', yPosition + 20 + 'px')
          .html(`<strong>PR #${d.prId}</strong><br/>Size: ${d.size} lines`);
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget)
          .attr('opacity', 0.7)
          .attr('stroke', 'none');

        tooltip.style('display', 'none').style('opacity', '0');
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .attr('cy', (d) => yScale(d.size))
      .attr('r', (d) => (d.size === 0 ? 0.5 : radiusScale(d.size)));
    // }

    // Render legend
    // console.log('scatter data to flatten ', this.data);
    this.renderSprintsLegend(this.data, this.xCaption);
  }

  flattenData(data: MaturityData[]) {
    const sprintMap = new Map();
    let sprintCounter = 1;

    data.forEach((project) => {
      const projectName = project.data.trim();

      project.value.forEach((week, index) => {
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

        // Add week date
        const xAxisName = week.date?.trim();
        if (xAxisName && !sprintEntry.sprints.includes(xAxisName)) {
          sprintEntry.sprints.push(xAxisName);
        }

        // Calculate total lines for this week from all PRs
        const totalLines =
          week.bubblePoints?.reduce((sum, pr) => {
            return sum + (pr.hoverValue?.['No of lines'] || 0);
          }, 0) || 0;

        sprintData[projectName] = {
          'No of lines': totalLines,
        };
      });
    });

    return Array.from(sprintMap.values());
  }

  renderSprintsLegend(data: MaturityData[], xAxisCaption: string) {
    if (!this.elem || !data) return;
    const flattenedData = this.flattenData(data);
    const legendData = flattenedData.map((item) => ({
      sprintNumber: item.sprintNumber,
      sprintLabel: item.sprints.join(', '),
    }));

    const body = d3.select(this.elem);

    const container = body
      .insert('div')
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
        legend.attr('aria-hidden', isVisible ? 'true' : 'false');
        legend.attr('tabindex', isVisible ? '-1' : '0');
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
      legend.style('display', 'block');
      toggleButton.text('Hide X-Axis Legend');
      legend.attr('aria-hidden', 'false');
    } else {
      legend.style('display', 'none');
      legend.attr('aria-hidden', 'true');
      toggleButton.text('Show X-Axis Legend');
    }

    // Scrollable container
    const scrollContainer = legend
      .append('div')
      .style('overflow-x', 'auto')
      .style('max-width', '100%');

    // Table
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
        return this.getFormatedDateBasedOnType(d.sprintLabel, this.xCaption);
      })
      .style('padding', '10px 10px')
      .style('border-bottom', '1px solid #eee')
      .style('word-break', 'break-word')
      .style('color', '#666');
  }

  getFormatedDateBasedOnType(date: string, xCaptionType: string) {
    const xCaption = xCaptionType?.toLowerCase();
    return this.helper.getFormatedDateBasedOnType(date, xCaption);
  }

  private getBubbleColor(size: number): string {
    const band = this.sizeBands.find((range) => range.matches(size));
    return band?.color || Colors.defaultBubble;
  }
}
