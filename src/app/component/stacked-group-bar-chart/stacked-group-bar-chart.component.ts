import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
  HostListener,
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

  constructor() {}

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

    console.log(this.filteredData);

    this.kpiData.forEach((project: any) => {
      project.value.forEach((sprint: any, index: number) => {
        const sprintKey = `Sprint ${index + 1}`;
        if (!sprintGroups[sprintKey]) {
          sprintGroups[sprintKey] = [];
        }

        const severityData: any = {
          project: project.data,
          rate: project.data,
          value: 0,
          ...['s1', 's2', 's3', 's4'].reduce((acc, severity) => {
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
    const severityKeys = ['s1', 's2', 's3', 's4'];

    // Chart dimensions - TODO make it responsive
    const margin = { top: 30, right: 30, bottom: 60, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create chart container
    const svg = d3
      .select(this.chartContainer.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X0 scale for sprints
    const x0 = d3.scaleBand().domain(sprints).range([0, width]).padding(0.1);

    // X1 scale for projects within each sprint
    const x1 = d3
      .scaleBand()
      .domain(projects)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    // TODO replace that 500 value with something that will be made dynamic
    const y = d3.scaleLinear().domain([0, 500]).range([height, 0]).nice();

    const tooltip = d3
      .select('body')
      .append('div') // Append to body to avoid clipping
      .attr('class', 'chart-tooltip') // Changed class name for specificity
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

    // COLOR SETUP
    const color = d3.scaleOrdinal().domain(projects).range(this.color);

    const projectColors = new Map<string, string>();
    this.kpiData.forEach((project: any, index: number) => {
      projectColors.set(project.data, this.color[index % this.color.length]);
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
        .attr('class', 'group')
        .style('fill', (d: any) => {
          const severityIndex = severityKeys.indexOf(d.key);
          let color;
          for (const element of this.color) {
            color = element;
          }

          return this.generateShade(color, severityIndex, severityKeys.length);
        });

      bars
        .selectAll('rect')
        .data((d: any) => d)
        .enter()
        .append('rect')
        .attr('x', (d: any) => x0(sprint) + x1(d.data.project))
        .attr('y', (d: any) => y(d[1]))
        .attr('height', (d: any) => y(d[0]) - y(d[1]))
        .attr('width', x1.bandwidth())
        .on('mouseover', (event, d: any) => {
          const [mouseX, mouseY] = d3.pointer(event, window);
          const originalData = this.findOriginalData(d.data.project, sprint);

          if (originalData?.hoverValue) {
            tooltip
              .style('visibility', 'visible')
              .html(
                `
                <div><strong>Total Resolved:</strong> ${originalData.hoverValue.totalResolvedIssues}</div>
                <div><strong>Breached:</strong> ${originalData.hoverValue.breachedPercentage}%</div>`,
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
        .on('mouseout', () => {
          tooltip.style('visibility', 'hidden');
        });

      // Add labels on bars
      bars
        .selectAll('text')
        .data((d: any) => d)
        .enter()
        .append('text')
        .attr(
          'x',
          (d: any) => x0(sprint) + x1(d.data.project) + x1.bandwidth() / 2,
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

    // Add X axis - sprints
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    // Add Y axis - values
    svg.append('g').call(d3.axisLeft(y).ticks(5));
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
          const sprintKey = `Sprint ${index + 1}`;
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
    console.log('Filtered data:', this.filteredData);

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
    this.activeSeverityKeys = event.value.map((f: any) => f.value);
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
