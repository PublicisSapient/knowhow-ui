import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-stacked-group-bar-chart',
  templateUrl: './stacked-group-bar-chart.component.html',
  styleUrls: ['./stacked-group-bar-chart.component.css'],
})
export class StackedGroupBarChartComponent implements OnInit, OnChanges {
  @Input() kpiData: any;
  @Input() color: string[];
  @Input() data: any; // Seems redundant with kpiData, but keeping it as per your code
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  // --- NEW PROPERTIES FOR CHART STATE ---
  private svg: any;
  private x0: any;
  private x1: any;
  private y: any;
  private tooltip: any;
  private margin = { top: 30, right: 30, bottom: 60, left: 40 };
  private width: number;
  private height: number;
  private projects;
  private sprints: string[];
  private allSeverityKeys = ['s1', 's2', 's3', 's4'];
  private activeSeverityKeys: string[] = [...this.allSeverityKeys]; // Start with all keys active

  // --- FILTER DATA ---
  filter = [
    { option: 'S1', value: 's1', selected: true },
    { option: 'S2', value: 's2', selected: true },
    { option: 'S3', value: 's3', selected: true },
    { option: 'S4', value: 's4', selected: true },
  ];
  filteredData: any; // Your processed data for the chart

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['kpiData'] && this.kpiData) {
      this.initializeChart();
      this.updateDataAndChart();
    }
  }

  private initializeChart(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    const containerWidth = this.chartContainer.nativeElement.clientWidth;
    this.width = containerWidth - this.margin.left - this.margin.right;
    this.height = 250 - this.margin.top - this.margin.bottom;

    this.svg = d3
      .select(this.chartContainer.nativeElement)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.projects = [...new Set(this.kpiData.map((d: any) => d.data))];
    const numSprints = Math.max(
      ...this.kpiData.map((p: any) => p.value.length),
    );
    this.sprints = Array.from(
      { length: numSprints },
      (_, i) => `Sprint ${i + 1}`,
    );

    this.x0 = d3
      .scaleBand()
      .domain(this.sprints)
      .range([0, this.width])
      .padding(0.1);
    this.x1 = d3
      .scaleBand()
      .domain(this.projects)
      .range([0, this.x0.bandwidth()])
      .padding(0.1);
    this.y = d3.scaleLinear().domain([0, 100]).nice().range([this.height, 0]);

    this.svg
      .append('g')
      .attr('transform', `translate(0,${this.height})`)
      .attr('class', 'x-axis')
      .call(d3.axisBottom(this.x0));

    this.svg
      .append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.y).ticks(5));

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', '#000')
      .style('color', '#fff')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');
  }

  private updateDataAndChart(): void {
    if (!this.kpiData || !this.svg) return;

    const sprintGroups: { [key: string]: any[] } = {};

    this.kpiData.forEach((project: any) => {
      project.value.forEach((sprint: any, index: number) => {
        const sprintKey = `Sprint ${index + 1}`;
        if (!sprintGroups[sprintKey]) {
          sprintGroups[sprintKey] = [];
        }

        const severityData: any = { project: project.data };

        this.activeSeverityKeys.forEach((severity) => {
          const found = sprint.drillDown.find(
            (d: any) => d.severity === severity,
          );
          severityData[severity] = found ? found.breachedPercentage : 0;
        });

        sprintGroups[sprintKey].push(severityData);
      });
    });

    this.filteredData = sprintGroups;

    console.log(this.filteredData);
    this.updateChart();
  }

  handleChange(event: any): void {
    this.activeSeverityKeys = event.value.map((f: any) => f.value);

    if (this.activeSeverityKeys.length === 0) {
      this.activeSeverityKeys = [...this.allSeverityKeys];
    }

    this.updateDataAndChart();
  }

  private generateShade(
    baseColor: string,
    index: number,
    total: number,
  ): string {
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex?.slice(1, 3), 16) / 255;
      const g = parseInt(hex?.slice(3, 5), 16) / 255;
      const b = parseInt(hex?.slice(5, 7), 16) / 255;

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
  private findOriginalData(projectName: string, sprintName: string): any {
    // Extract sprint number from sprintName (e.g., "Sprint 1" -> 1)
    const sprintNumber = parseInt(sprintName.replace('Sprint ', ''), 10) - 1;

    // Find the project in kpiData
    const projectData = this.kpiData.find((p: any) => p.data === projectName);
    if (projectData?.value && projectData.value.length > sprintNumber) {
      return projectData.value[sprintNumber];
    }
    return null;
  }

  private updateChart(): void {
    if (!this.kpiData || !this.svg) return;

    this.svg.selectAll('.severity-layer').remove();

    const stack = d3.stack().keys(this.activeSeverityKeys);

    this.sprints.forEach((sprint) => {
      const sprintData = this.filteredData[sprint];
      if (!sprintData) return;

      const stackedData = stack(sprintData);

      const sprintGroup = this.svg
        .append('g')
        .attr('class', 'sprint-group')
        .attr('transform', `translate(${this.x0(sprint)}, 0)`);

      const layer = sprintGroup
        .selectAll('.severity-layer')
        .data(stackedData)
        .enter()
        .append('g')
        .attr('class', (d: any) => `severity-layer severity-${d.key}`)
        .style('fill', (d: any) => {
          const severityIndex = this.allSeverityKeys.indexOf(d.key);
          return this.generateShade(
            this.color[0],
            severityIndex,
            this.allSeverityKeys.length,
          );
        });

      layer
        .selectAll('rect')
        .data((d: any) => d)
        .enter()
        .append('rect')
        .attr('x', (d: any) => this.x1(d.data.project))
        .attr('width', this.x1.bandwidth())
        .attr('y', this.height)
        .attr('height', 0)
        .transition()
        .duration(750)
        .delay((d, i) => i * 100)
        .attr('y', (d: any) => this.y(d[1]))
        .attr('height', (d: any) => this.y(d[0]) - this.y(d[1]));

      layer
        .selectAll('text')
        .data((d: any) => d)
        .enter()
        .append('text')
        .attr(
          'x',
          (d: any) => this.x1(d.data.project) + this.x1.bandwidth() / 2,
        )
        .attr('y', this.height)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text((d: any) => {
          const value = d[1] - d[0];
          return value >= 1 ? `${value.toFixed(0)}` : '';
        })
        .style('fill', 'black')
        .style('font-size', '10px')
        .transition()
        .duration(750)
        .delay((d, i) => i * 100)
        .attr('y', (d: any) => (this.y(d[0]) + this.y(d[1])) / 2);
    });
  }
}
