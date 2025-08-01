import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewContainerRef,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-stacked-bar-chart',
  templateUrl: './stacked-bar-chart.component.html',
})
export class StackedBarChartComponent implements OnInit, OnChanges {
  @Input() data: any[] = []; // Data to be passed from parent component
  @Input() width;
  @Input() height;
  private svg: any;
  private tooltip: any;
  elem;

  constructor(
    private elRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
  ) {
    this.elem = this.viewContainerRef.element.nativeElement;
  }

  ngOnInit(): void {
    if (this.data && this.data.length) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && !changes.data.firstChange) {
      this.updateChart();
    }
  }

  private createChart(): void {
    const chartHeight = 30; // Height of the bar
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartWidth =
      d3.select(this.elem).select('.chart-container').node().offsetWidth -
        margin.left -
        margin.right || window.innerWidth; // Adjusted width to fit within the card
    const radius = 12.5;
    // Calculate total value for scaling
    const totalNegative = Math.abs(
      this.data.filter((d) => d.value < 0).reduce((sum, d) => sum + d.value, 0),
    );
    const totalPositive = this.data
      .filter((d) => d.value > 0)
      .reduce((sum, d) => sum + d.value, 0);
    const total = totalNegative + totalPositive;

    // X scale for proportional widths
    const xScale = d3
      .scaleLinear()
      .domain([-totalNegative, totalPositive])
      .range([0, chartWidth]);

    // Clear any existing SVG content
    d3.select(this.elRef.nativeElement).selectAll('svg').remove();

    // Create the SVG container
    const svg = d3
      .select(this.elRef.nativeElement)
      .append('svg')
      .attr('width', chartWidth + margin.left + margin.right)
      .attr('height', chartHeight + margin.top + margin.bottom);

    // Add axis for context
    const xAxis = d3.axisBottom(xScale).ticks(10);
    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${0})`)
      .attr('class', 'xAxisG')
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // Create vertical gridlines
    const gridlines = svg.append('g').attr('class', 'gridlines');

    // // Add vertical gridlines
    // gridlines.selectAll(".gridline")
    //   .data(xScale.ticks(10)) // Set the number of gridlines
    //   .enter()
    //   .append("line")
    //   .attr("class", "gridline")
    //   .attr("x1", d => xScale(d))
    //   .attr("x2", d => xScale(d))
    //   .attr("y1", -100)
    //   .attr("y2", 100)
    //   .attr("stroke", "#ccc") // Color of the gridlines
    //   .attr("stroke-width", 0.5)
    //   .attr('transform', `translate(${margin.left}, ${margin.top})`)
    // // .attr("stroke-dasharray", "2,2"); // Optional: makes lines dashed

    // Draw the stacked bar chart
    let cumulativeOffset = 0;
    const minWidth = 35;
    const data = this.data.filter((d) => parseInt(d.value) !== 0);
    const totalBars = data.length;

    const g = svg
      .selectAll('.slice')
      .data(data)
      .enter()
      .append('g')
      .attr('transform', (d, index) => {
        const width =
          Math.abs(xScale(d.value) - xScale(0)) >= minWidth
            ? Math.abs(xScale(d.value) - xScale(0))
            : minWidth;

        const offset = cumulativeOffset;

        // For curved joins, subtract radius except first bar
        cumulativeOffset += width - (index < totalBars - 1 ? radius : 0);

        return `translate(${offset + margin.left}, ${margin.top})`;
      })
      .attr('class', 'slice')
      .append('path')
      .attr('d', (d, index) => {
        const width =
          Math.abs(xScale(d.value) - xScale(0)) >= minWidth
            ? Math.abs(xScale(d.value) - xScale(0))
            : minWidth;

        const isFirst = index === 0;
        const isLast = index === totalBars - 1;
        const isOnly = totalBars === 1;

        if (isOnly) {
          // Rounded on both sides
          return `
        M${radius},0
        H${width - radius}
        A${radius},${radius} 0 0 1 ${width},${radius}
        V${chartHeight - radius}
        A${radius},${radius} 0 0 1 ${width - radius},${chartHeight}
        H${radius}
        A${radius},${radius} 0 0 1 0,${chartHeight - radius}
        V${radius}
        A${radius},${radius} 0 0 1 ${radius},0
        Z`;
        }

        if (isFirst) {
          // Rounded on left, curved join on right
          return `
        M${radius},0
        H${width - radius}
        C${width},${chartHeight / 4} ${width},${(3 * chartHeight) / 4} ${
            width - radius
          },${chartHeight}
        H${radius}
        A${radius},${radius} 0 0 1 0,${chartHeight - radius}
        V${radius}
        A${radius},${radius} 0 0 1 ${radius},0
        Z`;
        }

        if (isLast) {
          // Curved join on left, rounded on right
          return `
            M0,0
            C${radius},${chartHeight / 4} ${radius},${
            (3 * chartHeight) / 4
          } 0,${chartHeight}
            H${width - radius}
            A${radius},${radius} 0 0 0 ${width},${chartHeight - radius}
            V${radius}
            A${radius},${radius} 0 0 0 ${width - radius},0
            H0
            Z`;
        }

        // Middle bars: curved join on both sides
        return `
      M0,0
      C${radius},${chartHeight / 4} ${radius},${
          (3 * chartHeight) / 4
        } 0,${chartHeight}
      H${width - radius}
      C${width},${(3 * chartHeight) / 4} ${width},${chartHeight / 4} ${
          width - radius
        },0
      H0
      Z`;
      })
      .attr('fill', (d) => d.color);

    // Reset cumulative offset for labels
    cumulativeOffset = 0;

    // Add labels inside each section
    svg
      .selectAll('.slice')
      .append('text')
      .attr('x', (d) => {
        const width =
          Math.abs(xScale(d.value) - xScale(0)) >= minWidth
            ? Math.abs(xScale(d.value) - xScale(0))
            : minWidth;
        return width / 2;
      })
      .attr('y', chartHeight / 2)
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text((d) => d.value);

    svg.selectAll('.xAxisG *').style('display', 'none');
  }

  private updateChart(): void {
    // Clear previous chart
    d3.select(this.elRef.nativeElement).select('.chart-container').html('');
    this.createChart();
  }
}
