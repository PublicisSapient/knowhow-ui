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
        this.priorityStyle = { borderLeft: '6px solid #E74C3C' };
        this.priorityLabelStyle = {
          backgroundColor: '#FDECEA',
          color: '#D93025',
        };
        break;

      case 'Medium':
        this.priorityStyle = { borderLeft: '6px solid #F4B400' };
        this.priorityLabelStyle = {
          backgroundColor: '#FFF8E1',
          color: '#F9A825',
        };
        break;

      case 'Low':
      default:
        this.priorityStyle = { borderLeft: '6px solid #81C784' };
        this.priorityLabelStyle = {
          backgroundColor: '#E8F5E9',
          color: '#388E3C',
        };
        break;
    }
  }

  handleProjectClickDialog() {
    this.handleProjectClick.emit();
  }
}
