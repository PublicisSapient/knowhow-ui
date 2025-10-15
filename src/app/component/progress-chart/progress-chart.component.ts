import { Component, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-progress-chart',
  standalone: false,
  templateUrl: './progress-chart.component.html',
  styleUrl: './progress-chart.component.css',
})
export class ProgressChartComponent {
  @ViewChild('chartSvg', { static: true }) svgRef!: ElementRef;

  private data = [
    { label: 'Rework Rate', value: 15, max: 100, target: '<20% rework' },
    { label: 'Revert Rate', value: 5, max: 100, target: '<8% revert' },
  ];

  ngOnInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    const width = 570;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const barHeight = 20;
    const barSpacing = 50;
    const barWidth = width - margin.left - margin.right;

    this.data.forEach((d, i) => {
      const yPos = i * barSpacing;

      // Label and value
      const labelGroup = g
        .append('g')
        .attr('transform', `translate(0,${yPos})`);

      // Icon circle
      labelGroup
        .append('circle')
        .attr('cx', 10)
        .attr('cy', 0)
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5);

      labelGroup
        .append('circle')
        .attr('cx', 10)
        .attr('cy', 0)
        .attr('r', 3)
        .attr('fill', '#666');

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
        .text(`${d.value}/${d.max}`);

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
        .attr('fill', '#000')
        .transition()
        .duration(1000)
        .attr('width', fillWidth);
    });

    // Target text at the bottom
    g.append('text')
      .attr('x', 0)
      .attr('y', this.data.length * barSpacing + 30)
      .attr('font-size', '13px')
      .attr('fill', '#666')
      .text(`Target: ${this.data[0].target}, ${this.data[1].target}`);
  }
}
