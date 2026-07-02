import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { StackedAreaChartComponent } from './stacked-area-chart.component';
import { SimpleChange, ElementRef } from '@angular/core';
import * as d3 from 'd3';

describe('StackedAreaChartComponent', () => {
  let component: StackedAreaChartComponent;
  let fixture: ComponentFixture<StackedAreaChartComponent>;

  const mockData = [
    {
      date: '2024-01-01',
      value: {
        Issues: 10,
        Bugs: 5,
      },
    },
    {
      date: '2024-01-02',
      value: {
        Issues: 15,
        Bugs: 8,
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StackedAreaChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StackedAreaChartComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize instanceId uniquely', () => {
    const anotherFixture = TestBed.createComponent(StackedAreaChartComponent);
    const anotherComponent = anotherFixture.componentInstance;
    expect(component['instanceId']).not.toEqual(anotherComponent['instanceId']);
  });

  describe('ngAfterViewInit', () => {
    it('should initialize elem and call draw after timeout', fakeAsync(() => {
      spyOn(component, 'draw');
      component.ngAfterViewInit();
      expect(component.elem).toBe(component.chartContainer.nativeElement);
      tick();
      expect(component.draw).toHaveBeenCalled();
    }));
  });

  describe('ngOnChanges', () => {
    it('should call draw after timeout on data change', fakeAsync(() => {
      spyOn(component, 'draw');
      const changes = {
        data: new SimpleChange(null, mockData, false),
      };
      // Mock chartContainer existence
      component.elem = component.chartContainer.nativeElement;

      component.ngOnChanges(changes);
      tick();
      expect(component.draw).toHaveBeenCalled();
    }));

    it('should call draw after timeout on activeTab change', fakeAsync(() => {
      spyOn(component, 'draw');
      const changes = {
        activeTab: new SimpleChange(0, 1, false),
      };

      component.ngOnChanges(changes);
      tick();
      expect(component.draw).toHaveBeenCalled();
    }));
  });

  describe('draw', () => {
    beforeEach(() => {
      // Mock offsetWidth to ensure width > 0
      Object.defineProperty(
        component.chartContainer.nativeElement,
        'offsetWidth',
        {
          value: 500,
          configurable: true,
        },
      );
      component.elem = component.chartContainer.nativeElement;
    });

    it('should render SVG and paths', () => {
      component.draw();
      const svg = d3.select(component.elem).select('svg');
      expect(svg.empty()).toBeFalse();
      expect(svg.attr('width')).toBe('500'); // (500-70) + 70 = 500

      const paths = svg.selectAll('path');
      expect(paths.size()).toBeGreaterThan(0);
    });

    it('should calculate yMax dynamically based on data values and round up to next suitable interval', () => {
      component.data = [
        {
          date: '2024-01-01',
          value: {
            Issues: 70,
            Bugs: 50,
          },
        },
        {
          date: '2024-01-02',
          value: {
            Issues: 70,
            Bugs: 50,
          },
        },
      ];
      component.draw();
      const paths = d3.select(component.elem).selectAll('path');
      let foundExpectedCoordinate = false;
      paths.each(function (this: any) {
        const dAttr = d3.select(this).attr('d');
        if (dAttr && dAttr.includes('45.6')) {
          foundExpectedCoordinate = true;
        }
      });
      expect(foundExpectedCoordinate).toBeTrue();
    });

    it('should use unique clipPath ID', () => {
      component.draw();
      const clipPath = d3.select(component.elem).select('clipPath');
      const expectedId = `clip-${component['instanceId']}`;
      expect(clipPath.attr('id')).toBe(expectedId);

      const areaChartGroup = d3.select(component.elem).select('g[clip-path]');
      expect(areaChartGroup.attr('clip-path')).toBe(`url(#${expectedId})`);
    });

    it('should render legend items', () => {
      component.draw();
      const legendItems = d3.select(component.elem).selectAll('.legend_item');
      expect(legendItems.size()).toBe(2); // Issues and Bugs
    });

    it('should handle empty data gracefully', () => {
      component.data = [];
      component.draw();
      const svg = d3.select(component.elem).select('svg');
      expect(svg.empty()).toBeTrue();
    });
  });

  describe('ngOnDestroy', () => {
    it('should cleanup SVG and unobserve', () => {
      // Create a fresh mock for the ResizeObserver
      const mockResizeObserver = jasmine.createSpyObj('ResizeObserver', [
        'observe',
        'unobserve',
        'disconnect',
      ]);
      component['elemObserver'] = mockResizeObserver;
      component.elem = component.chartContainer.nativeElement;

      // Add a dummy SVG
      d3.select(component.elem).append('svg');

      component.ngOnDestroy();

      expect(d3.select(component.elem).select('svg').empty()).toBeTrue();
      expect(mockResizeObserver.unobserve).toHaveBeenCalledWith(component.elem);
      expect(component.data).toEqual([]);
    });
  });
});
