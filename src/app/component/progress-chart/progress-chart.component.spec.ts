import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ProgressChartComponent } from './progress-chart.component';
import { SimpleChange } from '@angular/core';
import * as d3 from 'd3';

describe('ProgressChartComponent', () => {
  let component: ProgressChartComponent;
  let fixture: ComponentFixture<ProgressChartComponent>;

  const mockChartData = [
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
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit', () => {
    it('should transform data and create chart when chartData exists', fakeAsync(() => {
      component.chartData = mockChartData;
      spyOn<any>(component, 'transformData');
      spyOn<any>(component, 'createChart');

      component.ngAfterViewInit();
      tick();

      expect(component['transformData']).toHaveBeenCalled();
      expect(component['createChart']).toHaveBeenCalled();
    }));

    it('should not create chart when chartData is undefined', () => {
      component.chartData = undefined;
      spyOn<any>(component, 'createChart');

      component.ngAfterViewInit();

      expect(component['createChart']).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should clear previous chart and recreate on data change', fakeAsync(() => {
      component.chartData = mockChartData;
      fixture.detectChanges();

      spyOn<any>(component, 'transformData');
      spyOn<any>(component, 'createChart');

      const changes = {
        chartData: new SimpleChange(null, mockChartData, false),
      };

      component.ngOnChanges(changes);
      tick();

      expect(component['transformData']).toHaveBeenCalled();
      expect(component['createChart']).toHaveBeenCalled();
    }));

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
      component.chartData = [];

      component['transformData']();

      expect(component['transformedData']).toEqual([]);
    });

    it('should handle undefined chartData', () => {
      component.chartData = undefined;

      component['transformData']();

      expect(component['transformedData']).toEqual([]);
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

      expect(svg.attr('width')).toBeDefined();
      expect(svg.attr('height')).toBe('300');
      expect(svg.style('display')).toBe('block');
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
      component.chartData = null;

      component['transformData']();

      expect(component['transformedData']).toEqual([]);
    });

    it('should handle ngOnChanges with empty data and not render', () => {
      const emptyData = [];
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
