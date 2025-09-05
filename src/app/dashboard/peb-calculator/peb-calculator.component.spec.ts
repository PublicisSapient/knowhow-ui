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
