import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

interface MaturityData {
  data: string;
  date: string;
  kpiGroup: string;
  sprojectName: string;
  value: number;
}

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  imports: [],
  templateUrl: './progress-chart.component.html',
  styleUrl: './progress-chart.component.css',
})
export class ProgressChartComponent implements OnChanges, AfterViewInit {
  @ViewChild('chartSvg', { static: false }) svgRef!: ElementRef;
  @Input() chartData: MaturityData[];

  private transformedData: {
    label: string;
    value: number;
    max: number;
    target: string;
    kpiGroup: string;
  }[] = [];

  constructor() {}

  ngAfterViewInit(): void {
    // console.log('progress chart ', this.chartData);
    if (this.chartData) {
      this.transformData();
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && changes['chartData'].currentValue) {
      // Clear previous chart
      d3.select(this.svgRef?.nativeElement).selectAll('*').remove();

      this.transformData();
      this.createChart();
    }
  }

  private transformData(): void {
    if (!this.chartData || this.chartData.length === 0) {
      console.warn('Invalid data structure received');
      this.transformedData = [];
      return;
    }

    const valueArray = this.chartData;
    this.transformedData = valueArray.map((item) => ({
      label: item.data, // 'Rework Rate' or 'Revert Rate'
      value: item.value || 0, // The numeric value (0.0 if empty)
      max: 100,
      target: item.data.includes('Rework') ? '<20%' : '<8%', // Determine target based on label
      kpiGroup: item.kpiGroup,
    }));
  }

  private createChart(): void {
    const svg = d3.select(this.svgRef?.nativeElement);
    const width = 825;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', 'auto');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const barHeight = 20;
    const barSpacing = 50;
    const barWidth = width - margin.left - margin.right;

    if (!this.transformedData || this.transformedData.length === 0) {
      console.warn('No data to render');
      return;
    }

    this.transformedData.forEach((d, i) => {
      const yPos = i * barSpacing;

      const iconClass = d.label.toLowerCase().includes('rework')
        ? 'pi pi-code'
        : 'pi pi-times-circle';

      // Label and value
      const labelGroup = g
        .append('g')
        .attr('transform', `translate(0,${yPos})`);

      // Icon
      labelGroup
        .append('foreignObject')
        .attr('x', 2)
        .attr('y', -10)
        .attr('width', 26)
        .attr('height', 26)
        .append('xhtml:i')
        .attr('class', `${iconClass}`)
        .style('color', '#666')
        .style('font-size', '20px')
        .style('line-height', '1');

      // Label text
      labelGroup
        .append('text')
        .attr('x', 30)
        .attr('y', 5)
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .text(d.label);

      // Value text
      labelGroup
        .append('text')
        .attr('x', barWidth - 50)
        .attr('y', 5)
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .attr('text-anchor', 'end')
        .text(`${d.value.toFixed(2)}/${d.max}`);

      // Progress bar background
      const barGroup = g
        .append('g')
        .attr('transform', `translate(0,${yPos + 15})`);

      barGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('rx', 10)
        .attr('fill', '#e0e0e0');

      // Progress bar fill
      const fillWidth = (d.value / d.max) * barWidth;
      barGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', barHeight)
        .attr('rx', 10)
        .attr('fill', '#6079c5')
        .transition()
        .duration(1000)
        .attr('width', fillWidth);
    });

    // Target text at the bottom
    if (this.transformedData.length > 0) {
      g.append('text')
        .attr('x', 0)
        .attr('y', this.transformedData.length * barSpacing + 35)
        .attr('font-size', '13px')
        .attr('fill', '#666')
        .text(
          `Target: ${this.transformedData
            .map((d) => {
              const metricName = d.label.toLowerCase().includes('rework')
                ? 'rework'
                : 'revert';
              return `${d.target} ${metricName}`;
            })
            .join(', ')}`,
        );
    }
  }
}
