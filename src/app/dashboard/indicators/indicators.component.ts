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
  @Input() metricValue: number;
  @Input() metricUnit: string;
  @Input() trendValue: number;
  @Input() trendUnit: string;
  @Input() iconColor: string = '#0d6efd';

  @Input() data: any;

  @Input() kpiData: any;
  @Input() loader: boolean;
  @Input() kpiChartData: any[];
  // @Input() trendValueList: any[];
  @Input() kpiTrendsObj: any;
  @Input() kpiId: any;
  @Input() dateFilter: string;
  @Input() kpiIcon: string;

  ngOnInit() {
    console.log('kpiData: ', this.kpiData);
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

  get isUpwardTrend(): boolean {
    return this.trendValue >= 0;
  }

  get trendIcon(): string {
    return this.isUpwardTrend ? 'pi-arrow-up' : 'pi-arrow-down';
  }

  get trendSeverity(): string {
    const upwardIsPositive =
      this.kpiData?.isPositiveTrend !== undefined
        ? this.kpiData.isPositiveTrend
        : true;
    if (this.isUpwardTrend) {
      return upwardIsPositive ? 'success' : 'danger';
    } else {
      return upwardIsPositive ? 'danger' : 'success';
    }
  }

  get absoluteTrendValue(): number {
    return Math.abs(this.trendValue);
  }
}
