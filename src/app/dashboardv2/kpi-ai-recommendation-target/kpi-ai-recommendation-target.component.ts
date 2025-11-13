import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { RecommDetailsComponent } from 'src/app/component/recomm-details/recomm-details.component';
import { HttpService } from 'src/app/services/http.service';

@Component({
  selector: 'app-kpi-ai-recommendation-target',
  templateUrl: './kpi-ai-recommendation-target.component.html',
  styleUrls: ['./kpi-ai-recommendation-target.component.css'],
  standalone: true,
  imports: [CommonModule, RecommDetailsComponent, DialogModule],
})
export class KpiAiRecommendationTargetComponent {
  displayAiRecommModal: boolean = false;
  aiRecommendationData = {
    infoBoxes: [
      {
        label: 'Potential Benefit',
        value: '+9.0% improvement',
        color: 'green',
      },
      { label: 'Implementation Effort', value: 'Medium', color: 'orange' },
      { label: 'Time to Value', value: '2-3 sprints', color: 'blue' },
    ],
    kpis: ['Commitment Reliability', 'Sprint Velocity', 'Team Performance'],
    actionPlan: [
      {
        step: 1,
        title: 'Analyze Current Performance',
        description:
          'Review historical data and identify bottlenecks in the current sprint planning process.',
      },
      {
        step: 2,
        title: 'Implement AI Recommendations',
        description:
          'Apply suggested capacity adjustments and story point estimations based on team velocity patterns.',
      },
      {
        step: 3,
        title: 'Monitor and Adjust',
        description:
          'Track progress over next 2-3 sprints and fine-tune recommendations based on actual outcomes.',
      },
    ],
    kpiSectionTitle: 'Affected Key Performance Indicators',
    actionPlanTitle: 'Recommended Action Plan',
    aiRationaleDescription:
      "Based on analysis of your team's historical performance data, the AI has identified patterns in sprint planning that suggest a 9% improvement is achievable by optimizing story point allocation and addressing capacity planning inefficiencies.",
  };

  @Input() kpiData: any = {};
  @Input() targetValue: string = '85%';
  @Input() improvement: string = '+9.0%';
  @Input() improvementLabel: string = 'improvement';
  @Output() viewPlanClick = new EventEmitter<void>();

  constructor(private httpService: HttpService) {}

  onViewPlanClick(): void {
    this.displayAiRecommModal = true;
  }

  fetchData() {
    this.httpService.getkpiAITargetRecommData({}).subscribe({
      next: (responce) => {
        if (responce.success) {
          this.aiRecommendationData = responce.data;
        }
      },
      error(err) {},
    });
  }
}
