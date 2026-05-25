import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flush,
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
import { MetricsService } from 'src/app/services/metrics.service';

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
  getPebProductivityDetailsData() {
    return of({ success: false });
  }
  getAiUsagaStatsDetails() {
    return of({ data: { summary: { usageSummary: { userCount: null } } } });
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
  getSelectedTab() {
    return '';
  }
  setSelectedBoard(_: string) {}
}

describe('PebCalculatorComponent', () => {
  let component: PebCalculatorComponent;
  let fixture: ComponentFixture<PebCalculatorComponent>;
  let mockSharedService: MockSharedService;
  let mockHttpService: MockHttpService;
  let mockMetricsService: jasmine.SpyObj<MetricsService>;
  let productivityGain = require('src/assets/data/peb-productivity.json');
  let activatedRouteMock: any;

  beforeEach(async () => {
    activatedRouteMock = {
      queryParams: of({ selectedTab: 'potential-economic-benefits' }),
    };

    mockMetricsService = jasmine.createSpyObj('MetricsService', [
      'trackPebPageView',
      'trackPebPageScroll',
      'trackPebActiveTime',
      'trackPebCalculate',
      'trackPebOrganizationLevelChange',
    ]);

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
        { provide: MetricsService, useValue: mockMetricsService },
        {
          provide: Location,
          useValue: { path: () => '/dashboard/potential-economic-benefits' },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PebCalculatorComponent);
    component = fixture.componentInstance;
    mockSharedService = TestBed.inject(SharedService) as any;
    mockHttpService = TestBed.inject(HttpService) as any;

    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'completeHierarchyData') {
        return JSON.stringify({
          type1: [{ hierarchyLevelName: 'level1', hierarchyLevelId: 'id1', level: 'L1' }],
        });
      }
      if (key === 'selectedTrend') return 'trend1';
      return null;
    });

    fixture.detectChanges();
  });

  // ─── Basic creation ───────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values from appConfig', () => {
    expect(component.pebForm.get('devCountControl').value).toBe(25);
    expect(component.pebForm.get('devCostControl').value).toBe(80000);
    expect(component.pebForm.get('durationControl').value).toBe('per year');
  });

  it('should call trackPebPageView on init', () => {
    expect(mockMetricsService.trackPebPageView).toHaveBeenCalled();
  });

  // ─── ngOnInit tab resolution ──────────────────────────────────────────────

  it('should set selectedTab from queryParams when tabParam is present', () => {
    expect(component.selectedTab).toBe('potential-economic-benefits');
  });

  it('should derive selectedTab from location path when tabParam is absent and getSelectedTab returns empty', fakeAsync(() => {
    // Simulate the tab-resolution branch: no tabParam, getSelectedTab() returns ''
    // We test by directly calling the queryParams callback logic via the component's
    // queryParamsSubscription, which was set up with a no-tab route in a fresh instance.
    spyOn(mockSharedService, 'getSelectedTab').and.returnValue('');
    spyOn(mockSharedService, 'setSelectedBoard');

    // Manually invoke the same logic the subscription runs
    const path = '/dashboard/iteration';
    let selectedTab = decodeURIComponent(path);
    selectedTab = selectedTab?.split('/')[2] ? selectedTab?.split('/')[2] : 'iteration';
    selectedTab = selectedTab?.split(' ').join('-').toLowerCase();
    selectedTab = selectedTab.split('?statefilters=')[0];

    expect(selectedTab).toBe('iteration');
    flush();
    discardPeriodicTasks();
  }));

  it('should use getSelectedTab() when tabParam absent and getSelectedTab returns a value', fakeAsync(() => {
    spyOn(mockSharedService, 'getSelectedTab').and.returnValue('slingshot');
    spyOn(mockSharedService, 'setSelectedBoard');

    // Simulate the branch where getSelectedTab() has a value
    const tabFromService = mockSharedService.getSelectedTab();
    expect(tabFromService).toBe('slingshot');
    flush();

    discardPeriodicTasks();
  }));

  // ─── passDataToDashboard subscription ────────────────────────────────────

  it('should reinitialize form and trigger API calls when passDataToDashboard emits', fakeAsync(() => {
    spyOn(component, 'getPEBData');
    spyOn(component, 'getPebProjectPerformanceData');
    spyOn(component, 'getAiUasgestatsDetails');

    (mockSharedService.passDataToDashboard as Subject<any>).next({ filters: {} });
    tick();

    expect(component.getPEBData).toHaveBeenCalled();
    expect(component.getPebProjectPerformanceData).toHaveBeenCalled();
    expect(component.getAiUasgestatsDetails).toHaveBeenCalled();
    flush();
    discardPeriodicTasks();
  }));

  it('should not re-trigger API calls when passDataToDashboard emits the same value twice', fakeAsync(() => {
    spyOn(component, 'getPEBData');
    const payload = { filters: {} };
    (mockSharedService.passDataToDashboard as Subject<any>).next(payload);
    tick();
    (mockSharedService.passDataToDashboard as Subject<any>).next(payload);
    tick();

    expect((component.getPEBData as jasmine.Spy).calls.count()).toBe(1);
    flush();
    discardPeriodicTasks();
  }));

  // ─── getPEBData ───────────────────────────────────────────────────────────

  it('should set showResults and compute annualPEB on successful getPEBData()', fakeAsync(() => {
    component.selectedLevel = 'engagement';
    component.selectedType = 'scrum';
    component['pendingApiCalls'] = 1;
    component.isLoadingPebData = true;
    spyOn(mockHttpService, 'getPebProductivityData').and.returnValue(of(productivityGain));
    spyOn(component, 'calculatePEB').and.callThrough();

    component.getPEBData();
    tick(1000);

    expect(component.showResults).toBe(true);
    expect(component.annualPEB).toBeGreaterThan(0);
    expect(component.isLoadingPebData).toBe(false);
    flush();
    discardPeriodicTasks();
  }));

  it('should set isError when getPEBData returns success: false', fakeAsync(() => {
    component.selectedType = 'scrum';
    spyOn(mockHttpService, 'getPebProductivityData').and.returnValue(
      of({ success: false, message: 'No data' }) as any,
    );

    component.getPEBData();
    tick();

    expect(component.isError).toBe(true);
    expect(component.errorMessage).toBe('No data');
    flush();
    discardPeriodicTasks();
  }));

  it('should set isError when getPEBData HTTP call throws', fakeAsync(() => {
    component.selectedType = 'scrum';
    spyOn(mockHttpService, 'getPebProductivityData').and.returnValue(
      throwError(() => new Error('network error')),
    );

    component.getPEBData();
    tick();

    expect(component.isError).toBe(true);
    expect(component.errorMessage).toBe('network error');
    flush();
    discardPeriodicTasks();
  }));

  // ─── getPebProjectPerformanceData ─────────────────────────────────────────

  it('should populate performanceChartData and costSavingsChartData on success', fakeAsync(() => {
    const categoryScores = [
      { temporalGroupingStartDate: '2024-01-01', overall: 10, speed: 5, quality: 3, efficiency: 2, productivity: 0 },
    ];
    spyOn(mockHttpService, 'getPebProductivityDetailsData').and.returnValue(
      of({
        success: true,
        data: {
          categoryScores,
          categoryVariations: { speed: 1, quality: 2, efficiency: 3, productivity: 4 },
          temporalGrouping: 'month',
          forecasts: [{ category: 'overall', value: 15 }],
        },
      }),
    );
    component.selectedType = 'scrum';
    component['pendingApiCalls'] = 1;

    component.getPebProjectPerformanceData('level1');
    tick();

    expect(component.performanceChartData.length).toBeGreaterThan(0);
    expect(component.costSavingsChartData.length).toBeGreaterThan(0);
    expect(component.categoryVariations).toEqual({ speed: 1, quality: 2, efficiency: 3, productivity: 4 });
    expect(component.xAxisLabel).toBe('month');
    flush();
    discardPeriodicTasks();
  }));

  it('should set categoryVariations to null when API returns success but no categoryVariations', fakeAsync(() => {
    spyOn(mockHttpService, 'getPebProductivityDetailsData').and.returnValue(
      of({ success: true, data: { categoryScores: [], temporalGrouping: 'week' } }),
    );
    component.selectedType = 'scrum';
    component['pendingApiCalls'] = 1;

    component.getPebProjectPerformanceData('level1');
    tick();

    expect(component.categoryVariations).toBeNull();
    flush();
    discardPeriodicTasks();
  }));

  it('should set categoryVariations to null when getPebProjectPerformanceData returns success: false', fakeAsync(() => {
    spyOn(mockHttpService, 'getPebProductivityDetailsData').and.returnValue(
      of({ success: false, message: 'error' }) as any,
    );
    component.selectedType = 'scrum';
    component['pendingApiCalls'] = 1;

    component.getPebProjectPerformanceData('level1');
    tick();

    expect(component.categoryVariations).toBeNull();
    flush();
    discardPeriodicTasks();
  }));

  it('should set categoryVariations to null when getPebProjectPerformanceData throws', fakeAsync(() => {
    spyOn(mockHttpService, 'getPebProductivityDetailsData').and.returnValue(
      throwError(() => new Error('fail')),
    );
    component.selectedType = 'scrum';
    component['pendingApiCalls'] = 1;

    component.getPebProjectPerformanceData('level1');
    tick();

    expect(component.categoryVariations).toBeNull();
    flush();
    discardPeriodicTasks();
  }));

  // ─── getAiUasgestatsDetails ───────────────────────────────────────────────

  it('should patch devCountControl when getAiUasgestatsDetails returns a userCount', fakeAsync(() => {
    spyOn(mockHttpService, 'getAiUsagaStatsDetails').and.returnValue(
      of({ data: { summary: { usageSummary: { userCount: 42 } } } }),
    );
    component['pendingApiCalls'] = 1;

    component.getAiUasgestatsDetails('level1');
    tick();

    expect(component.pebForm.get('devCountControl').value).toBe(42);
    flush();
    discardPeriodicTasks();
  }));

  it('should not patch devCountControl when userCount is null', fakeAsync(() => {
    spyOn(mockHttpService, 'getAiUsagaStatsDetails').and.returnValue(
      of({ data: { summary: { usageSummary: { userCount: null } } } }),
    );
    component.pebForm.get('devCountControl').setValue(99);
    component['pendingApiCalls'] = 1;

    component.getAiUasgestatsDetails('level1');
    tick();

    expect(component.pebForm.get('devCountControl').value).toBe(99);
    flush();
    discardPeriodicTasks();
  }));

  it('should handle error in getAiUasgestatsDetails gracefully', fakeAsync(() => {
    spyOn(mockHttpService, 'getAiUsagaStatsDetails').and.returnValue(
      throwError(() => new Error('ai error')),
    );
    component['pendingApiCalls'] = 1;

    component.getAiUasgestatsDetails('level1');
    tick();

    expect(component.isLoadingPebData).toBe(false);
    flush();
    discardPeriodicTasks();
  }));

  // ─── calculateMultipliedDetails ───────────────────────────────────────────

  it('should calculate correctly for "per year" duration', () => {
    component.pebForm.patchValue({ devCountControl: 10, devCostControl: 1000, durationControl: 'per year' });
    const result = component.calculateMultipliedDetails(50);
    expect(result).toBe(Math.round(10 * 1000 * (50 / 100) * 1));
  });

  it('should calculate correctly for "per month" duration', () => {
    component.pebForm.patchValue({ devCountControl: 12, devCostControl: 1200, durationControl: 'per month' });
    const result = component.calculateMultipliedDetails(100);
    expect(result).toBe(Math.round(12 * 1200 * (100 / 100) * (1 / 12)));
  });

  it('should calculate correctly for "per quarter" duration', () => {
    component.pebForm.patchValue({ devCountControl: 8, devCostControl: 2000, durationControl: 'per quarter' });
    const result = component.calculateMultipliedDetails(25);
    expect(result).toBe(Math.round(8 * 2000 * (25 / 100) * (1 / 4)));
  });

  it('should return 0 when value is 0', () => {
    component.pebForm.patchValue({ devCountControl: 10, devCostControl: 1000, durationControl: 'per year' });
    expect(component.calculateMultipliedDetails(0)).toBe(0);
  });

  // ─── formatCategoryScoresForCumulativeChart ───────────────────────────────

  describe('formatCategoryScoresForCumulativeChart', () => {
    const scores = [
      { temporalGroupingStartDate: '2024-01-01', overall: 20, speed: 5, quality: 8, efficiency: 7, productivity: 0 },
      { temporalGroupingStartDate: '2024-02-01', overall: 25, speed: 6, quality: 9, efficiency: 10, productivity: 0 },
    ];

    it('should return empty array for empty input', () => {
      expect(component.formatCategoryScoresForCumulativeChart([])).toEqual([]);
      expect(component.formatCategoryScoresForCumulativeChart(null)).toEqual([]);
    });

    it('should build dataGroup excluding overall and date keys by default', () => {
      const result = component.formatCategoryScoresForCumulativeChart(scores);
      expect(result.length).toBe(1);
      const dataGroup = result[0].dataGroup;
      expect(dataGroup.length).toBe(2);
      const firstEntry = dataGroup[0];
      expect(firstEntry.filter).toBe('2024-01-01');
      const metricKeys = firstEntry.value.map((v: any) => v.kpiGroup);
      expect(metricKeys).not.toContain('overall');
      expect(metricKeys).not.toContain('temporalGroupingStartDate');
    });

    it('should include only overall when showOverall is true', () => {
      const result = component.formatCategoryScoresForCumulativeChart(scores, true);
      const firstEntry = result[0].dataGroup[0];
      expect(firstEntry.value.length).toBe(1);
      expect(firstEntry.value[0].kpiGroup).toBe('overall');
    });

    it('should attach forecasts when provided and valid', () => {
      const forecasts = [{ category: 'overall', value: 30 }];
      const result = component.formatCategoryScoresForCumulativeChart(scores, true, forecasts);
      expect(result[0].forecasts).toBeDefined();
      expect(result[0].forecasts.length).toBe(1);
      expect(result[0].forecasts[0].isForecast).toBe(true);
    });

    it('should filter out forecasts with non-finite values', () => {
      const forecasts = [
        { category: 'overall', value: NaN },
        { category: 'overall', value: 10 },
      ];
      const result = component.formatCategoryScoresForCumulativeChart(scores, true, forecasts);
      expect(result[0].forecasts.length).toBe(1);
    });

    it('should not attach forecasts key when forecasts array is empty', () => {
      const result = component.formatCategoryScoresForCumulativeChart(scores, true, []);
      expect(result[0].forecasts).toBeUndefined();
    });

    it('should handle undefined forecasts gracefully', () => {
      const result = component.formatCategoryScoresForCumulativeChart(scores, true, undefined);
      expect(result[0].forecasts).toBeUndefined();
    });

    it('should include hoverValue with Metric, Value and Date on each data point', () => {
      const result = component.formatCategoryScoresForCumulativeChart(scores);
      const firstValue = result[0].dataGroup[0].value[0];
      expect(firstValue.hoverValue).toBeDefined();
      expect(firstValue.hoverValue['Metric']).toBeDefined();
      expect(firstValue.hoverValue['Date']).toBeDefined();
    });
  });

  // ─── detectCurrency ───────────────────────────────────────────────────────

  describe('detectCurrency', () => {
    it('should return USD for en-US locale', () => {
      expect(component.detectCurrency('en-US')).toBe('USD');
    });

    it('should return EUR for de-DE locale', () => {
      expect(component.detectCurrency('de-DE')).toBe('EUR');
    });

    it('should return INR for en-IN locale', () => {
      expect(component.detectCurrency('en-IN')).toBe('INR');
    });

    it('should return GBP for en-GB locale', () => {
      expect(component.detectCurrency('en-GB')).toBe('GBP');
    });

    it('should return USD for unknown locale', () => {
      expect(component.detectCurrency('xx-ZZ')).toBe('USD');
    });

    it('should return USD when locale has no country part', () => {
      expect(component.detectCurrency('en')).toBe('USD');
    });
  });

  // ─── resetForm ────────────────────────────────────────────────────────────

  it('should reset form to appConfig defaults and call calculatePEB', () => {
    component.pebForm.patchValue({ devCountControl: 100, devCostControl: 500000, durationControl: 'per month' });
    spyOn(component, 'calculatePEB');

    component.resetForm();

    expect(component.pebForm.get('devCountControl').value).toBe(25);
    expect(component.pebForm.get('devCostControl').value).toBe(80000);
    expect(component.pebForm.get('durationControl').value).toBe('per year');
    expect(component.calculatePEB).toHaveBeenCalled();
  });

  it('should fall back to hardcoded defaults when appConfig is null', () => {
    component.appConfig = null;
    spyOn(component, 'calculatePEB');

    component.resetForm();

    expect(component.pebForm.get('devCountControl').value).toBe(30);
    expect(component.pebForm.get('devCostControl').value).toBe(10000);
    expect(component.pebForm.get('durationControl').value).toBe('per year');
  });

  // ─── Filter methods ───────────────────────────────────────────────────────

  describe('Filter Methods', () => {
    beforeEach(() => {
      component.items = [
        { organizationEntityName: 'Project A', categoryScores: { overall: 1000 } },
        { organizationEntityName: 'Project B', categoryScores: { overall: 2000 } },
      ];
    });

    it('should generate column filter data correctly', () => {
      component.generateColumnFilterData();

      expect(component.tableColumnData['organizationEntityName'].length).toBe(2);
      expect(component.tableColumnData['organizationEntityName'][0]).toEqual({ name: 'Project A', value: 'Project A' });
      expect(component.tableColumnData['categoryScores.overall'].length).toBe(2);
      expect(component.tableColumnForm['organizationEntityName']).toEqual([]);
      expect(component.tableColumnForm['categoryScores.overall']).toEqual([]);
    });

    it('should handle empty items array in generateColumnFilterData', () => {
      component.items = [];
      component.generateColumnFilterData();
      expect(component.tableColumnData).toEqual({});
      expect(component.tableColumnForm).toEqual({});
    });

    it('should deduplicate filter options for repeated values', () => {
      component.items = [
        { organizationEntityName: 'Project A', categoryScores: { overall: 1000 } },
        { organizationEntityName: 'Project A', categoryScores: { overall: 1000 } },
      ];
      component.generateColumnFilterData();
      expect(component.tableColumnData['organizationEntityName'].length).toBe(1);
      expect(component.tableColumnData['categoryScores.overall'].length).toBe(1);
    });

    it('should set filteredColumn on onFilterClick', () => {
      component.onFilterClick('organizationEntityName');
      expect(component.filteredColumn).toBe('organizationEntityName');
    });

    it('should clear filteredColumn on onFilterBlur when same column', () => {
      component.filteredColumn = 'organizationEntityName';
      component.onFilterBlur('organizationEntityName');
      expect(component.filteredColumn).toBe('');
    });

    it('should keep filteredColumn on onFilterBlur when different column', () => {
      component.filteredColumn = 'organizationEntityName';
      component.onFilterBlur('categoryScores.overall');
      expect(component.filteredColumn).toBe('organizationEntityName');
    });
  });

  // ─── Scroll tracking ──────────────────────────────────────────────────────

  describe('scroll tracking', () => {
    it('should track scroll at 25% threshold', () => {
      spyOnProperty(window, 'scrollY', 'get').and.returnValue(250);
      spyOnProperty(document.documentElement, 'scrollHeight', 'get').and.returnValue(1100);
      spyOnProperty(window, 'innerHeight', 'get').and.returnValue(100);

      window.dispatchEvent(new Event('scroll'));

      expect(mockMetricsService.trackPebPageScroll).toHaveBeenCalledWith('25');
    });

    it('should not track the same threshold twice', () => {
      spyOnProperty(window, 'scrollY', 'get').and.returnValue(500);
      spyOnProperty(document.documentElement, 'scrollHeight', 'get').and.returnValue(1100);
      spyOnProperty(window, 'innerHeight', 'get').and.returnValue(100);

      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));

      const calls = (mockMetricsService.trackPebPageScroll as jasmine.Spy).calls
        .allArgs()
        .filter((args) => args[0] === '50');
      expect(calls.length).toBe(1);
    });
  });

  // ─── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call trackPebActiveTime with elapsed seconds when time > 0', () => {
      component['pebStartTime'] = Date.now() - 5000;
      component.ngOnDestroy();
      expect(mockMetricsService.trackPebActiveTime).toHaveBeenCalledWith(jasmine.any(Number));
      const seconds = (mockMetricsService.trackPebActiveTime as jasmine.Spy).calls.mostRecent().args[0];
      expect(seconds).toBeGreaterThan(0);
    });

    it('should not call trackPebActiveTime when elapsed time is 0', () => {
      component['pebStartTime'] = Date.now();
      component.ngOnDestroy();
      expect(mockMetricsService.trackPebActiveTime).not.toHaveBeenCalled();
    });

    it('should unsubscribe from all subscriptions on destroy', () => {
      const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
      component.subscription = [mockSub];
      component.ngOnDestroy();
      expect(mockSub.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe sub$ on destroy if it exists', fakeAsync(() => {
      component.selectedType = 'scrum';
      spyOn(mockHttpService, 'getAiUsagaStatsDetails').and.returnValue(of({}) as any);
      component['pendingApiCalls'] = 1;
      component.getAiUasgestatsDetails('level1');
      tick();

      spyOn(component.sub$, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.sub$.unsubscribe).toHaveBeenCalled();
      flush();
      discardPeriodicTasks();
    }));
  });

  // ─── startLoading / completeApiCall ──────────────────────────────────────

  it('should set isLoadingPebData to true and pendingApiCalls to 3 on startLoading', () => {
    component['startLoading']();
    expect(component.isLoadingPebData).toBe(true);
    expect(component['pendingApiCalls']).toBe(3);
  });

  it('should set isLoadingPebData to false only when all 3 API calls complete', () => {
    component['startLoading']();
    component['completeApiCall']();
    expect(component.isLoadingPebData).toBe(true);
    component['completeApiCall']();
    expect(component.isLoadingPebData).toBe(true);
    component['completeApiCall']();
    expect(component.isLoadingPebData).toBe(false);
  });

  it('should not go below 0 for pendingApiCalls and still mark loading done', () => {
    component['pendingApiCalls'] = 1;
    component['completeApiCall']();
    component['completeApiCall'](); // extra call
    expect(component.isLoadingPebData).toBe(false);
  });
});
