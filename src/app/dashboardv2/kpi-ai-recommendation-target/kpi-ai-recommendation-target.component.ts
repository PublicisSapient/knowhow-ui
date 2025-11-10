import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-kpi-ai-recommendation-target',
  templateUrl: './kpi-ai-recommendation-target.component.html',
  styleUrls: ['./kpi-ai-recommendation-target.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class KpiAiRecommendationTargetComponent {
  @Input() targetValue: string = '85%';
  @Input() improvement: string = '+9.0%';
  @Input() improvementLabel: string = 'improvement';
  @Output() viewPlanClick = new EventEmitter<void>();

  onViewPlanClick(): void {
    this.viewPlanClick.emit();
  }
}
