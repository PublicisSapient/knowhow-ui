import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressChartComponent } from './progress-chart.component';
import { SimpleChange } from '@angular/core';
import * as d3 from 'd3';

describe('ProgressChartComponent', () => {
  let component: ProgressChartComponent;
  let fixture: ComponentFixture<ProgressChartComponent>;

  const mockChartData = [
    {
      filter1: 'Overall',
      filter2: '',
      value: [
        {
          data: 'Rework Rate',
          date: '2024-01',
          kpiGroup: 'Quality',
          sprojectName: 'Project1',
          value: 15.5,
        },
        {
          data: 'Revert Rate',
          date: '2024-01',
          kpiGroup: 'Quality',
          sprojectName: 'Project1',
          value: 5.2,
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProgressChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit', () => {
    it('should transform data and create chart when chartData exists', () => {
      component.chartData = mockChartData;
      spyOn<any>(component, 'transformData');
      spyOn<any>(component, 'createChart');

      component.ngAfterViewInit();

      expect(component['transformData']).toHaveBeenCalled();
      expect(component['createChart']).toHaveBeenCalled();
    });

    it('should not create chart when chartData is undefined', () => {
      component.chartData = undefined;
      spyOn<any>(component, 'createChart');

      component.ngAfterViewInit();

      expect(component['createChart']).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should clear previous chart and recreate on data change', () => {
      component.chartData = mockChartData;
      fixture.detectChanges();

      spyOn<any>(component, 'transformData');
      spyOn<any>(component, 'createChart');

      const changes = {
        chartData: new SimpleChange(null, mockChartData, false),
      };

      component.ngOnChanges(changes);

      expect(component['transformData']).toHaveBeenCalled();
      expect(component['createChart']).toHaveBeenCalled();
    });

    it('should not process if chartData change has no currentValue', () => {
      spyOn<any>(component, 'transformData');

      const changes = {
        chartData: new SimpleChange(null, null, false),
      };

      component.ngOnChanges(changes);

      expect(component['transformData']).not.toHaveBeenCalled();
    });
  });

  describe('transformData', () => {
    it('should transform valid chart data correctly', () => {
      component.chartData = mockChartData;

      component['transformData']();

      expect(component['transformedData'].length).toBe(2);
      expect(component['transformedData'][0]).toEqual({
        label: 'Rework Rate',
        value: 15.5,
        max: 100,
        target: '<20%',
        kpiGroup: 'Quality',
      });
      expect(component['transformedData'][1]).toEqual({
        label: 'Revert Rate',
        value: 5.2,
        max: 100,
        target: '<8%',
        kpiGroup: 'Quality',
      });
    });

    it('should handle empty value array', () => {
      component.chartData = [{ filter1: 'Overall', filter2: '', value: [] }];

      component['transformData']();

      expect(component['transformedData']).toEqual([]);
    });

    it('should handle undefined chartData', () => {
      component.chartData = undefined;

      component['transformData']();

      expect(component['transformedData']).toEqual([]);
    });

    it('should handle missing value in data item', () => {
      component.chartData = [
        {
          filter1: 'Overall',
          filter2: '',
          value: [
            {
              data: 'Rework Rate',
              date: '2024-01',
              kpiGroup: 'Quality',
              sprojectName: 'Project1',
              value: null,
            },
          ],
        },
      ];

      component['transformData']();

      expect(component['transformedData'][0].value).toBe(0);
    });

    it('should set correct target for Rework Rate', () => {
      component.chartData = [
        {
          filter1: 'Overall',
          filter2: '',
          value: [
            {
              data: 'Rework Rate',
              date: '2024-01',
              kpiGroup: 'Quality',
              sprojectName: 'Project1',
              value: 10,
            },
          ],
        },
      ];

      component['transformData']();

      expect(component['transformedData'][0].target).toBe('<20%');
    });

    it('should set correct target for Revert Rate', () => {
      component.chartData = [
        {
          filter1: 'Overall',
          filter2: '',
          value: [
            {
              data: 'Revert Rate',
              date: '2024-01',
              kpiGroup: 'Quality',
              sprojectName: 'Project1',
              value: 5,
            },
          ],
        },
      ];

      component['transformData']();

      expect(component['transformedData'][0].target).toBe('<8%');
    });
  });

  describe('createChart', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not render when transformedData is empty', () => {
      component['transformedData'] = [];
      spyOn(console, 'warn');

      component['createChart']();

      expect(console.warn).toHaveBeenCalledWith('No data to render');
    });

    it('should create SVG with correct dimensions', () => {
      component.chartData = mockChartData;
      component['transformData']();

      component['createChart']();

      const svg = d3.select(component.svgRef.nativeElement);
      expect(svg.attr('width')).toBe('825');
      expect(svg.attr('height')).toBe('215');
    });
  });

  describe('No data scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not render chart when chartData is null', () => {
      component.chartData = null;
      spyOn<any>(component, 'createChart');

      component.ngAfterViewInit();

      expect(component['createChart']).not.toHaveBeenCalled();
    });

    it('should not render chart when chartData is empty array', () => {
      component.chartData = [];
      component['transformData']();

      expect(component['transformedData']).toEqual([]);
    });

    it('should not render chart elements when transformedData is undefined', () => {
      component['transformedData'] = undefined;
      spyOn(console, 'warn');

      component['createChart']();

      expect(console.warn).toHaveBeenCalledWith('No data to render');
    });

    it('should not render chart when value array is null', () => {
      component.chartData = [{ filter1: 'Overall', filter2: '', value: null }];

      component['transformData']();

      expect(component['transformedData']).toEqual([]);
    });

    it('should handle ngOnChanges with empty data and not render', () => {
      const emptyData = [{ filter1: 'Overall', filter2: '', value: [] }];
      fixture.detectChanges();

      const changes = {
        chartData: new SimpleChange(null, emptyData, false),
      };

      component.ngOnChanges(changes);

      expect(component['transformedData']).toEqual([]);
      const svg = d3.select(component.svgRef.nativeElement);
      expect(svg.selectAll('rect').size()).toBe(0);
    });
  });
});
