import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface InfoBox {
  label: string;
  value: string;
  color: string;
}

interface ActionPlanStep {
  step: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-recomm-details',
  standalone: true,
  templateUrl: './recomm-details.component.html',
  styleUrls: ['./recomm-details.component.css'],
  imports: [CommonModule],
})
export class RecommDetailsComponent {
  @Input() infoBoxes: InfoBox[] = [];
  @Input() kpis: string[] = [];
  @Input() actionPlan: ActionPlanStep[] = [];

  @Input() showAiRationale = false;
  @Input() aiRationaleTitle = 'AI Rationale';
  @Input() aiRationaleDescription = '';

  @Input() showSupportingData = false;
  @Input() supportingDataTitle = 'Supporting Data Trends';
  @Input() supportingDataList: string[] = [];

  @Input() kpiSectionTitle = 'Affected Key Performance Indicators';
  @Input() kpiSectionIcon = '🎯';

  @Input() actionPlanTitle = 'Recommended Action Plan';
  @Input() actionPlanIcon = '💡';

  @Input() set benefit(value: string) {
    this.infoBoxes[0] && (this.infoBoxes[0].value = value);
  }
  @Input() set implementation(value: string) {
    this.infoBoxes[1] && (this.infoBoxes[1].value = value);
  }
  @Input() set timeToValue(value: string) {
    this.infoBoxes[2] && (this.infoBoxes[2].value = value);
  }
}
