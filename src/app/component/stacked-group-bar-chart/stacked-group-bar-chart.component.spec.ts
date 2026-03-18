import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StackedGroupBarChartComponent } from './stacked-group-bar-chart.component';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  forwardRef,
  Input,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';
import { SimpleChange } from '@angular/core';
import * as d3 from 'd3';
import { SharedService } from 'src/app/services/shared.service';
import { HelperService } from 'src/app/services/helper.service';

@Component({
  selector: 'p-multiSelect',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockMultiSelectComponent),
      multi: true,
    },
  ],
})
class MockMultiSelectComponent implements ControlValueAccessor {
  @Input() options: any;
  @Input() optionLabel: any;
  @Input() optionValue: any;
  @Input() showHeader: any;
  @Input() selectedItemsLabel: any;
  @Input() maxSelectedLabels: any;
  @Input() placeholder: any;
  @Input() panelStyle: any;
  @Input() defaultLabel: any;
  @Input() showClear: any;

  writeValue(obj: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  setDisabledState?(isDisabled: boolean): void {}
}

describe('StackedGroupBarChartComponent', () => {
  let component: StackedGroupBarChartComponent;
  let fixture: ComponentFixture<StackedGroupBarChartComponent>;

  beforeEach(async () => {
    // Mock ResizeObserver
    (window as any).ResizeObserver = class ResizeObserver {
      observe = jasmine.createSpy('observe');
      unobserve = jasmine.createSpy('unobserve');
      disconnect = jasmine.createSpy('disconnect');
    };

    // Mock localStorage
    const mockLocalStorage = {
      getItem: (key: string): string => {
        if (key === 'selectedTrend') {
          return JSON.stringify([{ labelName: 'project' }]);
        }
        return null;
      },
      setItem: jasmine.createSpy('setItem'),
      clear: jasmine.createSpy('clear'),
    };
    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);

    await TestBed.configureTestingModule({
      declarations: [StackedGroupBarChartComponent, MockMultiSelectComponent],
      imports: [FormsModule],
      providers: [
        {
          provide: SharedService,
          useValue: {
            getSelectedTab: jasmine
              .createSpy('getSelectedTab')
              .and.returnValue('Iteration'),
            getSelectedTrends: jasmine
              .createSpy('getSelectedTrends')
              .and.returnValue([{ nodeName: 'Project A' }]),
            getSelectedDateFilter: jasmine
              .createSpy('getSelectedDateFilter')
              .and.returnValue('Weeks'),
          },
        },
        {
          provide: HelperService,
          useValue: {
            getFormatedDateBasedOnType: jasmine
              .createSpy('getFormatedDateBasedOnType')
              .and.callFake((date, type) => date),
          },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StackedGroupBarChartComponent);
    component = fixture.componentInstance;

    // Default Inputs
    component.kpiId = 'kpi195';
    component.defectsBreachedSLAs = [];
    component.defectsBreachedSLAsAllValues = [];
    component.selectedtype = 'scrum';
    component.xAxisLabel = 'Sprints';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call createChart on ngOnChanges', () => {
    spyOn(component as any, 'createChart');
    component.ngOnChanges({
      kpiId: new SimpleChange(null, 'kpi195', true),
    });
    expect((component as any).createChart).toHaveBeenCalled();
  });

  it('should call createChart and observe chartContainer on ngAfterViewInit', () => {
    spyOn(component as any, 'createChart');
    const observeSpy = (component as any).elemObserver.observe;
    component.ngAfterViewInit();
    expect((component as any).createChart).toHaveBeenCalled();
    expect(observeSpy).toHaveBeenCalledWith(
      component.chartContainer.nativeElement,
    );
  });

  it('should unobserve and cleanup D3 on ngOnDestroy', () => {
    const unobserveSpy = (component as any).elemObserver.unobserve;
    component.ngOnDestroy();
    expect(unobserveSpy).toHaveBeenCalledWith(
      component.chartContainer.nativeElement,
    );
  });

  it('should create chart for kpi195 with data', () => {
    component.kpiId = 'kpi195';
    component.defectsBreachedSLAs = [
      {
        data: 'Project A',
        value: [
          {
            sprintName: 'Sprint 1',
            drillDown: [
              { severity: 's1', breachedPercentage: 10 },
              { severity: 's2', breachedPercentage: 20 },
            ],
          },
        ],
      },
    ];
    component.defectsBreachedSLAsAllValues = [
      {
        filter: 'S1',
        value: [
          {
            data: 'Project A',
            value: [
              {
                hoverValue: { totalResolvedIssues: 5, breachedPercentage: 10 },
              },
            ],
          },
        ],
      },
    ];

    (component as any).createChart();
    const svg = component.chartContainer.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should create chart for kpi196 with data', () => {
    component.kpiId = 'kpi196';
    component.data = [
      {
        data: 'Project B',
        value: [
          {
            hoverValue: {
              AUTOMATED: { avgExecutionTimeSec: 50, count: 10 },
              MANUAL: { avgExecutionTimeSec: 30, count: 5 },
            },
          },
        ],
      },
    ];

    (component as any).createChart();
    const svg = component.chartContainer.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should handle missing data gracefully in createChart', () => {
    component.kpiId = 'kpi195';
    component.defectsBreachedSLAs = [];
    const consoleSpy = spyOn(console, 'warn');
    (component as any).createChart();
    expect(consoleSpy).toHaveBeenCalledWith(
      'KPI 195: No defectsBreachedSLAs data available, skipping chart creation',
    );
  });

  it('should handle unknown kpiId in createChart', () => {
    component.kpiId = 'unknown';
    const consoleSpy = spyOn(console, 'warn');
    (component as any).createChart();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Unknown kpiId: unknown, skipping chart creation',
    );
  });

  it('should set xCaption from getSelectedDateFilter when selectedtype is kanban', () => {
    spyOn(component as any, 'createChart');
    component.selectedtype = 'kanban';
    component.ngOnChanges({
      selectedtype: new SimpleChange(null, 'kanban', true),
    });
    expect(component.xCaption).toEqual('Weeks');
  });

  it('should set xCaption from getSelectedDateFilter when selectedTab is developer', () => {
    spyOn(component as any, 'createChart');
    const sharedService = TestBed.inject(SharedService);
    (sharedService.getSelectedTab as jasmine.Spy).and.returnValue('developer');
    component.selectedtype = 'scrum';
    component.ngOnChanges({
      selectedtype: new SimpleChange(null, 'scrum', true),
    });
    expect(component.xCaption).toEqual('Weeks');
  });
});
