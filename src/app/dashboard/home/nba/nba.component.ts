import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class NbaComponent {
  displayModal = false;
  selectedRecommendation: any = {};

  recommendations = [
    {
      priority: 'High',
      title: 'Implement Automated Testing',
      description: 'Increase coverage from 42% to 80%',
      category: 'BizOps Find Ops',
      potentialSavings: '$33,550 potential savings',
    },
    {
      priority: 'Medium',
      title: 'Standardize Code Review',
      description: 'Reduce rework by 40%',
      category: 'Enterprise Cloud Modernization',
      potentialSavings: '$20,130 potential savings',
    },
    {
      priority: 'Low',
      title: 'Reduce Technical Debt in Mobile App',
      description: 'Mobile team shows 35% slower velocity',
      category: 'eCommerce',
      potentialSavings: '$24,156 potential savings',
    },
  ];

  // Sample recommendation details data
  recommendationDetails = {
    infoBoxes: [
      { label: 'Projected Benefit', value: '$24,156', color: 'green' },
      { label: 'Implementation', value: 'Medium', color: 'blue' },
      { label: 'Time to Value', value: '3–4 months', color: 'purple' },
    ],
    kpis: ['Development Speed', 'Code Quality', 'Bug Reduction'],
    actionPlan: [
      {
        step: 1,
        title: 'Assess Current State',
        description: 'Evaluate existing technical debt and team readiness',
      },
      {
        step: 2,
        title: 'Pilot Implementation',
        description: 'Start with a small team to validate approach and ROI',
      },
      {
        step: 3,
        title: 'Scale Across Organization',
        description: 'Roll out successful practices to all relevant teams',
      },
    ],
    showAiRationale: true,
    aiRationaleDescription:
      'Historical data shows teams with regular refinement sessions achieve <strong>85%+</strong> commitment reliability consistently.',
    showSupportingData: true,
    supportingDataList: [
      'Current sprint commitment variance: ±18%',
      'Teams with refinement sessions show 47% less variance',
      'Story point accuracy improves by 23% after 3 sprints',
    ],
  };

  openProjectDetailsPopup(item) {
    this.selectedRecommendation = this.recommendationDetails;
    this.selectedRecommendation.title = item.title;
    this.selectedRecommendation.nodeName = item.category;
    this.displayModal = true;
  }
}
