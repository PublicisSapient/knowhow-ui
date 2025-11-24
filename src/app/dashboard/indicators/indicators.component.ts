import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-indicators',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './indicators.component.html',
  styleUrl: './indicators.component.css',
})
export class IndicatorsComponent {
  @Input() title: string;
  @Input() icon: string = 'pi-clock';
  @Input() metricValue: number;
  @Input() metricUnit: string;
  @Input() trendValue: number;
  @Input() trendUnit: string;
  @Input() trendLabel: string = 'from last month';
  @Input() iconColor: string = '#0d6efd';

  @Input() data: any;

  @Input() kpiData: any;
  @Input() loader: boolean;
  @Input() kpiChartData: any[];
  // @Input() trendValueList: any[];
  @Input() kpiTrendsObj: any;
  @Input() kpiId: any;
  @Input() dateFilter: string;

  ngOnInit() {
    // console.log('Data: ', this.data);
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  get roundedMetricValue(): number {
    return this.roundToTwoDecimals(this.metricValue);
  }

  get roundedTrendValue(): number {
    return this.roundToTwoDecimals(Math.abs(this.trendValue));
  }

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
