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
  @Input() color;
  @Input() data;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.kpiData);
    console.log(this.color);
    if (this.kpiData) {
      this.createChart();
    }
  }

  private createChart(): void {
    d3.select(this.chartContainer.nativeElement).selectAll('*').remove();
    const sprintGroups: { [key: string]: any[] } = {};

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

    // COLOR SETUP
    const color = d3.scaleOrdinal().domain(projects).range(this.color);

    // Draw the bars
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
          // TODO figure out why it does not change color
          const projectName = d[0].data.project;
          const baseColor = color(projectName);

          // Generate shades from base color based on severity
          // TODO see why shades from one color are used
          const severityIndex = severityKeys.indexOf(d.key);
          return this.generateShade(
            baseColor,
            severityIndex,
            severityKeys.length,
          );
        });

      bars
        .selectAll('rect')
        .data((d: any) => d)
        .enter()
        .append('rect')
        .attr('x', (d: any) => x0(sprint) + x1(d.data.project))
        .attr('y', (d: any) => y(d[1]))
        .attr('height', (d: any) => y(d[0]) - y(d[1]))
        .attr('width', x1.bandwidth());

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

  // Helper function to generate shades from base color
  private generateShade(
    baseColor: string,
    index: number,
    total: number,
  ): string {
    // Convert hex to HSL
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

    // Convert HSL to hex
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
    // Vary lightness based on index
    const newLightness = l + index * (60 / total) - 30;
    return hslToHex(h, s, Math.min(95, Math.max(15, newLightness)));
  }

  // private generateColorShades(baseColor: string, count: number): string[] {
  //   // Convert hex to HSL (better for generating shades)
  //   const hexToHsl = (hex: string) => {
  //     const r = parseInt(hex.slice(1, 3), 16) / 255;
  //     const g = parseInt(hex.slice(3, 5), 16) / 255;
  //     const b = parseInt(hex.slice(5, 7), 16) / 255;

  //     const max = Math.max(r, g, b);
  //     const min = Math.min(r, g, b);
  //     let h = 0,
  //       s = 0,
  //       l = (max + min) / 2;

  //     if (max !== min) {
  //       const d = max - min;
  //       s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  //       switch (max) {
  //         case r:
  //           h = (g - b) / d + (g < b ? 6 : 0);
  //           break;
  //         case g:
  //           h = (b - r) / d + 2;
  //           break;
  //         case b:
  //           h = (r - g) / d + 4;
  //           break;
  //       }
  //       h /= 6;
  //     }

  //     return [h * 360, s * 100, l * 100];
  //   };

  //   // Convert HSL to hex
  //   const hslToHex = (h: number, s: number, l: number) => {
  //     l /= 100;
  //     const a = (s * Math.min(l, 1 - l)) / 100;
  //     const f = (n: number) => {
  //       const k = (n + h / 30) % 12;
  //       const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  //       return Math.round(255 * color)
  //         .toString(16)
  //         .padStart(2, '0');
  //     };
  //     return `#${f(0)}${f(8)}${f(4)}`;
  //   };

  //   const [h, s, l] = hexToHsl(baseColor);
  //   const shades = [];

  //   // Generate shades by varying lightness
  //   for (let i = 0; i < count; i++) {
  //     const lightness = l + i * 10 - count * 5;
  //     const newL = Math.min(95, Math.max(15, lightness));
  //     shades.push(hslToHex(h, s, newL));
  //   }

  //   console.log(shades);
  //   return shades;
  // }
}
