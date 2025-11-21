import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import * as d3 from 'd3';
import { ScatterPlotChartComponent } from './scatter-plot-chart.component';
import { HelperService } from 'src/app/services/helper.service';
import { SharedService } from 'src/app/services/shared.service';

describe('ScatterPlotChartComponent', () => {
  let component: ScatterPlotChartComponent;
  let fixture: ComponentFixture<ScatterPlotChartComponent>;
  let helperService: jasmine.SpyObj<HelperService>;
  let sharedService: jasmine.SpyObj<SharedService>;

  beforeEach(async () => {
    const helperServiceSpy = jasmine.createSpyObj('HelperService', [
      'getFormatedDateBasedOnType',
    ]);
    const sharedServiceSpy = jasmine.createSpyObj('SharedService', [
      'getSelectedTab',
      'getSelectedDateFilter',
    ]);

    await TestBed.configureTestingModule({
      imports: [ScatterPlotChartComponent],
      providers: [
        { provide: HelperService, useValue: helperServiceSpy },
        { provide: SharedService, useValue: sharedServiceSpy },
      ],
    }).compileComponents();

    helperService = TestBed.inject(
      HelperService,
    ) as jasmine.SpyObj<HelperService>;
    sharedService = TestBed.inject(
      SharedService,
    ) as jasmine.SpyObj<SharedService>;

    fixture = TestBed.createComponent(ScatterPlotChartComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.selectedtype).toBeUndefined();
      expect(component.kpiId).toBeUndefined();
      expect(component.unit).toBeUndefined();
      expect(component.source).toBe('');
    });

    it('should initialize counter to 0', () => {
      expect(component.counter).toBe(0);
    });

    it('should initialize elem in ngAfterViewInit', () => {
      fixture.detectChanges();
      component.ngAfterViewInit();
      // elem is initialized from svgRef.nativeElement.parentElement
      expect(component.elem).toBeDefined();
    });
  });

  describe('Data Processing', () => {
    it('should return empty array when data is undefined', () => {
      component['data'] = undefined;
      const result = component['processData']();
      expect(result).toEqual([]);
    });

    it('should return empty array when data length is 0', () => {
      component['data'] = [];
      const result = component['processData']();
      expect(result).toEqual([]);
    });

    it('should return empty array when weekly data is undefined', () => {
      component['data'] = [{ data: 'Test', value: undefined }];
      const result = component['processData']();
      expect(result).toEqual([]);
    });

    it('should process valid PR data correctly', () => {
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
                {
                  size: '200',
                  label: 'PR002',
                  hoverValue: { 'No of lines': 200 },
                },
              ],
            },
          ],
        },
      ];

      const result = component['processData']();

      expect(result.length).toBe(2);
      expect(result[0]).toEqual({
        weekNumber: 1,
        size: 100,
        prId: 'PR001',
        date: '2025-01-01',
      });
      expect(result[1]).toEqual({
        weekNumber: 1,
        size: 200,
        prId: 'PR002',
        date: '2025-01-01',
      });
    });

    it('should handle weeks with empty bubblePoints', () => {
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [],
            },
          ],
        },
      ];

      const result = component['processData']();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        weekNumber: 1,
        size: 0,
        prId: 'N/A',
        date: '2025-01-01',
      });
    });

    it('should handle weeks with no bubblePoints property', () => {
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: undefined,
            },
          ],
        },
      ];

      const result = component['processData']();

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        weekNumber: 1,
        size: 0,
        prId: 'N/A',
        date: '2025-01-01',
      });
    });

    it('should process multiple weeks correctly', () => {
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
              ],
            },
            {
              date: '2025-01-08',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '150',
                  label: 'PR002',
                  hoverValue: { 'No of lines': 150 },
                },
              ],
            },
          ],
        },
      ];

      const result = component['processData']();

      expect(result.length).toBe(2);
      expect(result[0].weekNumber).toBe(1);
      expect(result[1].weekNumber).toBe(2);
    });
  });

  describe('Jitter Application', () => {
    it('should not apply jitter to non-overlapping points', () => {
      const points = [
        { weekNumber: 1, size: 100, prId: 'PR001', date: '2025-01-01' },
        { weekNumber: 2, size: 100, prId: 'PR002', date: '2025-01-08' },
      ];

      const result = component['applyJitter'](points);

      expect(result[0].jitterX).toBe(0);
      expect(result[1].jitterX).toBe(0);
    });

    it('should apply jitter to overlapping points', () => {
      const points = [
        { weekNumber: 1, size: 100, prId: 'PR001', date: '2025-01-01' },
        { weekNumber: 1, size: 100, prId: 'PR002', date: '2025-01-01' },
        { weekNumber: 1, size: 100, prId: 'PR003', date: '2025-01-01' },
      ];

      const result = component['applyJitter'](points);

      expect(result.length).toBe(3);
      expect(result[0].jitterX).toBeLessThan(result[1].jitterX);
      expect(result[1].jitterX).toBeLessThan(result[2].jitterX);
    });

    it('should handle empty points array', () => {
      const points: any[] = [];
      const result = component['applyJitter'](points);

      expect(result).toEqual([]);
    });

    it('should preserve point data when applying jitter', () => {
      const points = [
        { weekNumber: 1, size: 100, prId: 'PR001', date: '2025-01-01' },
      ];

      const result = component['applyJitter'](points);

      expect(result[0].weekNumber).toBe(1);
      expect(result[0].size).toBe(100);
      expect(result[0].prId).toBe('PR001');
      expect(result[0].date).toBe('2025-01-01');
    });
  });

  describe('Rounding Function', () => {
    it('should round 1234 to 2000', () => {
      const result = component['roundToNearestLarge'](1234);
      expect(result).toBe(2000);
    });

    it('should round 5600 to 6000', () => {
      const result = component['roundToNearestLarge'](5600);
      expect(result).toBe(6000);
    });

    it('should return 0 for value <= 0', () => {
      expect(component['roundToNearestLarge'](0)).toBe(0);
      expect(component['roundToNearestLarge'](-100)).toBe(0);
    });

    it('should round 100 to 100', () => {
      const result = component['roundToNearestLarge'](100);
      expect(result).toBe(100);
    });

    it('should round 999 to 1000', () => {
      const result = component['roundToNearestLarge'](999);
      expect(result).toBe(1000);
    });
  });

  describe('Chart Creation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create SVG element when chart is created', () => {
      component['createChart']();
      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg).toBeTruthy();
    });

    it('should render chart even with no data', () => {
      component['data'] = [{ data: 'Project1', value: [] }];
      expect(() => component['createChart']()).not.toThrow();
    });

    it('should set SVG width and height correctly', () => {
      component['createChart']();
      const svg = fixture.debugElement.query(By.css('svg'));
      expect(svg.nativeElement.getAttribute('width')).toBe('825');
      expect(svg.nativeElement.getAttribute('height')).toBe('215');
    });

    it('should render grid lines', () => {
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
              ],
            },
          ],
        },
      ];
      component['createChart']();
      const gridLines = fixture.debugElement.queryAll(
        By.css('.grid-lines line'),
      );
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it('should render axes', () => {
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
              ],
            },
          ],
        },
      ];
      component['createChart']();
      const axisLabels = fixture.debugElement.queryAll(By.css('text'));
      expect(axisLabels.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnChanges', () => {
    it('should clear SVG and recreate chart on data change', () => {
      spyOn<any>(component, 'createChart');
      component['data'] = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [],
            },
          ],
        },
      ];

      component.ngOnChanges({
        data: {
          currentValue: component['data'],
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component['createChart']).toHaveBeenCalled();
    });

    it('should update xCaption from service for kanban type', () => {
      component.selectedtype = 'kanban';
      sharedService.getSelectedDateFilter.and.returnValue('Custom Date');

      component.ngOnChanges({
        data: {
          currentValue: [],
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.xCaption).toBe('Custom Date');
    });

    it('should update xCaption from service for developer tab', () => {
      component.selectedtype = 'other';
      sharedService.getSelectedTab.and.returnValue('developer');
      sharedService.getSelectedDateFilter.and.returnValue('Developer Date');

      component.ngOnChanges({
        data: {
          currentValue: [],
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.xCaption).toBe('Developer Date');
    });

    it('should reset counter on change', () => {
      component.counter = 5;

      component.ngOnChanges({
        data: {
          currentValue: [],
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.counter).toBe(0);
    });
  });

  describe('flattenData', () => {
    it('should flatten data correctly', () => {
      const data = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01 to 2025-01-07',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
              ],
            },
          ],
        },
      ];

      const result = component.flattenData(data);

      expect(result.length).toBe(1);
      expect(result[0].sprintNumber).toBe(1);
      expect(result[0].sprints).toContain('2025-01-01 to 2025-01-07');
    });

    it('should handle multiple projects', () => {
      const data = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
              ],
            },
          ],
        },
        {
          data: 'Project2',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project2',
              bubblePoints: [
                {
                  size: '200',
                  label: 'PR002',
                  hoverValue: { 'No of lines': 200 },
                },
              ],
            },
          ],
        },
      ];

      const result = component.flattenData(data);

      expect(result.length).toBe(1);
      expect(result[0].projects['Project1']).toBeDefined();
      expect(result[0].projects['Project2']).toBeDefined();
    });

    it('should calculate total lines correctly', () => {
      const data = [
        {
          data: 'Project1',
          value: [
            {
              date: '2025-01-01',
              kpiGroup: 'group1',
              sprojectName: 'Project1',
              bubblePoints: [
                {
                  size: '100',
                  label: 'PR001',
                  hoverValue: { 'No of lines': 100 },
                },
                {
                  size: '200',
                  label: 'PR002',
                  hoverValue: { 'No of lines': 200 },
                },
              ],
            },
          ],
        },
      ];

      const result = component.flattenData(data);

      expect(result[0].projects['Project1']['No of lines']).toBe(300);
    });
  });

  describe('getFormatedDateBasedOnType', () => {
    it('should call helper service with correct parameters', () => {
      helperService.getFormatedDateBasedOnType.and.returnValue('Jan 1, 2025');

      const result = component.getFormatedDateBasedOnType(
        '2025-01-01',
        'sprint',
      );

      expect(helperService.getFormatedDateBasedOnType).toHaveBeenCalledWith(
        '2025-01-01',
        'sprint',
      );
      expect(result).toBe('Jan 1, 2025');
    });
  });
});
