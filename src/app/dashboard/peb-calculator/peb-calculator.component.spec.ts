import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PebCalculatorComponent } from './peb-calculator.component';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { HttpService } from 'src/app/services/http.service';
import { SharedService } from 'src/app/services/shared.service';
import { of, throwError, Subject } from 'rxjs';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ActivatedRoute } from '@angular/router';
import { DynamicCurrencyPipe } from 'src/app/shared-module/pipes/dynamic-currency/dynamic-currency.pipe';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DatePipe, Location } from '@angular/common';

class MockHttpService {
  getPebProductivityData() {
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
  passDataToDashboard = new Subject<any>();

  getDataForSprintGoal() {
    return { selectedLevel: { nodeName: 'level1' } };
  }
  getSelectedType() {
    return 'type1';
  }
  getBackupOfFilterSelectionState() {
    return { parent_level: 'level1' };
  }

  getConfigurationDetails() {
    return {
      totalTeamSize: 25,
      avgCostPerTeamMember: 80000,
      timeDuration: 'per year',
    };
  }
}

describe('PebCalculatorComponent', () => {
  let component: PebCalculatorComponent;
  let fixture: ComponentFixture<PebCalculatorComponent>;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let productivityGain = require('src/assets/data/peb-productivity.json');
  let activatedRouteMock: any;
  beforeEach(async () => {
    activatedRouteMock = {
      queryParams: of({
        selectedTab: 'potential-economic-benefits',
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [PebCalculatorComponent, DynamicCurrencyPipe],
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
      ],
      providers: [
        FormBuilder,
        DatePipe,
        { provide: HttpService, useClass: MockHttpService },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: SharedService, useClass: MockSharedService },
        {
          provide: Location,
          useValue: { path: () => '/dashboard/potential-economic-benefits' },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
    expect(component.pebForm.get('devCountControl').value).toBeTruthy();
    expect(component.pebForm.get('devCostControl').value).toBeTruthy();
    expect(component.pebForm.get('durationControl').value).toBeTruthy();
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

  it('should set showLoader, compute ROI and annualPEB on getPEBData()', fakeAsync(() => {
    component.pebForm.get('devCountControl').setValue(20);
    component.pebForm.get('devCostControl').setValue(50000);
    component.pebForm.get('durationControl').setValue('year');
    component.selectedLevel = 'engagement';
    component.showResults = false;
    component['pendingApiCalls'] = 1;
    component.isLoadingPebData = true;
    const http = TestBed.inject(HttpService) as any;
    spyOn(http, 'getPebProductivityData').and.returnValue(of(productivityGain));
    spyOn(component, 'calculatePEB').and.callThrough();
    component.getPEBData();
    tick(1000);
    expect(component.isLoadingPebData).toBe(false);
    expect(component.showResults).toBe(true);
    expect(component.annualPEB).toBeGreaterThan(0);
  }));

  it('should handle and display error when HTTP service fails', fakeAsync(() => {
    const http = TestBed.inject(HttpService) as any;
    spyOn(http, 'getPebProductivityData').and.returnValue(
      throwError(() => new Error('error')),
    );
    component.getPEBData();
    tick();

    expect(component.showLoader).toBe(false);
    expect(component.isError).toBe(true);
  }));
});
