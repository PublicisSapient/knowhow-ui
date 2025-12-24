import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SimpleChange } from '@angular/core';
import { SemiCircleDonutChartComponent } from './semi-circle-donut-chart.component';
import { SharedService } from 'src/app/services/shared.service';
import { BehaviorSubject, of } from 'rxjs';
import * as d3 from 'd3';

describe('SemiCircleDonutChartComponent', () => {
  let component: SemiCircleDonutChartComponent;
  let fixture: ComponentFixture<SemiCircleDonutChartComponent>;
  let mockSharedService: jasmine.SpyObj<SharedService>;

  beforeEach(async () => {
    // Create mock SharedService
    mockSharedService = jasmine.createSpyObj('SharedService', [], {
      showTableViewObs: of('chart'),
    });

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SemiCircleDonutChartComponent],
      providers: [{ provide: SharedService, useValue: mockSharedService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SemiCircleDonutChartComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Clean up D3 elements
    d3.select(fixture.nativeElement).selectAll('svg').remove();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.value).toBe(0);
      expect(component.max).toBe(100);
      expect(component.width).toBe(200);
      expect(component.height).toBe(100);
      expect(component.kpiId).toBe('');
      expect(component.totalIssues).toBe(0);
      expect(component.viewType).toBe('chart');
    });

    it('should call createDonutChart on ngOnInit', () => {
      spyOn<any>(component, 'createDonutChart');
      component.ngOnInit();
      expect(component['createDonutChart']).toHaveBeenCalled();
    });

    it('should handle kpi182 initialization', () => {
      component.kpiId = 'kpi182';
      component.chartData = [
        {
          value: [{ value: 75 }],
        },
      ];
      spyOn<any>(component, 'extractKpi182Data').and.callThrough();
      spyOn<any>(component, 'createDonutChart');

      component.ngOnInit();

      expect(component['extractKpi182Data']).toHaveBeenCalled();
      expect(component['createDonutChart']).toHaveBeenCalled();
    });

    it('should subscribe to showTableViewObs for kpi182', () => {
      component.kpiId = 'kpi182';
      component.ngOnInit();
      expect(component.viewType).toBe('chart');
    });
  });

  describe('ngOnChanges', () => {
    it('should recreate chart when value changes', () => {
      spyOn<any>(component, 'createDonutChart');

      const changes = {
        value: new SimpleChange(null, 50, true),
      };
      component.value = 50;

      component.ngOnChanges(changes);

      expect(component.value).toBe(50);
      expect(component['createDonutChart']).toHaveBeenCalled();
    });

    it('should parse string values to integers', () => {
      spyOn<any>(component, 'createDonutChart');
      component.value = '75' as any;
      component.totalIssues = '100' as any;

      component.ngOnChanges({
        value: new SimpleChange(null, '75', false),
      });

      expect(component.value).toBe(75);
      expect(component.totalIssues).toBe(100);
    });

    it('should handle chartData changes for kpi182', () => {
      component.kpiId = 'kpi182';
      const newChartData = [{ value: [{ value: 85 }] }];

      spyOn<any>(component, 'extractKpi182Data').and.callThrough();
      spyOn<any>(component, 'createDonutChart');

      component.ngOnChanges({
        chartData: new SimpleChange(null, newChartData, false),
      });

      expect(component['extractKpi182Data']).toHaveBeenCalled();
      expect(component['createDonutChart']).toHaveBeenCalled();
    });

    it('should not call extractKpi182Data for non-kpi182', () => {
      component.kpiId = 'kpi123';
      spyOn<any>(component, 'extractKpi182Data');

      component.ngOnChanges({
        chartData: new SimpleChange(null, [], false),
      });

      expect(component['extractKpi182Data']).not.toHaveBeenCalled();
    });
  });

  describe('extractKpi182Data', () => {
    it('should extract value from valid chartData', () => {
      component.kpiId = 'kpi182';
      component.chartData = [
        {
          value: [{ value: 65.5 }],
        },
      ];

      component['extractKpi182Data']();

      expect(component.value).toBe(65.5);
      expect(component.totalIssues).toBe(100);
    });

    it('should handle empty chartData', () => {
      component.kpiId = 'kpi182';
      component.chartData = [];

      spyOn(console, 'warn');
      component['extractKpi182Data']();

      expect(component.value).toBe(0);
      expect(component.totalIssues).toBe(0);
      expect(console.warn).toHaveBeenCalledWith(
        'No chartData available for kpi182',
      );
    });

    it('should handle null chartData', () => {
      component.kpiId = 'kpi182';
      component.chartData = null;

      spyOn(console, 'warn');
      component['extractKpi182Data']();

      expect(component.value).toBe(0);
      expect(component.totalIssues).toBe(0);
    });

    it('should handle chartData with missing value property', () => {
      component.kpiId = 'kpi182';
      component.chartData = [{}];

      component['extractKpi182Data']();

      expect(component.value).toBe(0);
    });

    it('should handle chartData with empty value array', () => {
      component.kpiId = 'kpi182';
      component.chartData = [{ value: [] }];

      component['extractKpi182Data']();

      expect(component.value).toBe(0);
    });
  });

  describe('createDonutChart', () => {
    it('should create SVG element', () => {
      component.value = 50;
      component.totalIssues = 100;
      component['createDonutChart']();

      const svg = d3.select(fixture.nativeElement).select('svg');
      expect(svg.empty()).toBe(false);
    });

    it('should remove existing SVG before creating new one', () => {
      component.value = 50;
      component['createDonutChart']();
      component.value = 75;
      component['createDonutChart']();

      const svgs = d3.select(fixture.nativeElement).selectAll('svg');
      expect(svgs.size()).toBe(1);
    });

    it('should create chart with correct dimensions for kpi182', () => {
      component.kpiId = 'kpi182';
      component.value = 80;
      component.totalIssues = 100;

      component['createDonutChart']();

      const svg = d3.select(fixture.nativeElement).select('svg');
      expect(svg.attr('width')).toBe('250');
      expect(svg.attr('height')).toBe('250');
    });

    it('should create chart with custom dimensions for non-kpi182', () => {
      component.width = 300;
      component.height = 150;
      component.value = 60;
      component.totalIssues = 100;

      component['createDonutChart']();

      const svg = d3.select(fixture.nativeElement).select('svg');
      expect(svg.attr('width')).toBe('300');
      expect(svg.attr('height')).toBe('150');
    });

    it('should use default dimensions when width/height are undefined', () => {
      component.width = undefined;
      component.height = undefined;
      component.value = 50;
      component.totalIssues = 100;

      component['createDonutChart']();

      const svg = d3.select(fixture.nativeElement).select('svg');
      expect(svg.attr('width')).toBe('100');
      expect(svg.attr('height')).toBe('200');
    });

    it('should create two path elements (arcs) for the donut', () => {
      component.value = 50;
      component.totalIssues = 100;
      component['createDonutChart']();

      const paths = d3.select(fixture.nativeElement).selectAll('path');
      expect(paths.size()).toBe(2);
    });

    it('should apply custom color when provided', () => {
      component.value = 50;
      component.totalIssues = 100;
      component.color = '#FF5733';

      component['createDonutChart']();

      const paths = d3.select(fixture.nativeElement).selectAll('path');
      const firstPath = d3.select(paths.nodes()[0]);
      expect(firstPath.attr('fill')).toBe('#FF5733');
    });

    it('should use default color when no color provided', () => {
      component.value = 50;
      component.totalIssues = 100;
      component.color = null;

      component['createDonutChart']();

      const paths = d3.select(fixture.nativeElement).selectAll('path');
      const firstPath = d3.select(paths.nodes()[0]);
      expect(firstPath.attr('fill')).toBe('#15ba40');
    });

    it('should display value and percentage text for kpi182', () => {
      component.kpiId = 'kpi182';
      component.value = 75.5;
      component.totalIssues = 100;

      component['createDonutChart']();

      const texts = d3.select(fixture.nativeElement).selectAll('text');
      expect(texts.size()).toBe(2);

      const valueText = d3.select(texts.nodes()[0]).text();
      const percentText = d3.select(texts.nodes()[1]).text();

      expect(valueText).toBe('75.5');
      expect(percentText).toBe('%');
    });

    it('should display value and percentage for non-kpi124', () => {
      component.kpiId = 'kpi123';
      component.value = 50;
      component.totalIssues = 100;

      component['createDonutChart']();

      const texts = d3.select(fixture.nativeElement).selectAll('text');
      expect(texts.size()).toBe(2);

      const valueText = d3.select(texts.nodes()[0]).text();
      const percentText = d3.select(texts.nodes()[1]).text();

      expect(valueText).toBe('50');
      expect(percentText).toBe('%');
    });

    it('should display fraction format for kpi124', () => {
      component.kpiId = 'kpi124';
      component.value = 30;
      component.totalIssues = 50;

      component['createDonutChart']();

      const texts = d3.select(fixture.nativeElement).selectAll('text');
      expect(texts.size()).toBe(1);

      const text = d3.select(texts.nodes()[0]).text();
      expect(text).toBe('30/50');
    });

    it('should format kpi182 value with one decimal place', () => {
      component.kpiId = 'kpi182';
      component.value = 75.456;
      component.totalIssues = 100;

      component['createDonutChart']();

      const texts = d3.select(fixture.nativeElement).selectAll('text');
      const valueText = d3.select(texts.nodes()[0]).text();

      expect(valueText).toBe('75.5');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = component.calculatePercentage(50, 100);
      expect(result).toBe(50);
    });

    it('should calculate percentage for non-round numbers', () => {
      const result = component.calculatePercentage(33, 100);
      expect(result).toBe(33);
    });

    it('should handle decimal values', () => {
      const result = component.calculatePercentage(25, 75);
      expect(result).toBeCloseTo(33.33, 2);
    });

    it('should return value when total is zero', () => {
      const result = component.calculatePercentage(50, 0);
      expect(result).toBe(50);
    });

    it('should handle zero value', () => {
      const result = component.calculatePercentage(0, 100);
      expect(result).toBe(0);
    });

    it('should handle 100% correctly', () => {
      const result = component.calculatePercentage(100, 100);
      expect(result).toBe(100);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle rapid value changes', () => {
      spyOn<any>(component, 'createDonutChart');

      component.value = 10;
      component.ngOnChanges({ value: new SimpleChange(null, 10, true) });

      component.value = 20;
      component.ngOnChanges({ value: new SimpleChange(10, 20, false) });

      component.value = 30;
      component.ngOnChanges({ value: new SimpleChange(20, 30, false) });

      expect(component['createDonutChart']).toHaveBeenCalledTimes(3);
      expect(component.value).toBe(30);
    });

    it('should handle negative values gracefully', () => {
      component.value = -10;
      component.totalIssues = 100;

      expect(() => {
        component['createDonutChart']();
      }).not.toThrow();
    });

    it('should handle values greater than max', () => {
      component.value = 150;
      component.totalIssues = 100;

      expect(() => {
        component['createDonutChart']();
      }).not.toThrow();
    });

    it('should handle kpi182 with different view types', () => {
      const viewSubject = new BehaviorSubject('table');
      Object.defineProperty(mockSharedService, 'showTableViewObs', {
        get: () => viewSubject.asObservable(),
      });

      component.kpiId = 'kpi182';
      component.chartData = [{ value: [{ value: 50 }] }];

      component.ngOnInit();

      expect(component.viewType).toBe('table');
    });
  });

  describe('Input Property Changes', () => {
    it('should handle multiple input changes simultaneously', () => {
      spyOn<any>(component, 'createDonutChart');

      component.value = 75;
      component.totalIssues = 100;
      component.color = '#FF0000';

      component.ngOnChanges({
        value: new SimpleChange(null, 75, true),
        totalIssues: new SimpleChange(null, 100, true),
        color: new SimpleChange(null, '#FF0000', true),
      });

      expect(component.value).toBe(75);
      expect(component['createDonutChart']).toHaveBeenCalled();
    });

    it('should not recreate chart if value does not change', () => {
      spyOn<any>(component, 'createDonutChart');

      component.ngOnChanges({
        color: new SimpleChange(null, '#FF0000', true),
      });

      expect(component['createDonutChart']).not.toHaveBeenCalled();
    });
  });
});
