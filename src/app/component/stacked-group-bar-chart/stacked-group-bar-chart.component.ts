import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  HostListener,
  ViewContainerRef,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-stacked-group-bar-chart',
  templateUrl: './stacked-group-bar-chart.component.html',
  styleUrls: ['./stacked-group-bar-chart.component.css'],
})
export class StackedGroupBarChartComponent implements OnChanges, AfterViewInit {
  @Input() kpiData: any;
  @Input() color: string[] = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'];
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  elem: any;

  private svg: any;
  private margin = { top: 30, right: 30, bottom: 60, left: 60 };
  private width: number = 0;
  private height: number = 400;
  private filteredData: any;
  private activeSeverityKeys = ['s1', 's2', 's3', 's4'];
  private allSeverityKeys = ['s1', 's2', 's3', 's4'];
  private isInitialized = false;

  filter = [
    { option: 'S1', value: 's1', selected: true },
    { option: 'S2', value: 's2', selected: true },
    { option: 'S3', value: 's3', selected: true },
    { option: 'S4', value: 's4', selected: true },
  ];

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['kpiData'] && this.kpiData) {
      console.log('KPI Data changed:', this.kpiData);
      // this.updateDataAndChart();
      this.createChart();
    }
    if (changes['color'] && this.color) {
      // this.updateChart();
      this.createChart();
    }
    this.elem = this.viewContainerRef.element.nativeElement;
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    // this.initChart();
    if (this.kpiData) {
      // this.updateDataAndChart();
      this.createChart();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.filteredData) {
      // this.updateChart();
      this.createChart();
    }
  }

  private initChart(): void {
    if (!this.chartContainer) {
      console.error('Chart container not found');
      return;
    }

    // Clear previous chart
    d3.select(this.chartContainer.nativeElement).select('svg').remove();

    // Set up dimensions
    const containerWidth = this.chartContainer.nativeElement.offsetWidth;
    this.width = containerWidth - this.margin.left - this.margin.right;

    console.log('Container width:', containerWidth, 'Chart width:', this.width);

    if (this.width <= 0) {
      console.warn('Container has zero width, retrying in 100ms');
      setTimeout(() => this.initChart(), 100);
      return;
    }

    // Create SVG
    this.svg = d3
      .select(this.chartContainer.nativeElement)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  private createChart(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    const sprintGroups: { [key: string]: any[] } = {};
    const severityKeys = this.activeSeverityKeys.length
      ? this.activeSeverityKeys
      : this.allSeverityKeys;

    this.kpiData.forEach((project: any) => {
      project.value.forEach((sprint: any, index: number) => {
        const sprintKey = `${index + 1}`;
        if (!sprintGroups[sprintKey]) sprintGroups[sprintKey] = [];

        const severityData: any = {
          project: project.data,
          rate: project.data,
          value: 0,
          ...severityKeys.reduce((acc, severity) => {
            const found = sprint.drillDown.find(
              (d: any) => d.severity === severity,
            );
            acc[severity] = found ? found.breachedPercentage : 0;
            return acc;
          }, {}),
        };

        sprintGroups[sprintKey].push(severityData);
      });
    });

    const sprints = Object.keys(sprintGroups);
    const projects = [...new Set(this.kpiData.map((d) => d.data))];

    const margin = { top: 30, right: 30, bottom: 60, left: 40 };

    //  Get container size dynamically
    const containerWidth = this.chartContainer.nativeElement.offsetWidth || 700;
    const containerHeight =
      this.chartContainer.nativeElement.offsetHeight || 400;

    //  Increase width factor for <g> drawing space
    const extraWidthFactor = 1.2; // <-- adjust this multiplier (1.2 = +20%)
    const width =
      containerWidth * extraWidthFactor - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3
      .select(this.chartContainer.nativeElement)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr(
        'viewBox',
        `0 0 ${containerWidth * extraWidthFactor} ${containerHeight}`,
      ) //  scaled
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // --- Scales ---
    const x0 = d3.scaleBand().domain(sprints).range([0, width]).padding(0.1);
    const x1 = d3
      .scaleBand()
      .domain(projects)
      .range([0, x0.bandwidth()])
      .padding(0.1);
    const y = d3.scaleLinear().domain([0, 500]).range([height, 0]).clamp(true);

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
    this.kpiData.forEach((project: any, index: number) => {
      projectColors.set(project.data, this.color[index]);
    });

    sprints.forEach((sprint) => {
      const stack = d3.stack().keys(severityKeys);
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
          const severityKey = (nodes[i].parentNode as any).__data__.key;
          const severityIndex = severityKeys.indexOf(severityKey);
          const baseColor = projectColors.get(projectName) || '#888';
          return this.generateShade(
            baseColor,
            severityIndex,
            severityKeys.length,
          );
        })
        .on('mouseover', (event, d: any) => {
          const [mouseX, mouseY] = d3.pointer(event, window);
          const originalData = this.findOriginalData(d.data.project, sprint);
          if (originalData?.hoverValue) {
            tooltip
              .style('visibility', 'visible')
              .html(
                `
                <div><strong>Total Resolved:</strong> ${originalData.hoverValue.totalResolvedIssues}</div>
                <div><strong>Breached:</strong> ${originalData.hoverValue.breachedPercentage}%</div>
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
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .text('Sprints')
      .style('font-size', '16px')
      .style('fill', '#49535e');

    // --- Y Axis ---
    svg
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
    svg
      .append('text')
      .attr('transform', `rotate(-90)`)
      .attr('x', -height / 2)
      .attr('y', -margin.left + 15)
      .attr('text-anchor', 'middle')
      .text('Breached %')
      .style('font-size', '16px')
      .style('fill', '#49535e');

    // --- Legend ---
    this.renderSprintsLegend(this.flattenData(this.kpiData), 'Sprints');
  }

  flattenData(data) {
    const sprintMap = new Map();
    let sprintCounter = 1;

    data.forEach((project) => {
      const projectName = project.data.trim();
      project.value.forEach((entry, index) => {
        const dateRange = entry.date?.trim() || `Sprint ${index + 1}`;
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
        console.log(dateRange, 'dateRange');
        console.log(sprintEntry, 'sprintEntry');
        if (dateRange && !sprintEntry.sprints.includes(dateRange)) {
          sprintEntry.sprints.push(entry.sSprintName);
        }

        // Assign hoverValue data (use empty object if missing)
        sprintData[projectName] = Object.keys(entry.hoverValue || {}).reduce(
          (acc, key) => {
            acc[key] = entry.hoverValue[key] || 0;
            return acc;
          },
          {},
        );
      });
    });
    console.log(Array.from(sprintMap.values()), 'sprintMap');
    return Array.from(sprintMap.values());
  }

  renderSprintsLegend(data, xAxisCaption) {
    // this.counter++;
    // if (this.counter === 1) {
    const legendData = data.map((item) => ({
      sprintNumber: item.sprintNumber,
      sprintLabel: item.sprints.join(', '),
    }));
    console.log(legendData, 'legendData');

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

    legend.style('display', 'none'); // Show the legend by default
    legend.attr('aria-hidden', 'true');
    toggleButton.text('Show X-Axis Legend');

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
      .text((d) => d.sprintLabel)
      .style('padding', '10px 10px')
      .style('border-bottom', '1px solid #eee')
      .style('word-break', 'break-word')
      .style('color', '#666');
    // }
  }

  private findOriginalData(projectName: string, sprintName: string): any {
    // Extract sprint number from sprintName (e.g., "Sprint 1" -> 1)
    const sprintNumber = parseInt(sprintName.replace('Sprint ', ''), 10) - 1;

    // Find the project in kpiData
    const projectData = this.kpiData.find((p: any) => p.data === projectName);
    if (
      projectData &&
      projectData.value &&
      projectData.value.length > sprintNumber
    ) {
      return projectData.value[sprintNumber];
    }
    return null;
  }

  private updateDataAndChart(): void {
    if (!this.kpiData) {
      console.warn('No KPI data available');
      return;
    }

    console.log('Processing KPI data:', this.kpiData);

    const sprintGroups: { [key: string]: any[] } = {};

    this.kpiData.forEach((project: any) => {
      console.log('Processing project:', project);

      if (project.value && Array.isArray(project.value)) {
        project.value.forEach((sprint: any, index: number) => {
          const sprintKey = `${index + 1}`;
          if (!sprintGroups[sprintKey]) {
            sprintGroups[sprintKey] = [];
          }

          const severityData: any = { project: project.data || 'Unknown' };

          this.activeSeverityKeys.forEach((severity) => {
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
      // this.updateChart();
      this.createChart();
    }
  }

  private updateChart(): void {
    if (!this.filteredData || Object.keys(this.filteredData).length === 0) {
      console.warn('No filtered data available for chart');
      return;
    }

    if (!this.svg) {
      this.initChart();
    }

    // Clear previous chart elements but keep the SVG structure
    this.svg.selectAll('*').remove();

    const sprints = Object.keys(this.filteredData);
    const projects = Array.from(
      new Set(
        Object.values(this.filteredData)
          .flat()
          .map((d: any) => d.project),
      ),
    );

    console.log('Sprints:', sprints, 'Projects:', projects);

    // Calculate max Y value
    const maxY = this.calculateMaxY() + 20;
    const chartHeight = this.height - this.margin.top - this.margin.bottom;

    // Create scales
    const x0 = d3
      .scaleBand()
      .domain(sprints.map((s) => s.replace('Sprint ', '')))
      .range([0, this.width])
      .padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(projects)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const y = d3.scaleLinear().domain([0, maxY]).range([chartHeight, 0]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(this.activeSeverityKeys)
      .range(this.generateColorShades());

    // Add X axis
    this.svg
      .append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('font-size', '12px');

    // Add Y axis
    this.svg
      .append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', '12px');

    // Add axes labels
    this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', this.width / 2)
      .attr('y', chartHeight + 40)
      .text('Sprints')
      .style('font-size', '14px');

    this.svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -this.margin.left + 15)
      .attr('x', -chartHeight / 2)
      .text('Severity Score (%)')
      .style('font-size', '14px');

    // this.drawGroupedBars(sprints, projects, x0, x1, y, colorScale, chartHeight);

    // Add legend
    this.drawLegend(colorScale);
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

  handleChange(event: any): void {
    this.activeSeverityKeys = event.value.map((f: any) => f);
    if (this.activeSeverityKeys.length === 0) {
      this.activeSeverityKeys = [...this.allSeverityKeys];
    }
    this.updateDataAndChart();
  }

  toggleView(): void {
    // this.updateChart();
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
