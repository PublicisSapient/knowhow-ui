import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
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
    SkeletonModule,
  ],
})
export class NbaComponent implements OnChanges {
  displayModal = false;
  selectedRecommendation: any = {};
  recommendations: any[] = [];

  @Input() rawData: any[] = [];
  @Input() isLoading: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData']) {
      this.prepareRecommCards();
    }
  }

  openProjectDetailsPopup(item: any): void {
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
    this.displayModal = true;
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
    if (!description) return '';

    // Replace **text** with <strong>text</strong> and add line breaks
    return description
      .replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>')
      .replace(/\. /g, '. <span class="sentence-break"></span>');
  }

  private prepareRecommCards(): void {
    this.recommendations =
      this.rawData?.map((data) => ({
        priority: data.recommendations.severity,
        title: data.recommendations.title,
        description: data.recommendations.description,
        category: data.projectName,
        id: data.projectId,
        potentialSavings: data.recommendations?.saving || '',
        rawData: data.recommendations,
      })) || [];
  }
}
