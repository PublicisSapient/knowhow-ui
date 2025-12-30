import { Component, OnInit } from '@angular/core';
import { MetricsService } from '../../services/metrics.service';

@Component({
  selector: 'app-metrics-endpoint',
  template: `<pre>{{ metricsData }}</pre>`,
  styles: [
    `
      pre {
        font-family: monospace;
        white-space: pre-wrap;
        margin: 0;
        padding: 10px;
        background: #f5f5f5;
      }
    `,
  ],
})
export class MetricsEndpointComponent implements OnInit {
  metricsData = '';

  constructor(private readonly metricsService: MetricsService) {}

  ngOnInit(): void {
    // Update metrics every 5 seconds
    this.updateMetrics();
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }

  private updateMetrics(): void {
    this.metricsData = this.metricsService.getPrometheusMetrics();
  }
}
