import { Component, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';

interface DataPoint {
  month: string;
  value: number;
  category: string;
}

@Component({
  selector: 'app-scatter-plot-chart',
  standalone: false,
  templateUrl: './scatter-plot-chart.component.html',
  styleUrl: './scatter-plot-chart.component.css',
})
export class ScatterPlotChartComponent {
  @ViewChild('chartSvg', { static: true }) svgRef!: ElementRef;

  private data: DataPoint[] = [
    // January
    { month: 'Jan', value: 80, category: 'Under 100' },
    { month: 'Jan', value: 150, category: '100-300' },
    { month: 'Jan', value: 215, category: '100-300' },
    { month: 'Jan', value: 420, category: '300-500' },

    // February
    { month: 'Feb', value: 90, category: 'Under 100' },
    { month: 'Feb', value: 180, category: '100-300' },
    { month: 'Feb', value: 295, category: '100-300' },
    { month: 'Feb', value: 550, category: '500+' },

    // March
    { month: 'Mar', value: 60, category: 'Under 100' },
    { month: 'Mar', value: 140, category: '100-300' },
    { month: 'Mar', value: 250, category: '100-300' },
    { month: 'Mar', value: 370, category: '300-500' },

    // April
    { month: 'Apr', value: 60, category: 'Under 100' },
    { month: 'Apr', value: 210, category: '100-300' },
    { month: 'Apr', value: 330, category: '300-500' },
    { month: 'Apr', value: 625, category: '500+' },

    // May
    { month: 'May', value: 90, category: 'Under 100' },
    { month: 'May', value: 160, category: '100-300' },
    { month: 'May', value: 270, category: '100-300' },
    { month: 'May', value: 450, category: '300-500' },

    // June
    { month: 'Jun', value: 70, category: 'Under 100' },
    { month: 'Jun', value: 190, category: '100-300' },
    { month: 'Jun', value: 305, category: '300-500' },
    { month: 'Jun', value: 585, category: '500+' },
  ];

  private colorScale: { [key: string]: string } = {
    'Under 100': '#10b981',
    '100-300': '#3b82f6',
    '300-500': '#f59e0b',
    '500+': '#ef4444',
  };

  ngOnInit(): void {
    this.createChart();
  }

  private createChart(): void {
    const svg = d3.select(this.svgRef.nativeElement);
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const xScale = d3
      .scalePoint()
      .domain(months)
      .range([0, chartWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear().domain([0, 800]).range([chartHeight, 0]);

    // Grid lines (draw these first, before axes)
    const yTicks = [0, 200, 400, 600, 800];
    const gridGroup = g.append('g').attr('class', 'grid-lines');

    // Horizontal grid lines
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

    // Vertical grid lines for x-axis
    months.forEach((month) => {
      const xPos = xScale(month) || 0;
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
    const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(10);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#666');

    // Y-axis
    const yAxis = d3
      .axisLeft(yScale)
      .tickValues(yTicks)
      .tickSize(0)
      .tickPadding(10);

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

    // Plot points with animation - no jitter, align vertically
    g.selectAll('.data-point')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.month) || 0)
      .attr('cy', chartHeight)
      .attr('r', 6)
      .attr('fill', (d) => this.colorScale[d.category])
      .attr('opacity', 0.8)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 30)
      .attr('cy', (d) => yScale(d.value));

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width / 2 - 150},${height - 40})`);

    const legendData = [
      { label: 'Under 100', color: this.colorScale['Under 100'] },
      { label: '100-300', color: this.colorScale['100-300'] },
      { label: '300-500', color: this.colorScale['300-500'] },
      { label: '500+', color: this.colorScale['500+'] },
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend
        .append('g')
        .attr('transform', `translate(${i * 80},0)`);

      legendItem
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', item.color);

      legendItem
        .append('text')
        .attr('x', 12)
        .attr('y', 4)
        .style('font-size', '11px')
        .style('fill', '#666')
        .text(item.label);
    });
  }
}
