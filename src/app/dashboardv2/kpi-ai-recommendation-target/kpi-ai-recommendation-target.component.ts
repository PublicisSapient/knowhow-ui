import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  SimpleChanges,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { RecommDetailsComponent } from 'src/app/component/recomm-details/recomm-details.component';
import { HttpService } from 'src/app/services/http.service';
import { MetricsService } from 'src/app/services/metrics.service';

@Component({
  selector: 'app-kpi-ai-recommendation-target',
  templateUrl: './kpi-ai-recommendation-target.component.html',
  styleUrls: ['./kpi-ai-recommendation-target.component.css'],
  standalone: true,
  imports: [CommonModule, RecommDetailsComponent, DialogModule],
})
export class KpiAiRecommendationTargetComponent {
  displayAiRecommModal: boolean = false;
  aiRecommendationData: any;
  selectedRecommendation: any;
  @Input() kpiData: any = {};
  @Input() targetValue: any;
  @Input() improvement: string = '+9.0%';
  @Input() improvementLabel: string = 'improvement';
  @Input() kpiRecommData: any;
  @Input() kpiChartData: any;

  @Output() viewPlanClick = new EventEmitter<void>();

  constructor(
    private readonly httpService: HttpService,
    private readonly metricsService: MetricsService,
  ) {}

  ngOnInit(): void {
    this.aiRecommendationData = {
      priority: this.kpiRecommData.recommendations.severity,
      title: this.kpiRecommData.recommendations.title,
      description: this.kpiRecommData.recommendations.description,
      category: this.kpiRecommData.projectName,
      id: this.kpiRecommData.kpiId,
      potentialSavings: this.kpiRecommData.recommendations?.saving || '',
      rawData: this.kpiRecommData.recommendations,
    };
    this.preapareToRenderData(this.aiRecommendationData);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.preapreBenchMark();
  }

  preapareToRenderData(item: any) {
    this.selectedRecommendation = {
      infoBoxes: [
        {
          label: 'Implementation',
          value: item.rawData.severity,
          color: this.getPriorityColor(item.rawData.severity),
        },
        {
          label: 'Time to Value',
          value: item.rawData.timeToValue,
          color: 'purple',
        },
      ],
      kpis: item.rawData?.keyPerformanceIndicator || [],
      kpiSectionTitle: 'Affected Key Performance Indicators',
      actionPlanTitle: 'Recommended Action Plan',
      actionPlan: item.rawData.actionPlans.map((list, i) => {
        return {
          step: i + 1,
          title: list.title,
          description: this.formatActionPlanDescription(list.description),
        };
      }),
      title: item.title,
      nodeName: item.category,
    };
  }

  getPriorityColor(priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#f68605';
      case 'medium':
        return '#fbcf5f';
      case 'critical':
        return '#ed8888';
      case 'low':
      default:
        return '#49535e';
    }
  }

  formatActionPlanDescription(description: string): string {
    if (!description) {
      return '';
    }

    // Replace **text** with <strong>text</strong> using safer string manipulation
    let result = description;

    // Split by ** and process pairs
    const parts = result.split('**');
    if (parts.length > 1) {
      result = '';
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          result += parts[i];
        } else {
          result += `<span class="bold-text">${parts[i]}</span>`;
        }
      }
    }

    return result.replace(/\. /g, '. <span class="sentence-break"></span>');
  }

  preapreBenchMark() {
    let maxYValue = 0;
    for (const i in this.kpiChartData) {
      for (let j = 0; j < this.kpiChartData[i].value?.length; j++) {
        this.kpiChartData[i].value[j].xName = this.kpiChartData[i]?.value[
          j
        ]?.hasOwnProperty('xAxisTick')
          ? this.kpiChartData[i]?.value[j]?.xAxisTick
          : j + 1;
        this.kpiChartData[i].value[j].xOrder = this.kpiChartData[i].value[j]
          ?.isForecast
          ? 'Forecast'
          : j + 1;
        if (maxYValue < parseInt(this.kpiChartData[i].value[j]?.value, 10)) {
          maxYValue = this.kpiChartData[i].value[j].value;
        }
      }
    }
    const benchmark = this.resolveBenchmarkPercentiles(this.kpiChartData?.[0]);

    this.targetValue =
      parseFloat(
        this.getBenchmarkValue(
          this.kpiChartData?.[0]?.value,
          benchmark,
          this.kpiChartData?.[0],
        )?.toFixed(2),
      ) || 'NA';
  }

  getBenchmarkValue(
    points?: Array<{
      value: number | string;
      data?: number | string;
      isForecast?: boolean;
    }>,
    percentiles?: Record<string, number>,
    dataEntry?: Record<string, any>,
  ): number | null {
    if (!points?.length || !percentiles) {
      return null;
    }
    const highestActualValue = Math.max(
      ...points
        .filter((p) => !p?.isForecast)
        .map((p) => Number(p?.value ?? p?.data))
        .filter(Number.isFinite),
    );

    const sortedPercentiles = [
      percentiles.seventyPercentile,
      percentiles.eightyPercentile,
      percentiles.nintyPercentile,
    ]
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    if (this.isNegativeTrend(this.getTrendIndicator(dataEntry), points)) {
      return sortedPercentiles[0] ?? null;
    }

    return (
      sortedPercentiles.find((val) => val > highestActualValue) ??
      sortedPercentiles[sortedPercentiles.length - 1]
    );
  }

  getTrendIndicator(dataEntry?: Record<string, any>): string {
    return (
      dataEntry?.trend ??
      dataEntry?.trendValue ??
      dataEntry?.trendStatus ??
      dataEntry?.trendDirection ??
      dataEntry?.trendIndicator ??
      ''
    );
  }

  isNegativeTrend(
    trendIndicator?: string,
    points?: Array<{
      value: number | string;
      data?: number | string;
      isForecast?: boolean;
    }>,
  ): boolean {
    const normalized = (trendIndicator || '').toLowerCase();
    if (normalized) {
      return (
        normalized.includes('-ve') ||
        normalized.includes('negative') ||
        normalized.includes('down')
      );
    }

    const actualValues =
      points
        ?.filter((p) => !p?.isForecast)
        .map((p) => Number(p?.value ?? p?.data))
        .filter(Number.isFinite) || [];
    if (actualValues.length < 2) {
      return false;
    }
    return (
      actualValues[actualValues.length - 1] <
      actualValues[actualValues.length - 2]
    );
  }

  resolveBenchmarkPercentiles(
    dataEntry?: Record<string, any>,
  ): Record<string, number> | null {
    return dataEntry?.benchmarkPercentiles
      ? dataEntry?.benchmarkPercentiles
      : null;
  }

  onViewPlanClick(): void {
    this.metricsService.trackAiKpiRecommendation(
      this.kpiData?.kpiId || 'unknown',
    );
    this.displayAiRecommModal = true;
  }
}
