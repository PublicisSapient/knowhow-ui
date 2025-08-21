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
  private isStacked = true;
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
      this.updateDataAndChart();
    }
    if (changes['color'] && this.color) {
      this.updateChart();
    }
  }

  ngAfterViewInit(): void {
    this.isInitialized = true;
    this.initChart();
    if (this.kpiData) {
      this.updateDataAndChart();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.filteredData) {
      this.updateChart();
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
      this.updateChart();
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

    // Draw bars based on view type
    if (this.isStacked) {
      this.drawStackedBars(
        sprints,
        projects,
        x0,
        x1,
        y,
        colorScale,
        chartHeight,
      );
    } else {
      this.drawGroupedBars(
        sprints,
        projects,
        x0,
        x1,
        y,
        colorScale,
        chartHeight,
      );
    }

    // Add legend
    this.drawLegend(colorScale);
  }

  private drawStackedBars(
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

        let currentY = 0;

        this.activeSeverityKeys.forEach((severity, j) => {
          const value = projectData[severity] || 0;
          if (value > 0) {
            const bar = this.svg
              .append('rect')
              .attr('x', x0(sprintName) + x1(project))
              .attr('y', y(currentY + value))
              .attr('height', y(currentY) - y(currentY + value))
              .attr('width', x1.bandwidth())
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

            currentY += value;
          }
        });
      });
    });
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
    this.isStacked = !this.isStacked;
    this.updateChart();
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
