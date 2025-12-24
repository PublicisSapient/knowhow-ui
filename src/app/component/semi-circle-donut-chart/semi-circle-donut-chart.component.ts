import {
  Component,
  Input,
  OnInit,
  ElementRef,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import * as d3 from 'd3';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-semi-circle-donut-chart',
  templateUrl: './semi-circle-donut-chart.component.html',
  styleUrls: ['./semi-circle-donut-chart.component.css'],
})
export class SemiCircleDonutChartComponent implements OnInit, OnChanges {
  @Input() value = 0; // Value for the chart (e.g., 86 for 86%)
  @Input() max = 100; // Maximum value for the chart
  @Input() width = 200; // Width of the chart
  @Input() height = 100; // Height of the chart (half the width)
  @Input() kpiId = '';
  @Input() totalIssues = 0;
  @Input() color;
  @Input() chartData: any;
  @Input() viewType = 'chart';

  constructor(private elementRef: ElementRef, private service: SharedService) {}

  ngOnInit(): void {
    if (this.kpiId === 'kpi182') {
      this.service.showTableViewObs.subscribe((view) => {
        this.viewType = view;
      });
      this.extractKpi182Data();
    }
    this.createDonutChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if the value input has changed
    if (changes.value) {
      this.value = parseInt(this.value + '');
      this.totalIssues = parseInt(this.totalIssues + '');
      this.createDonutChart();
    }

    // Handle chartData changes for kpi182
    if (changes['chartData'] && this.kpiId === 'kpi182') {
      this.extractKpi182Data();
      this.createDonutChart();
    }
  }

  private extractKpi182Data(): void {
    if (!this.chartData || this.chartData.length === 0) {
      console.warn('No chartData available for kpi182');
      this.value = 0;
      this.totalIssues = 0;
      return;
    }

    // Extract value from the nested structure
    const firstItem = this.chartData[0];
    if (firstItem?.value && firstItem.value.length > 0) {
      const dataValue = firstItem.value[0];
      this.value = dataValue.value || 0; // Extract numeric value
      this.totalIssues = 100; // Set max value to 100 for percentage display
    }
  }

  private createDonutChart(): void {
    if (this.kpiId === 'kpi182') {
      const chartWidth = 250;
      const chartHeight = 250;
      const radius = Math.min(chartWidth, chartHeight) / 2;
      const thickness = Math.floor(radius / 3);

      // Clear existing SVG content
      d3.select(this.elementRef.nativeElement).selectAll('svg').remove();

      // Create the SVG container
      const svg = d3
        .select(this.elementRef.nativeElement)
        .append('svg')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .style('display', 'block')
        .style('margin', '0 auto')
        .append('g')
        .attr('transform', `translate(${chartWidth / 2}, ${chartHeight / 2})`);

      // Create arc generator
      const roundedArc = d3
        .arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius);

      // Create pie generator
      const pie = d3
        .pie()
        .sort(null)
        .value((d) => d.value);

      // Define the data (completed and remaining)
      const data = [
        {
          value: this.value,
          color: this.color?.length ? this.color : '#15ba40',
        },
        {
          value: this.totalIssues - this.value,
          color: '#fe414d',
        },
      ];

      // Append the arcs
      svg
        .selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', roundedArc)
        .attr('fill', (d) => d.data.color);

      // Add central text
      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.5em')
        .style('font-weight', 'bold')
        .style('fill', '#15ba40')
        .text(this.value.toFixed(1));

      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .style('font-size', '14px')
        .style('fill', '#15ba40')
        .text('%');
    } else {
      const chartWidth = this.width === undefined ? 100 : this.width; // Width of the chart
      const chartHeight = this.height === undefined ? 200 : this.height; // Height of the chart
      const radius = Math.min(chartWidth, chartHeight) / 2; // Radius of the donut
      const thickness = Math.floor(radius / 3); // Thickness of the donut ring
      // Clear existing SVG content
      d3.select(this.elementRef.nativeElement).selectAll('svg').remove();

      // Create the SVG container
      const svg = d3
        .select(this.elementRef.nativeElement)
        .append('svg')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .append('g')
        .attr('transform', `translate(${chartWidth / 2}, ${chartHeight / 2})`); // Center the chart

      // Create arc generator
      const roundedArc = d3
        .arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius);
      // .cornerRadius(thickness / 2); // rounded ends

      // Create arc generator
      const arc = d3
        .arc()
        .innerRadius(radius - thickness)
        .outerRadius(radius);

      // Create pie generator
      const pie = d3
        .pie()
        .sort(null)
        .value((d) => d.value);

      // Define the data (completed and remaining)
      const data = [
        {
          value: this.calculatePercentage(+this.value, +this.totalIssues),
          color: this.color?.length ? this.color : '#15ba40',
        }, // Blue color for completed
        {
          value:
            this.max - this.calculatePercentage(+this.value, +this.totalIssues),
          color: '#fe414d',
        }, // Gray color for remaining
      ];

      // Append the arcs
      const path = svg
        .selectAll('path')
        .data(pie(data))
        .enter()
        .append('path')
        .attr('d', roundedArc)
        .attr('fill', (d) => d.data.color);

      // Add central text
      if (this.kpiId !== 'kpi124') {
        svg
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.5em') // Adjust text position
          //.style('font-size', '18px')
          .style('font-weight', 'bold')
          .style('fill', '#15ba40')
          .text(this.value);

        svg
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1em') // Adjust text position
          .style('font-size', '14px')
          .style('fill', '#15ba40')
          .text('%');
      } else {
        svg
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.5em') // Adjust text position
          //.style('font-size', '18px')
          .style('font-weight', 'bold')
          .style('fill', '#15ba40')
          .text(this.value + '/' + this.totalIssues);
      }
    }
  }

  calculatePercentage(value, total) {
    if (total === 0) {
      return value;
    }
    return (value / total) * 100;
  }
}
