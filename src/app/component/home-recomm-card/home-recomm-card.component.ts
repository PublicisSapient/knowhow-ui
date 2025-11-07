import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, output } from '@angular/core';

@Component({
  selector: 'app-home-recomm-card',
  standalone: true,
  templateUrl: './home-recomm-card.component.html',
  styleUrls: ['./home-recomm-card.component.css'],
  imports: [CommonModule],
})
export class HomeRecommCardComponent {
  @Input() priority: 'High' | 'Medium' | 'Low' = 'Low';
  @Input() category!: string;
  @Input() title!: string;
  @Input() description!: string;
  @Input() savings!: string;
  @Output() handleProjectClick = new EventEmitter();

  priorityStyle: any = {};
  priorityLabelStyle: any = {};
  priorityClass = 'priority-label';

  ngOnChanges(): void {
    this.setPriorityStyles();
  }

  private setPriorityStyles(): void {
    switch (this.priority) {
      case 'High':
        this.priorityStyle = {
          borderLeft: '6px solid #f68605',
        };
        this.priorityLabelStyle = {
          backgroundColor: '#f68605',
          color: '#fff',
        };
        break;

      case 'Medium':
        this.priorityStyle = {
          borderLeft: '6px solid #fbcf5f',
        };
        this.priorityLabelStyle = {
          backgroundColor: '#fbcf5f',
          color: '#fff',
        };
        break;

      case 'Low':
      default:
        this.priorityStyle = {
          borderLeft: '6px solid #49535e',
        };
        this.priorityLabelStyle = {
          backgroundColor: '#49535e',
          color: '#fff',
        };
        break;
    }
  }

  handleProjectClickDialog() {
    this.handleProjectClick.emit();
  }
}
