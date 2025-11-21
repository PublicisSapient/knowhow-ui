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
  @Input() title: string = 'Mean Time to Merge';
  @Input() icon: string = 'pi-clock';
  @Input() metricValue: number = 2.4;
  @Input() metricUnit: string = 'days';
  @Input() trendValue: number = -12;
  @Input() trendLabel: string = 'from last month';
  @Input() iconColor: string = '#0d6efd';

  @Input() data: any;

  // @Input() trendBoxColorObj: string;
  @Input() kpiData: any;
  @Input() loader: boolean;
  @Input() kpiChartData: any[];
  // @Input() trendValueList: any[];
  @Input() kpiTrendsObj: any;
  @Input() kpiId: any;

  ngOnInit() {
    // console.log('Data: ', this.data);
    // console.log('KPI Data:', this.kpiData);
    // console.log('Loader:', this.loader);
    // // console.log('Trend Box Color Object:', this.trendBoxColorObj);
    // console.log('KPI Chart Data:', this.kpiChartData);
    // console.log('Trend Value:', this.trendValueList);
    // console.log('KPI Trends Object:', this.kpiTrendsObj);
    // console.log('kpiId ', this.kpiId);
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
