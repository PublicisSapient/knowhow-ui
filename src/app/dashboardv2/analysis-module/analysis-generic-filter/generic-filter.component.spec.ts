import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { GenericFilterComponent } from './generic-filter.component';
import { SimpleChange } from '@angular/core';

describe('GenericFilterComponent', () => {
  let component: GenericFilterComponent;
  let fixture: ComponentFixture<GenericFilterComponent>;

  const mockData = {
    Project: [
      { nodeId: '1', nodeDisplayName: 'Project 1' },
      { nodeId: '2', nodeDisplayName: 'Project 2' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GenericFilterComponent,
        FormsModule,
        MultiSelectModule,
        DropdownModule,
        ButtonModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GenericFilterComponent);
    component = fixture.componentInstance;
    component.config = { type: 'multiSelect', defaultLevel: { labelName: 'Project' } };
    component.data = mockData;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct options', () => {
    expect(component.options).toEqual(mockData.Project);
  });

  it('should emit selectionChange with correct format for singleSelect', () => {
    spyOn(component.selectionChange, 'emit');
    component.config = { type: 'singleSelect', defaultLevel: { labelName: 'Project' } };
    
    component.onSelectionChange({ value: mockData.Project[0] });
    
    expect(component.selectionChange.emit).toHaveBeenCalledWith({
      value: mockData.Project[0],
      type: 'Project'
    });
  });

  it('should emit selectionChange with correct format for multiSelect on applyFilters', () => {
    spyOn(component.selectionChange, 'emit');
    component.selectedValue = [mockData.Project[0]];
    
    component.applyFilters(null);
    
    expect(component.selectionChange.emit).toHaveBeenCalledWith({
      value: [mockData.Project[0]],
      type: 'Project'
    });
  });

  it('should update selectedValue for multiSelect on ngOnChanges', () => {
    component.selectedFilters = [mockData.Project[0]];
    const changes = {
      selectedFilters: new SimpleChange(null, [mockData.Project[0]], false)
    };
    
    component.ngOnChanges(changes);
    
    expect(component.selectedValue).toEqual([mockData.Project[0]]);
  });

  it('should update selectedValue for singleSelect on ngOnChanges', () => {
    component.config = { type: 'singleSelect', defaultLevel: { labelName: 'Project' } };
    component.selectedFilters = mockData.Project[0];
    const changes = {
      selectedFilters: new SimpleChange(null, mockData.Project[0], false)
    };
    
    component.ngOnChanges(changes);
    
    expect(component.selectedValue).toEqual(mockData.Project[0]);
  });
});