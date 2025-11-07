import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { HomeRecommCardComponent } from 'src/app/component/home-recomm-card/home-recomm-card.component';
import { RecommDetailsComponent } from 'src/app/component/recomm-details/recomm-details.component';

@Component({
  selector: 'app-nba',
  standalone: true,
  templateUrl: './nba.component.html',
  styleUrls: ['./nba.component.css'],
  imports: [
    CommonModule,
    HomeRecommCardComponent,
    RecommDetailsComponent,
    DialogModule,
  ],
})
export class NbaComponent implements OnChanges {
  displayModal = false;
  selectedRecommendation: any = {};
  recommendations: any[] = [];

  @Input() rawData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData']) {
      this.prepareRecommCards();
    }
  }

  openProjectDetailsPopup(item: any): void {
    this.selectedRecommendation = {
      infoBoxes: [
        {
          label: 'Projected Benefit',
          value: item.rawData.saving,
          color: 'green',
        },
        {
          label: 'Implementation',
          value: item.rawData.recommendationType,
          color: this.getPriorityColor(item.rawData.recommendationType),
        },
        {
          label: 'Time to Value',
          value: item.rawData.timeToVale,
          color: 'purple',
        },
      ],
      kpis: item.rawData.keyPerformanceIndicator,
      kpiSectionTitle: 'Affected Key Performance Indicators',
      actionPlanTitle: 'Recommended Action Plan',
      actionPlan: item.rawData.recommendedActionPlan.actionPlan,
      title: item.title,
      nodeName: item.category,
    };
    this.displayModal = true;
  }

  getPriorityColor(priority) {
    switch (priority) {
      case 'High':
        return '#f68605';
      case 'Medium':
        return '#fbcf5f';
      case 'Low':
      default:
        return '#49535e';
    }
  }

  private prepareRecommCards(): void {
    this.recommendations =
      this.rawData?.map((data) => ({
        priority: data.recommendations.recommendationType,
        title: data.recommendations.observation,
        description: data.recommendations.recommendationDetails,
        category: data.nodeName,
        id: data.nodeId,
        potentialSavings: data.recommendations.saving,
        rawData: data.recommendations,
      })) || [];
  }
}
