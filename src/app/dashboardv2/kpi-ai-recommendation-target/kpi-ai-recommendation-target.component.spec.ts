import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpService } from 'src/app/services/http.service';
import { MetricsService } from 'src/app/services/metrics.service';
import { KpiAiRecommendationTargetComponent } from './kpi-ai-recommendation-target.component';

describe('KpiAiRecommendationTargetComponent', () => {
  let component: KpiAiRecommendationTargetComponent;
  let fixture: ComponentFixture<KpiAiRecommendationTargetComponent>;
  let httpService: jasmine.SpyObj<HttpService>;

  const mockKpiRecommData = {
    recommendations: {
      severity: 'High',
      title: 'Test Recommendation',
      description: 'Test Description',
      saving: '10%',
      timeToValue: '2 weeks',
      keyPerformanceIndicator: ['KPI1', 'KPI2'],
      actionPlans: [
        { title: 'Action 1', description: 'Description **bold** text.' },
        { title: 'Action 2', description: 'Another description' },
      ],
    },
    projectName: 'Test Project',
    kpiId: 'kpi123',
  };

  const mockKpiChartData = [
    {
      value: [
        { value: 10, xAxisTick: 'Jan', isForecast: false },
        { value: 15, data: 15, isForecast: false },
        { value: 20, isForecast: true },
      ],
      benchmarkPercentiles: {
        seventyPercentile: 12,
        eightyPercentile: 18,
        nintyPercentile: 25,
      },
    },
  ];

  beforeEach(async () => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['getHomeNBAData']);
    const metricsSpy = jasmine.createSpyObj('MetricsService', ['trackAiKpiRecommendation']);

    await TestBed.configureTestingModule({
      imports: [KpiAiRecommendationTargetComponent, HttpClientTestingModule],
      providers: [
        { provide: HttpService, useValue: httpSpy },
        { provide: MetricsService, useValue: metricsSpy },
      ],
    }).compileComponents();

    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiAiRecommendationTargetComponent);
    component = fixture.componentInstance;
    component.kpiData = { kpiDetail: { kpiName: 'Test KPI' } };
    component.kpiRecommData = mockKpiRecommData;
    component.kpiChartData = mockKpiChartData;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set displayAiRecommModal to true when onViewPlanClick is called', () => {
    component.onViewPlanClick();
    expect(component.displayAiRecommModal).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should initialize aiRecommendationData and call preapareToRenderData', () => {
      spyOn(component, 'preapareToRenderData');
      component.ngOnInit();

      expect(component.aiRecommendationData).toEqual({
        priority: 'High',
        title: 'Test Recommendation',
        description: 'Test Description',
        category: 'Test Project',
        id: 'kpi123',
        potentialSavings: '10%',
        rawData: mockKpiRecommData.recommendations,
      });
      expect(component.preapareToRenderData).toHaveBeenCalledWith(
        component.aiRecommendationData,
      );
    });

    it('should handle missing saving in recommendations', () => {
      const dataWithoutSaving = { ...mockKpiRecommData };
      delete dataWithoutSaving.recommendations.saving;
      component.kpiRecommData = dataWithoutSaving;

      component.ngOnInit();
      expect(component.aiRecommendationData.potentialSavings).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should call preapreBenchMark when changes occur', () => {
      spyOn(component, 'preapreBenchMark');
      const changes: SimpleChanges = {};
      component.ngOnChanges(changes);
      expect(component.preapreBenchMark).toHaveBeenCalled();
    });
  });

  describe('preapareToRenderData', () => {
    it('should prepare selectedRecommendation data correctly', () => {
      const mockItem = {
        rawData: {
          severity: 'Medium',
          timeToValue: '1 week',
          keyPerformanceIndicator: ['KPI1'],
          actionPlans: [{ title: 'Test', description: 'Test desc' }],
        },
        title: 'Test Title',
        category: 'Test Category',
      };

      component.preapareToRenderData(mockItem);

      expect(component.selectedRecommendation).toEqual({
        infoBoxes: [
          { label: 'Implementation', value: 'Medium', color: '#fbcf5f' },
          { label: 'Time to Value', value: '1 week', color: 'purple' },
        ],
        kpis: ['KPI1'],
        kpiSectionTitle: 'Affected Key Performance Indicators',
        actionPlanTitle: 'Recommended Action Plan',
        actionPlan: [{ step: 1, title: 'Test', description: 'Test desc' }],
        title: 'Test Title',
        nodeName: 'Test Category',
      });
    });

    it('should handle missing keyPerformanceIndicator', () => {
      const mockItem = {
        rawData: {
          severity: 'Low',
          timeToValue: '3 weeks',
          actionPlans: [],
        },
        title: 'Test',
        category: 'Test',
      };

      component.preapareToRenderData(mockItem);
      expect(component.selectedRecommendation.kpis).toEqual([]);
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct color for high priority', () => {
      expect(component.getPriorityColor('high')).toBe('#f68605');
      expect(component.getPriorityColor('HIGH')).toBe('#f68605');
    });

    it('should return correct color for medium priority', () => {
      expect(component.getPriorityColor('medium')).toBe('#fbcf5f');
    });

    it('should return correct color for critical priority', () => {
      expect(component.getPriorityColor('critical')).toBe('#ed8888');
    });

    it('should return default color for low and unknown priorities', () => {
      expect(component.getPriorityColor('low')).toBe('#49535e');
      expect(component.getPriorityColor('unknown')).toBe('#49535e');
    });
  });

  describe('formatActionPlanDescription', () => {
    it('should return empty string for null/undefined input', () => {
      expect(component.formatActionPlanDescription(null)).toBe('');
      expect(component.formatActionPlanDescription(undefined)).toBe('');
      expect(component.formatActionPlanDescription('')).toBe('');
    });

    it('should format bold text correctly', () => {
      const input = 'This is **bold** text';
      const expected = 'This is <span class="bold-text">bold</span> text';
      expect(component.formatActionPlanDescription(input)).toBe(expected);
    });

    it('should add sentence breaks after periods', () => {
      const input = 'First sentence. Second sentence.';
      const expected =
        'First sentence. <span class="sentence-break"></span>Second sentence.';
      expect(component.formatActionPlanDescription(input)).toBe(expected);
    });
  });

  describe('preapreBenchMark', () => {
    it('should process kpiChartData and set targetValue', () => {
      component.preapreBenchMark();
      expect(component.targetValue).toBe(18);
    });

    it('should handle empty kpiChartData', () => {
      component.kpiChartData = [];
      component.preapreBenchMark();
      expect(component.targetValue).toBe('NA');
    });
  });

  describe('getBenchmarkValue', () => {
    const mockPercentiles = {
      seventyPercentile: 12,
      eightyPercentile: 18,
      nintyPercentile: 25,
    };

    it('should return null for empty points or percentiles', () => {
      expect(component.getBenchmarkValue([], mockPercentiles)).toBeNull();
      expect(component.getBenchmarkValue(null, mockPercentiles)).toBeNull();
      expect(component.getBenchmarkValue([{ value: 10 }], null)).toBeNull();
    });

    it('should return next higher percentile value', () => {
      const points = [{ value: 10 }, { value: 15 }];
      expect(component.getBenchmarkValue(points, mockPercentiles)).toBe(18);
    });

    it('should filter out forecast values', () => {
      const points = [
        { value: 10, isForecast: false },
        { value: 30, isForecast: true },
      ];
      expect(component.getBenchmarkValue(points, mockPercentiles)).toBe(12);
    });
  });

  describe('resolveBenchmarkPercentiles', () => {
    it('should return benchmarkPercentiles if present', () => {
      const dataEntry = {
        benchmarkPercentiles: { seventyPercentile: 10, eightyPercentile: 15 },
      };
      expect(component.resolveBenchmarkPercentiles(dataEntry)).toEqual(
        dataEntry.benchmarkPercentiles,
      );
    });

    it('should return null if benchmarkPercentiles not present', () => {
      expect(component.resolveBenchmarkPercentiles({})).toBeNull();
      expect(component.resolveBenchmarkPercentiles(null)).toBeNull();
    });
  });
});
