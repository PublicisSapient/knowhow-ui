import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface MetricItem {
  label: string;
  value: string | number;
  trend?: 'positive' | 'negative' | 'neutral';
}

@Component({
  selector: 'app-list-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-block.component.html',
  styleUrl: './list-block.component.css',
})
export class ListBlockComponent {
  @Input() title: string = 'This Month';
  @Input() metrics: MetricItem[] = [];
  @Input() trend: 'positive' | 'negative' | 'neutral' = 'neutral';
}
