// karma::peb-calculator.component.spec.ts::src/app/dashboard/peb-calculator/peb-calculator.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PebCalculatorComponent } from './peb-calculator.component';
import { FormBuilder } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { HttpService } from 'src/app/services/http.service';
import { SharedService } from 'src/app/services/shared.service';
import { of, throwError } from 'rxjs';

describe('PebCalculatorComponent', () => {
  let component: PebCalculatorComponent;
  let fixture: ComponentFixture<PebCalculatorComponent>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    mockHttpService = jasmine.createSpyObj('HttpService', [
      'getProductivityGain',
    ]);
    mockSharedService = jasmine.createSpyObj('SharedService', [
      'getDataForSprintGoal',
      'getSelectedType',
    ]);
    mockMessageService = jasmine.createSpyObj('MessageService', [
      'add',
      'clear',
    ]);

    TestBed.configureTestingModule({
      declarations: [PebCalculatorComponent],
      providers: [
        FormBuilder,
        { provide: HttpService, useValue: mockHttpService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PebCalculatorComponent);
    component = fixture.componentInstance;
  });

  it('testNgOnInit', () => {
    component.ngOnInit();
    const devCountControl = component.pebForm.get('devCountControl');
    const devCostControl = component.pebForm.get('devCostControl');

    devCountControl!.setValue(40);
    expect(devCountControl!.value).toBe(40);

    devCostControl!.setValue(120000);
    expect(devCostControl!.value).toBe(120000);
  });

  it('testCalculatePEBWithValidData', (done) => {
    const mockResponse = {
      success: true,
      data: {
        categorizedProductivityGain: {
          overall: 10,
          speed: 5,
          efficiency: 3,
          quality: 2,
          productivity: 1,
        },
      },
    };

    mockHttpService.getProductivityGain.and.returnValue(of(mockResponse));
    mockSharedService.getDataForSprintGoal.and.returnValue({
      selectedLevel: { nodeName: 'Level1' },
    });
    mockSharedService.getSelectedType.and.returnValue('someType');

    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify({
        someType: [
          { hierarchyLevelName: 'Level1', hierarchyLevelId: '1', level: '2' },
        ],
      }),
    );

    component.calculatePEB();

    fixture.whenStable().then(() => {
      expect(component.annualPEB).toBeGreaterThan(0);
      done();
    });
    expect(component.roiMetrics[0].value).toBeGreaterThan(0);
    expect(mockMessageService.clear).toHaveBeenCalled();
  });

  it('testCalculatePEBWithError', () => {
    mockHttpService.getProductivityGain.and.returnValue(throwError('Error'));
    mockSharedService.getDataForSprintGoal.and.returnValue({
      selectedLevel: { nodeName: 'Level1' },
    });
    mockSharedService.getSelectedType.and.returnValue('someType');

    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify({
        someType: [
          { hierarchyLevelName: 'Level1', hierarchyLevelId: '1', level: '2' },
        ],
      }),
    );

    component.calculatePEB();

    expect(mockMessageService.add).toHaveBeenCalledTimes(1);
  });

  it('testCalculatePEBWithEmptyData', () => {
    mockHttpService.getProductivityGain.and.returnValue(
      of({ success: true, data: {} }),
    );
    component.calculatePEB();
    expect(component.annualPEB).toBe(0);
  });

  it('testCalculatePEBWithDifferentDurations', () => {
    const mockResponse = {
      success: true,
      data: {
        categorizedProductivityGain: {
          overall: 10,
          speed: 5,
          efficiency: 3,
          quality: 2,
          productivity: 1,
        },
      },
    };

    mockHttpService.getProductivityGain.and.returnValue(of(mockResponse));
    mockSharedService.getDataForSprintGoal.and.returnValue({
      selectedLevel: { nodeName: 'Level1' },
    });
    mockSharedService.getSelectedType.and.returnValue('someType');

    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify({
        someType: [
          { hierarchyLevelName: 'Level1', hierarchyLevelId: '1', level: '2' },
        ],
      }),
    );

    // Test monthly duration
    component.pebForm.get('durationControl')!.setValue('month');
    component.calculatePEB();
    const monthlyPEB = component.annualPEB;

    // Test quarterly duration
    component.pebForm.get('durationControl')!.setValue('quarter');
    component.calculatePEB();
    const quarterlyPEB = component.annualPEB;

    // Test yearly duration
    component.pebForm.get('durationControl')!.setValue('year');
    component.calculatePEB();
    const yearlyPEB = component.annualPEB;

    // Verify ratios between different durations
    expect(Math.round(yearlyPEB / 12)).toEqual(monthlyPEB);
    expect(Math.round(yearlyPEB / 4)).toEqual(quarterlyPEB);
  });

  afterEach(() => {
    localStorage.removeItem('completeHierarchyData');
  });
});
