import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
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
export class NbaComponent implements OnInit {
  displayModal = false;
  selectedRecommendation: any = {};
  recommendations: any = [];

  @Input() rawData: Array<any> = [];

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.prepareRecommCards();
  }

  openProjectDetailsPopup(item, i) {
    this.prepareTopBoxData(item);
    this.selectedRecommendation.kpis = item.rawData.keyPerformanceIndicator;
    this.selectedRecommendation.kpiSectionTitle =
      'Affected Key Performance Indicators';
    this.selectedRecommendation.actionPlanTitle = 'Recommended Action Plan';
    this.selectedRecommendation.actionPlan =
      item.rawData.recommendedActionPlan.actionPlan;
    this.selectedRecommendation.title = item.title;
    this.selectedRecommendation.nodeName = item.category;
    this.displayModal = true;
  }

  prepareTopBoxData(item) {
    this.selectedRecommendation.infoBoxes = [];
    this.selectedRecommendation.infoBoxes.push({
      label: 'Projected Benefit',
      value: item.rawData.saving,
      color: 'green',
    });
    this.selectedRecommendation.infoBoxes.push({
      label: 'Implementation',
      value: item.rawData.recommendationType,
      color: 'blue',
    });
    this.selectedRecommendation.infoBoxes.push({
      label: 'Time to Value',
      value: item.rawData.timeToVale,
      color: 'purple',
    });
  }

  prepareRecommCards() {
    if (!this.rawData || this.rawData.length == 0) {
      this.recommendations = [];
    }

    this.rawData.forEach((data) => {
      const tempObj = {
        priority: data.recommendations.recommendationType,
        title: data.recommendations.observation,
        description: data.recommendations.recommendationDetails,
        category: data.nodeName,
        id: data.nodeId,
        potentialSavings: data.recommendations.saving,
        rawData: data.recommendations,
      };
      this.recommendations.push(tempObj);
    });
  }
}
