/*******************************************************************************
 * Copyright 2014 CapitalOne, LLC.
 * Further development Copyright 2022 Sapient Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-field-mapping-field',
  templateUrl: './field-mapping-field.component.html',
  styleUrls: ['./field-mapping-field.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FieldMappingFieldComponent,
      multi: true,
    },
  ],
})
export class FieldMappingFieldComponent implements ControlValueAccessor {
  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  @Input() fieldConfig;
  @Output() onSearch = new EventEmitter();
  @Input() fieldMappingMetaData;
  @Input() thresholdUnit;
  value;
  isDisabled = false;
  draggedItem: any = null;

  @Input() kpiId;

  onChange = (val) => {};
  onTouched = () => {};
  writeValue(val: any): void {
    this.value = val;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * Get display value for kpi217 trigger field.
   * For arrays, convert to comma-separated string for display.
   */
  get displayValue(): string {
    if (this.kpiId === 'kpi217' && Array.isArray(this.value)) {
      return this.value.join(', ');
    }
    return typeof this.value === 'string' ? this.value : '';
  }

  setValue(isAddtional?) {
    if (typeof this.value === 'string' || this.value instanceof String) {
      this.onChange(this.value.trim());
    } else if (Array.isArray(this.value) && isAddtional !== true) {
      this.value = this.value.map((val) => val.trim());
      this.onChange(this.value);
    } else {
      if (this.value == null) {
        this.value = 0;
      }
      this.onChange(this.value);
    }
  }

  setValueConditionalInput(event) {
    this.value = event.map((val) => ({
      labelValue: val.labelValue,
      countValue: val.countValue,
    }));

    this.onChange(this.value);
  }

  setValueConditionalInputV2(event) {
    this.value = event.map((val) => ({
      label: val.label,
      structuredValue: val.structuredValue,
    }));

    this.onChange(this.value);
  }

  resetRadioButton(fieldName) {
    this.value = true;
    this.setValue();
  }

  setAdditionalFilterValue(value) {
    this.value = value;
    this.setValue(true);
  }

  showDialogToAddValue(isSingle, fieldName, type) {
    this.onSearch.emit({ isSingle, fieldName, type });
  }

  enterNumericValue(event) {
    if (
      (!!event && !!event.preventDefault && event.key === '.') ||
      event.key === 'e' ||
      event.key === '-' ||
      event.key === '+'
    ) {
      event.preventDefault();
    }
  }
  numericInputUpDown(event: any) {
    this.setValue();
  }

  navigate(url) {
    this.router.navigate([url]);
  }

  onDragStart(event: DragEvent, item: any) {
    console.log('[Chips DnD] Drag Start:', item);
    this.draggedItem = item;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item);
    }
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnd(event: DragEvent) {
    console.log('[Chips DnD] Drag End');
    this.draggedItem = null;
  }

  onDrop(event: DragEvent, targetItem: any) {
    console.log(
      '[Chips DnD] Drop target:',
      targetItem,
      'Dragged item:',
      this.draggedItem,
    );
    event.preventDefault();
    event.stopPropagation();
    if (
      this.draggedItem &&
      this.draggedItem !== targetItem &&
      Array.isArray(this.value)
    ) {
      const fromIndex = this.value.indexOf(this.draggedItem);
      const toIndex = this.value.indexOf(targetItem);
      console.log(
        '[Chips DnD] Indices - fromIndex:',
        fromIndex,
        'toIndex:',
        toIndex,
      );

      if (fromIndex !== -1 && toIndex !== -1) {
        // Move item in array with a new reference so PrimeNG and Angular trigger change detection
        const newValue = [...this.value];
        newValue.splice(fromIndex, 1);
        newValue.splice(toIndex, 0, this.draggedItem);
        this.value = newValue;
        console.log('[Chips DnD] New Value array:', this.value);
        // Trigger onChange/form value updates
        this.setValue();
        this.cdr.detectChanges();
      }
    }
    this.draggedItem = null;
  }
}
