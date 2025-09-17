// import {
//   ComponentFixture,
//   TestBed,
//   fakeAsync,
//   tick,
// } from '@angular/core/testing';
// import { PebCalculatorComponent } from './peb-calculator.component';
// import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
// import { SharedService } from 'src/app/services/shared.service';
// import { of } from 'rxjs';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { InputTextModule } from 'primeng/inputtext';

// describe('PebCalculatorComponent', () => {
//   let component: PebCalculatorComponent;
//   let fixture: ComponentFixture<PebCalculatorComponent>;
//   let sharedService: jasmine.SpyObj<SharedService>;

//   const mockPebData = {
//     categorizedProductivityGain: {
//       overall: 10,
//       speed: 15,
//       efficiency: 20,
//       quality: 25,
//       productivity: 30,
//     },
//   };

//   const mockHierarchyData = {
//     type1: [
//       {
//         hierarchyLevelName: 'TestLevel',
//         hierarchyLevelId: 'test123',
//         level: 'L1',
//       },
//     ],
//   };

//   beforeEach(async () => {
//     const sharedServiceSpy = jasmine.createSpyObj('SharedService', [
//       'getDataForSprintGoal',
//       'getSelectedType',
//       'getPEBData',
//     ]);

//     sharedServiceSpy.getDataForSprintGoal.and.returnValue({
//       selectedLevel: { nodeName: 'TestLevel' },
//     });
//     sharedServiceSpy.getSelectedType.and.returnValue('type1');
//     sharedServiceSpy.getPEBData.and.returnValue(mockPebData);

//     await TestBed.configureTestingModule({
//       declarations: [PebCalculatorComponent],
//       imports: [
//         ReactiveFormsModule,
//         FormsModule,
//         InputNumberModule,
//         InputTextModule,
//       ],
//       providers: [
//         FormBuilder,
//         { provide: SharedService, useValue: sharedServiceSpy },
//       ],
//     }).compileComponents();

//     spyOn(localStorage, 'getItem').and.returnValue(
//       JSON.stringify(mockHierarchyData),
//     );
//   });

//   beforeEach(() => {
//     fixture = TestBed.createComponent(PebCalculatorComponent);
//     component = fixture.componentInstance;
//     sharedService = TestBed.inject(
//       SharedService,
//     ) as jasmine.SpyObj<SharedService>;
//     fixture.detectChanges();
//   });

//   describe('Component Initialization', () => {
//     it('should create', () => {
//       expect(component).toBeTruthy();
//     });

//     it('should initialize with default values', () => {
//       expect(component.pebForm.get('devCountControl')?.value).toBe(30);
//       expect(component.pebForm.get('devCostControl')?.value).toBe(100000);
//       expect(component.pebForm.get('durationControl')?.value).toBe('year');
//       expect(component.showLoader).toBeFalse();
//       expect(component.showResults).toBeFalse();
//       expect(component.isError).toBeFalse();
//     });

//     it('should initialize ROI metrics with correct structure', () => {
//       expect(component.roiMetrics.length).toBe(4);
//       const speedMetric = component.roiMetrics[0];
//       expect(speedMetric).toEqual({
//         label: 'Speed',
//         percent: 0,
//         value: 0,
//         icon: 'pi pi-bolt',
//         color: '#d4fbdf',
//         elemColor: '#15ba40',
//         estValueSavingsLabel: 'Estd. Value from Faster Delivery',
//       });
//     });
//   });

//   describe('calculatePEB', () => {
//     it('should calculate PEB correctly for yearly duration', fakeAsync(() => {
//       component.pebForm.patchValue({
//         devCountControl: 30,
//         devCostControl: 100000,
//         durationControl: 'year',
//       });

//       component.calculatePEB();
//       tick();

//       expect(component.showLoader).toBeFalse();
//       expect(component.showResults).toBeTrue();
//       expect(component.annualPEB).toBe(300000); // 30 * 100000 * (10/100)
//       expect(component.roiMetrics[0].value).toBeGreaterThan(0);
//     }));

//     it('should calculate PEB correctly for monthly duration', fakeAsync(() => {
//       component.pebForm.patchValue({
//         durationControl: 'month',
//       });

//       component.calculatePEB();
//       tick();

//       expect(component.annualPEB).toBe(25000); // (30 * 100000 * (10/100)) / 12
//     }));

//     it('should handle failed PEB data fetch', fakeAsync(() => {
//       sharedService.getPEBData.and.returnValue(null);

