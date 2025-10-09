import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-indicators',
  standalone: false,
  templateUrl: './indicators.component.html',
  styleUrl: './indicators.component.css',
})
export class IndicatorsComponent {
  @Input() title: string = 'Mean Time to Merge';
  @Input() icon: string = 'pi-clock';
  @Input() metricValue: number = 2.4;
  @Input() metricUnit: string = 'days';
  @Input() trendValue: number = -12;
  @Input() trendLabel: string = 'from last month';
  @Input() iconColor: string = '#0d6efd';

  get isPositiveTrend(): boolean {
    return this.trendValue >= 0;
  }

  get trendIcon(): string {
    return this.isPositiveTrend ? 'pi-arrow-up' : 'pi-arrow-down';
  }

  get trendSeverity(): string {
    return this.isPositiveTrend ? 'success' : 'danger';
  }

  get absoluteTrendValue(): number {
    return Math.abs(this.trendValue);
  }
}
