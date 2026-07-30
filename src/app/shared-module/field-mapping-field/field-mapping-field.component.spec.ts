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
    it('should return comma-separated string for kpi311 with array value', () => {
      component.kpiId = 'kpi311';
      component.value = ['option1', 'option2', 'option3'];
      expect(component.displayValue).toBe('option1, option2, option3');
    });

    it('should return empty string for kpi311 with empty array', () => {
      component.kpiId = 'kpi311';
      component.value = [];
      expect(component.displayValue).toBe('');
    });

    it('should return string value for non-kpi311 with string value', () => {
      component.kpiId = 'kpi100';
      component.value = 'test value';
      expect(component.displayValue).toBe('test value');
    });

    it('should return empty string for non-kpi311 with non-string value', () => {
      component.kpiId = 'kpi100';
      component.value = 123;
      expect(component.displayValue).toBe('');
    });

    it('should return string value for kpi311 with non-array value', () => {
      component.kpiId = 'kpi311';
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

  describe('kpi311 weight value functionality', () => {
    beforeEach(() => {
      component.kpiId = 'kpi311';
    });

    describe('setValue() with weight for kpi311', () => {
      it('should combine text and weight value in [weight]: text format', () => {
        component.value = 'This is a test prompt';
        component.weightValue = 5;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[5]: This is a test prompt');
      });

      it('should use "null" when weightValue is undefined', () => {
        component.value = 'This is a test prompt';
        component.weightValue = undefined;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[null]: This is a test prompt');
      });

      it('should use "null" when weightValue is null', () => {
        component.value = 'This is a test prompt';
        component.weightValue = null;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[null]: This is a test prompt');
      });

      it('should handle weight value of 0', () => {
        component.value = 'Acceptance Criteria';
        component.weightValue = 0;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[0]: Acceptance Criteria');
      });

      it('should trim whitespace from text value', () => {
        component.value = '  Some text with spaces  ';
        component.weightValue = 12;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[12]: Some text with spaces');
      });

      it('should handle negative weight values', () => {
        component.value = 'Test prompt';
        component.weightValue = -5;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[-5]: Test prompt');
      });

      it('should handle decimal weight values', () => {
        component.value = 'Risk details';
        component.weightValue = 3.5;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[3.5]: Risk details');
      });
    });

    describe('setWeightValue() for kpi311', () => {
      it('should call setValue when weight changes and value exists', () => {
        component.value = 'Test prompt';
        component.weightValue = 10;
        const spyObj = spyOn(component, 'setValue');

        component.setWeightValue();

        expect(spyObj).toHaveBeenCalled();
      });

      it('should not call setValue when value is empty', () => {
        component.value = '';
        component.weightValue = 10;
        const spyObj = spyOn(component, 'setValue');

        component.setWeightValue();

        expect(spyObj).not.toHaveBeenCalled();
      });

      it('should not call setValue when value is null', () => {
        component.value = null;
        component.weightValue = 10;
        const spyObj = spyOn(component, 'setValue');

        component.setWeightValue();

        expect(spyObj).not.toHaveBeenCalled();
      });

      it('should not call setValue when value is undefined', () => {
        component.value = undefined;
        component.weightValue = 10;
        const spyObj = spyOn(component, 'setValue');

        component.setWeightValue();

        expect(spyObj).not.toHaveBeenCalled();
      });
    });

    describe('writeValue() with [weight]: text format for kpi311', () => {
      it('should extract weight and text from [weight]: text format', () => {
        component.writeValue('[5]: This is a test prompt');

        expect(component.value).toBe('This is a test prompt');
        expect(component.weightValue).toBe(5);
      });

      it('should extract weight as undefined when [null] is provided', () => {
        component.writeValue('[null]: This is a test prompt');

        expect(component.value).toBe('This is a test prompt');
        expect(component.weightValue).toBeUndefined();
      });

      it('should handle [0]: text format', () => {
        component.writeValue('[0]: Acceptance Criteria');

        expect(component.value).toBe('Acceptance Criteria');
        expect(component.weightValue).toBe(0);
      });

      it('should handle negative weight values', () => {
        component.writeValue('[-5]: Test prompt');

        expect(component.value).toBe('Test prompt');
        expect(component.weightValue).toBe(-5);
      });

      it('should handle decimal weight values', () => {
        component.writeValue('[3.5]: Risk details');

        expect(component.value).toBe('Risk details');
        expect(component.weightValue).toBe(3.5);
      });

      it('should handle text with multiple colons', () => {
        component.writeValue('[10]: This: is: a: test');

        expect(component.value).toBe('This: is: a: test');
        expect(component.weightValue).toBe(10);
      });

      it('should handle text with extra spaces after colon', () => {
        component.writeValue('[12]:    Test with spaces');

        expect(component.value).toBe('Test with spaces');
        expect(component.weightValue).toBe(12);
      });

      it('should handle plain text without weight format', () => {
        component.writeValue('Plain text without weight');

        expect(component.value).toBe('Plain text without weight');
      });

      it('should not parse if format does not match [weight]: pattern', () => {
        component.writeValue('Invalid [5] format');

        expect(component.value).toBe('Invalid [5] format');
      });

      it('should handle empty text after weight', () => {
        component.writeValue('[7]: ');

        expect(component.value).toBe('');
        expect(component.weightValue).toBe(7);
      });
    });

    describe('writeValue() for non-kpi311', () => {
      beforeEach(() => {
        component.kpiId = 'kpi100';
      });

      it('should not parse weight format for non-kpi311', () => {
        component.writeValue('[5]: This is a test prompt');

        expect(component.value).toBe('[5]: This is a test prompt');
        expect(component.weightValue).toBeUndefined();
      });

      it('should set value normally for non-kpi311', () => {
        component.writeValue('Normal text value');

        expect(component.value).toBe('Normal text value');
      });
    });

    describe('setValue() for non-kpi311', () => {
      beforeEach(() => {
        component.kpiId = 'kpi100';
      });

      it('should not add weight format for non-kpi311', () => {
        component.value = 'Test prompt';
        component.weightValue = 5;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('Test prompt');
      });
    });

    describe('setWeightValue() for non-kpi311', () => {
      beforeEach(() => {
        component.kpiId = 'kpi100';
      });

      it('should not call setValue for non-kpi311', () => {
        component.value = 'Test prompt';
        component.weightValue = 10;
        const spyObj = spyOn(component, 'setValue');

        component.setWeightValue();

        expect(spyObj).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      beforeEach(() => {
        component.kpiId = 'kpi311';
      });

      it('should handle very large weight values', () => {
        component.value = 'Test';
        component.weightValue = 999999;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[999999]: Test');
      });

      it('should handle empty string value', () => {
        component.value = '';
        component.weightValue = 5;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[5]: ');
      });

      it('should handle special characters in text', () => {
        component.value = 'Test @#$% special chars!';
        component.weightValue = 3;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[3]: Test @#$% special chars!');
      });

      it('should handle multiline text', () => {
        component.value = 'Line 1\nLine 2\nLine 3';
        component.weightValue = 2;
        const spyObj = spyOn(component, 'onChange');

        component.setValue();

        expect(spyObj).toHaveBeenCalledWith('[2]: Line 1\nLine 2\nLine 3');
      });
    });
  });
});