//       component.calculatePEB();
//       tick();

//       expect(component.showLoader).toBeFalse();
//       expect(component.isError).toBeTrue();
//       expect(component.showResults).toBeFalse();
//     }));

//     it('should handle negative productivity gains', fakeAsync(() => {
//       const negativeData = {
//         categorizedProductivityGain: {
//           overall: -10,
//           speed: -15,
//           efficiency: -20,
//           quality: -25,
//           productivity: -30,
//         },
//       };
//       sharedService.getPEBData.and.returnValue(negativeData);

//       component.calculatePEB();
//       tick();

//       expect(component.annualPEB).toBe(0);
//       expect(component.roiMetrics[0].value).toBe(0);
//     }));
//   });

//   describe('Form Control Updates', () => {
//     it('should handle devCountControl value changes', fakeAsync(() => {
//       const control = component.pebForm.get('devCountControl');
//       control?.setValue(50);
//       tick();

//       expect(control?.value).toBe(50);
//     }));

//     it('should handle devCostControl value changes', fakeAsync(() => {
//       const control = component.pebForm.get('devCostControl');
//       control?.setValue(200000);
//       tick();

//       expect(control?.value).toBe(200000);
//     }));
//   });
// });

// NOTE --> Added the below test cases for the recent changes, will remove it once the component demo is done.
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { PebCalculatorComponent } from './peb-calculator.component';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { HttpService } from 'src/app/services/http.service';
import { SharedService } from 'src/app/services/shared.service';
import { of, throwError } from 'rxjs';
import { Message } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

class MockHttpService {
  getProductivityGain() {
    return of({
      success: true,
      data: {
        categorizedProductivityGain: {
          overall: 10,
          speed: 10,
          efficiency: 20,
          quality: 30,
          productivity: 40,
        },
      },
    });
  }
}

class MockSharedService {
  getDataForSprintGoal() {
    return { selectedLevel: { nodeName: 'level1' } };
  }
  getSelectedType() {
    return 'type1';
  }
}

describe('PebCalculatorComponent', () => {
  let component: PebCalculatorComponent;
  let fixture: ComponentFixture<PebCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PebCalculatorComponent],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
      ],
      providers: [
        FormBuilder,
        { provide: HttpService, useClass: MockHttpService },
        { provide: SharedService, useClass: MockSharedService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PebCalculatorComponent);
    component = fixture.componentInstance;

    // Setup localStorage mocks for tests
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'completeHierarchyData') {
        return JSON.stringify({
          type1: [
            {
              hierarchyLevelName: 'level1',
              hierarchyLevelId: 'id1',
              level: 'L1',
            },
          ],
        });
      }
      if (key === 'selectedTrend') {
        return 'trend1';
      }
      return null;
    });
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.pebForm.get('devCountControl').value).toBe(30);
    expect(component.pebForm.get('devCostControl').value).toBe(100000);
    expect(component.pebForm.get('durationControl').value).toBe('year');
  });

  it('should subscribe to valueChanges in ngOnInit without triggering infinite loop', fakeAsync(() => {
    const devCountControl = component.pebForm.get('devCountControl');
    devCountControl.setValue(40);
    tick();
    expect(devCountControl.value).toBe(40);

    const devCostControl = component.pebForm.get('devCostControl');
    devCostControl.setValue(200000);
    tick();
    expect(devCostControl.value).toBe(200000);
  }));

  it('should set showLoader, compute ROI and annualPEB on calculatePEB()', fakeAsync(() => {
    component.pebForm.get('devCountControl').setValue(20);
    component.pebForm.get('devCostControl').setValue(50000);
    component.pebForm.get('durationControl').setValue('year');
    component.calculatePEB();
    tick();

    expect(component.showLoader).toBe(false);
    expect(component.showResults).toBe(true);
    expect(component.annualPEB).toBeGreaterThan(0);

    component.roiMetrics.forEach((metric) => {
      expect(metric.value).toBeGreaterThanOrEqual(0);
    });
  }));

  it('should handle and display error when HTTP service fails', fakeAsync(() => {
    const http = TestBed.inject(HttpService) as any;
    spyOn(http, 'getProductivityGain').and.returnValue(
      throwError(() => new Error('error')),
    );
    component.calculatePEB();
    tick();

    expect(component.showLoader).toBe(false);
    expect(component.isError).toBe(true);
  }));
});
