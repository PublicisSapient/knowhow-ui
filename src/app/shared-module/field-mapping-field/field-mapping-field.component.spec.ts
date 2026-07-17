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
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldMappingFieldComponent } from './field-mapping-field.component';
import { Router } from '@angular/router';

describe('FieldMappingFieldComponent', () => {
  let component: FieldMappingFieldComponent;
  let fixture: ComponentFixture<FieldMappingFieldComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      declarations: [FieldMappingFieldComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldMappingFieldComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  xit('should reset radio button', () => {
    component.resetRadioButton('fakeName');
    expect(component.value).toBe(true);
  });

  it('should set addtional filter value button', () => {
    component.setAdditionalFilterValue('fakeName');
    component.showDialogToAddValue(true, 'Name', 'field');
    expect(component.value).toBe('fakeName');
  });

  it('should prevent entering non-numeric keys', () => {
    const event = {
      isTrusted: true,
      key: '.',
      preventDefault: jasmine.createSpy('preventDefault'),
    };
    component.enterNumericValue(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should allow entering numeric keys', () => {
    const event = {
      isTrusted: true,
      key: '1',
      preventDefault: jasmine.createSpy('preventDefault'),
    };

    component.enterNumericValue(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should set value on numeric input box up and down key event', () => {
    const event = {
      isTrusted: true,
    };
    const spy = spyOn(component, 'setValue');
    component.numericInputUpDown(event);
    expect(spy).toHaveBeenCalled();
  });

  it('should write value', () => {
    component.writeValue('test');
    expect(component.value).toEqual('test');
  });

  it('should fire onChange event', () => {
    component.registerOnChange(() => {});
    expect(component.onChange).toBeDefined();
  });

  it('should fire onTouch event', () => {
    component.registerOnTouched(() => {});
    expect(component.onTouched).toBeDefined();
  });

  it('should enable/disable field', () => {
    component.setDisabledState(true);
    expect(component.isDisabled).toBeTruthy();
  });

  it('should set fields values when value is number', () => {
    const spyObj = spyOn(component, 'onChange');
    component.setValue();
    expect(spyObj).toHaveBeenCalled();
  });

  it('should set fields values when value is string', () => {
    component.value = 'TestValue ';
    const spyObj = spyOn(component, 'onChange');
    component.setValue();
    expect(spyObj).toHaveBeenCalled();
  });

  it('should set fields values when value is array', () => {
    component.value = ['test ', 'test2 '];
    const spyObj = spyOn(component, 'onChange');
    component.setValue(false);
    expect(spyObj).toHaveBeenCalled();
  });

  it('should format value for condtional input', () => {
    const spyObj = spyOn(component, 'onChange');
    component.setValueConditionalInput([
      {
        labelValue: 'testValue',
        countValue: 123,
      },
    ]);
    expect(spyObj).toHaveBeenCalled();
  });

  it('should rest radio button', () => {
    const spyObj = spyOn(component, 'setValue');
    component.resetRadioButton('test');
    expect(spyObj).toHaveBeenCalled();
  });

  it('should navigate to the provided URL', () => {
    const testUrl = '/dashboard';

    component.navigate(testUrl);

    expect(mockRouter.navigate).toHaveBeenCalledWith([testUrl]);
  });

  it('should handle drag start', () => {
    const mockEvent = {
      dataTransfer: {
        effectAllowed: '',
        setData: jasmine.createSpy('setData'),
      },
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.onDragStart(mockEvent, 'testItem');
    expect(component.draggedItem).toEqual('testItem');
    expect(mockEvent.dataTransfer.effectAllowed).toEqual('move');
    expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith(
      'text/plain',
      'testItem',
    );
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should handle drag over', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.onDragOver(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should handle drag end', () => {
    const mockEvent = {} as any;
    component.draggedItem = 'testItem';
    component.onDragEnd(mockEvent);
    expect(component.draggedItem).toBeNull();
  });

  it('should handle drop and reorder value', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.value = ['A', 'C', 'B'];
    component.draggedItem = 'B';
    const spy = spyOn(component, 'setValue');
    component.onDrop(mockEvent, 'C');
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.value).toEqual(['A', 'B', 'C']);
    expect(spy).toHaveBeenCalled();
    expect(component.draggedItem).toBeNull();
  });

  it('should not reorder if draggedItem is null', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.value = ['A', 'B', 'C'];
    component.draggedItem = null;
    const spy = spyOn(component, 'setValue');
    component.onDrop(mockEvent, 'B');
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.value).toEqual(['A', 'B', 'C']);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not reorder if value is not an array', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.value = 'string value';
    component.draggedItem = 'A';
    const spy = spyOn(component, 'setValue');
    component.onDrop(mockEvent, 'B');
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not reorder if draggedItem equals targetItem', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.value = ['A', 'B', 'C'];
    component.draggedItem = 'B';
    const spy = spyOn(component, 'setValue');
    component.onDrop(mockEvent, 'B');
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.value).toEqual(['A', 'B', 'C']);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('displayValue getter', () => {
    it('should return comma-separated string for kpi217 with array value', () => {
      component.kpiId = 'kpi217';
      component.value = ['option1', 'option2', 'option3'];
      expect(component.displayValue).toBe('option1, option2, option3');
    });

    it('should return empty string for kpi217 with empty array', () => {
      component.kpiId = 'kpi217';
      component.value = [];
      expect(component.displayValue).toBe('');
    });

    it('should return string value for non-kpi217 with string value', () => {
      component.kpiId = 'kpi100';
      component.value = 'test value';
      expect(component.displayValue).toBe('test value');
    });

    it('should return empty string for non-kpi217 with non-string value', () => {
      component.kpiId = 'kpi100';
      component.value = 123;
      expect(component.displayValue).toBe('');
    });

    it('should return string value for kpi217 with non-array value', () => {
      component.kpiId = 'kpi217';
      component.value = 'string value';
      expect(component.displayValue).toBe('string value');
    });
  });

  it('should format value for condtional input v2', () => {
    const spyObj = spyOn(component, 'onChange');
    component.setValueConditionalInputV2([
      {
        label: 'testLabel',
        structuredValue: { key: 'value' },
      },
    ]);
    expect(spyObj).toHaveBeenCalledWith([
      {
        label: 'testLabel',
        structuredValue: { key: 'value' },
      },
    ]);
  });

  it('should trigger change detection on drop', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
    } as any;
    component.value = ['A', 'B', 'C'];
    component.draggedItem = 'C';
    const cdrSpy = spyOn(component['cdr'], 'detectChanges');
    component.onDrop(mockEvent, 'A');
    expect(cdrSpy).toHaveBeenCalled();
  });
});
