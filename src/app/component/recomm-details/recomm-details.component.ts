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
  @Input() benefit!: string;
  @Input() implementation!: string;
  @Input() timeToValue!: string;
  @Input() kpis: string[] = [];
  @Input() actionPlan: { step: number; title: string; description: string }[] =
    [];
}
