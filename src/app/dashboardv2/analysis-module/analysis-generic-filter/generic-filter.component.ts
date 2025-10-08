import { Component, Input, Output, EventEmitter, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
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
  @Input() selectedFilters : any;
  @Output() selectionChange = new EventEmitter<any>();
  @ViewChild('multiSelect') multiSelect: MultiSelect;

  selectedValue: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.config.type === 'multiSelect' && this.selectedFilters?.length) {
      // match by label or value after data arrives
      this.selectedValue = this.data[this.config.defaultLevel.labelName]?.filter((opt: any) =>
        this.selectedFilters.some((sel: any) => sel.nodeId === opt.nodeId)
      );
    }
  
    if (changes['selectedFilters'] && this.config.type === 'singleSelect') {
      this.selectedValue = this.selectedFilters;
    }
    
  }

  get options() {
    return this.data?.[this.config?.defaultLevel?.labelName] || [];
  }

  onSelectionChange(event: any) {
    if (this.config?.type === 'singleSelect') {
      this.selectionChange.emit({
        value: event.value,
        type: this.config?.defaultLevel?.labelName,
      });
    }
  }

  applyFilters(event) {
    if (this.config?.type === 'multiSelect') {
      this.selectionChange.emit({
        value: this.selectedValue,
        type: this.config?.defaultLevel?.labelName,
      });
    }
    if (this.multiSelect?.overlayVisible) {
      this.multiSelect.close(event);
    }
  }
}
