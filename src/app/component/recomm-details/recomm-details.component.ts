import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-recomm-details',
  standalone: true,
  templateUrl: './recomm-details.component.html',
  styleUrls: ['./recomm-details.component.css'],
  imports: [CommonModule],
})
export class RecommDetailsComponent {
  @Input() infoBoxes: { label: string; value: string; color: string }[] = [
    { label: 'Projected Benefit', value: '', color: 'green' },
    { label: 'Implementation', value: '', color: 'blue' },
    { label: 'Time to Value', value: '', color: 'purple' },
  ];
  @Input() kpis: string[] = [];
  @Input() actionPlan: { step: number; title: string; description: string }[] =
    [];

  // New configurable properties
  @Input() showAiRationale: boolean = false;
  @Input() aiRationaleTitle: string = 'AI Rationale';
  @Input() aiRationaleDescription: string = '';

  @Input() showSupportingData: boolean = false;
  @Input() supportingDataTitle: string = 'Supporting Data Trends';
  @Input() supportingDataList: string[] = [];

  @Input() kpiSectionTitle: string = 'Affected Key Performance Indicators';
  @Input() kpiSectionIcon: string = '🎯';

  @Input() actionPlanTitle: string = 'Recommended Action Plan';
  @Input() actionPlanIcon: string = '💡';

  // Backward compatibility
  @Input() set benefit(value: string) {
    if (this.infoBoxes[0]) this.infoBoxes[0].value = value;
  }
  @Input() set implementation(value: string) {
    if (this.infoBoxes[1]) this.infoBoxes[1].value = value;
  }
  @Input() set timeToValue(value: string) {
    if (this.infoBoxes[2]) this.infoBoxes[2].value = value;
  }
}
