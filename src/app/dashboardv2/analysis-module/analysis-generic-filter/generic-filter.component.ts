import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-generic-filter',
  templateUrl: './generic-filter.component.html',
  styleUrls: ['./generic-filter.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    DropdownModule,
    ButtonModule,
  ],
})
export class GenericFilterComponent {
  @Input() config: any;
  @Input() data: any;
  @Input() optionLabel: string = 'nodeDisplayName';
  @Input() optionValue: string = 'nodeId';
  @Input() placeholder: string = 'Select...';
  @Output() selectionChange = new EventEmitter<any>();

  selectedValue: any;

  get options() {
    return this.data?.[this.config?.defaultLevel?.labelName] || [];
  }

  onSelectionChange(event: any) {
    if (this.config?.type === 'singleSelect') {
      this.selectionChange.emit({value :event.value,type : this.config?.defaultLevel?.labelName});
    }
  }

  applyFilters() {
    if (this.config?.type === 'multiSelect') {
      this.selectionChange.emit({value :this.selectedValue,type : this.config?.defaultLevel?.labelName});
    }
  }
}
