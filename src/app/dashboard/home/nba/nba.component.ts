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

  openProjectDetailsPopup() {
    this.displayModal = true;
  }
}
