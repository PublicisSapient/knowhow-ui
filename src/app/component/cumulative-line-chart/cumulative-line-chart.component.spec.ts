import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CumulativeLineChartComponent } from './cumulative-line-chart.component';
import { ViewContainerRef, SimpleChange } from '@angular/core';

describe('CumulativeLineChartComponent', () => {
  let component: CumulativeLineChartComponent;
  let fixture: ComponentFixture<CumulativeLineChartComponent>;
  let mockViewContainerRef: any;
  let mockElementRef: any;

  beforeEach(async () => {
    mockElementRef = {
      nativeElement: document.createElement('div'),
    };
    mockElementRef.nativeElement.id = 'chart';

    // Create necessary DOM structure expected by draw()
    const chartDiv = document.createElement('div');
    chartDiv.id = 'chart';
    mockElementRef.nativeElement.appendChild(chartDiv);

    const yAxisContainer = document.createElement('div');
    yAxisContainer.classList.add('yaxis-container');
    mockElementRef.nativeElement.appendChild(yAxisContainer);

    const container = document.createElement('div');
    container.id = 'container';
    const xCaption = document.createElement('div');
    xCaption.classList.add('x-caption');
    const span = document.createElement('span');
    xCaption.appendChild(span);
    container.appendChild(xCaption);
    mockElementRef.nativeElement.appendChild(container);

    const legendContainer = document.createElement('div');
    legendContainer.id = 'legendContainer';
    mockElementRef.nativeElement.appendChild(legendContainer);

    const tooltipContainer = document.createElement('div');
    tooltipContainer.classList.add('tooltip-container');
    mockElementRef.nativeElement.appendChild(tooltipContainer);

    mockViewContainerRef = {
      element: mockElementRef,
    };

    await TestBed.configureTestingModule({
      declarations: [CumulativeLineChartComponent],
      providers: [
        { provide: ViewContainerRef, useValue: mockViewContainerRef },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CumulativeLineChartComponent);
    component = fixture.componentInstance;
    component.elem = mockElementRef.nativeElement; // Initialize elem
    component.data = [
      {
        dataGroup: [],
        forecasts: [],
      },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should process data and call draw', () => {
      spyOn(component, 'draw');
      const changes = {
        data: new SimpleChange(null, component.data, true),
      };

      component.data = [
        {
          dataGroup: [
            {
              filter: 'Week 1',
              value: [{ value: 10, kpiGroup: 'Group A' }],
              filter1: 'Week 1',
            },
          ],
          forecasts: [
            {
              filter: 'Week 2',
              value: 20,
              kpiGroup: 'Predicted Completion',
              isForecast: true,
            },
          ],
        },
      ];

      component.ngOnChanges(changes);

      expect(component.graphData.length).toBeGreaterThan(0);
      expect(component.draw).toHaveBeenCalled();
      // Verify forecast merge
      const forecastGroup = component.graphData.find(
        (g) => g.filter === 'Forecast',
      );
      expect(forecastGroup).toBeDefined();
      expect(forecastGroup.value[0].kpiGroup).toBe('Planned Completion');
    });
  });

  describe('Benchmark Logic', () => {
    it('should resolve benchmark percentiles from data entry', () => {
      const dataEntry = {
        benchmarkPercentiles: {
          seventyPercentile: 70,
          eightyPercentile: 80,
          nintyPercentile: 90,
        },
      };
      const result = component.resolveBenchmarkPercentiles(dataEntry);
      expect(result).toEqual(dataEntry.benchmarkPercentiles);
    });

    it('should return null if no benchmark percentiles are present', () => {
      const dataEntry = {};
      const result = component.resolveBenchmarkPercentiles(dataEntry);
      expect(result).toBeNull();
    });

    it('should calculate benchmark value correctly when max value < 70th percentile', () => {
      const mergedGroups = [
        {
          value: [{ value: 50 }, { value: 60 }],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      // Max is 60. Lowest percentile > 60 is 70.
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(result).toBe(70);
    });

    it('should calculate benchmark value correctly when 70th < max value < 80th percentile', () => {
      const mergedGroups = [
        {
          value: [{ value: 75 }],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      // Max is 75. Lowest percentile > 75 is 80.
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(result).toBe(80);
    });

    it('should ignore forecast values when determining max actual value', () => {
      const mergedGroups = [
        {
          value: [{ value: 75 }, { value: 95, isForecast: true }],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      // Max actual is 75. Forecast 95 is ignored. Result should be 80.
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(result).toBe(80);
    });

    it('should default to highest percentile if max value exceeds all percentiles', () => {
      const mergedGroups = [
        {
          value: [{ value: 95 }],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      // Max is 95 (> 90). Should return 90.
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(result).toBe(90);
    });

    it('should return null if input groups are empty or percentiles missing', () => {
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      expect(component.getBenchmarkValue([], percentiles)).toBeNull();
      expect(component.getBenchmarkValue([{ value: [] }], null)).toBeNull();
    });
  });

  describe('formatDateOnXAxis', () => {
    it('should format dates correctly', () => {
      // Mock data with a specific date: 2023-01-01 (Sunday)
      const data = [
        {
          filter: '2023-01-01',
          value: [],
        },
      ];
      const result = component.formatDateOnXAxis(data);
      // Expected format: SUN 01/01
      expect(result[0].filter).toContain('SUN 01/01');
    });

    it('should identify current day', () => {
      const today = new Date();
      const data = [
        {
          filter: today.toDateString(),
          value: [],
        },
      ];
      component.formatDateOnXAxis(data);
      expect(component.currentDayIndex).toBe(0);
    });

    it('should handle forecast items', () => {
      const data = [
        {
          value: [{ isForecast: true }],
        },
      ];
      const result = component.formatDateOnXAxis(data);
      expect(result[0].filter).toBe('Forecast');
    });
  });

  describe('generateDottedLineDataForKpi', () => {
    it('should generate dotted line data for kpi125', () => {
      // Setup data structure for generateDottedLineDataForKpi
      component.data = [
        {
          additionalGroup: ['Additional Group'],
        },
      ];
      component.graphData = [
        {
          lineDataCategorywise: {
            'Predicted Completion': { value: 100 },
            'Completion Till Date': { value: 50 },
          },
        },
      ];

      const result = component.generateDottedLineDataForKpi();
      expect(result.length).toBe(2);
      expect(result[0].value).toBe(100);
      expect(result[1].value).toBe(50);
      expect(result[0].kpiGroup).toBe('Additional Group');
    });

    it('should return empty array if additionalGroup is missing', () => {
      component.data = [{}];
      const result = component.generateDottedLineDataForKpi();
      expect(result.length).toBe(0);
    });
  });

  describe('draw', () => {
    it('should render chart elements', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            { kpiGroup: 'Group A', value: 10 },
            { kpiGroup: 'Group B', value: 20 },
          ],
        },
      ];
      component.draw();

      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg).toBeTruthy();

      const yAxisSvg = mockElementRef.nativeElement.querySelector(
        '.yaxis-container svg',
      );
      expect(yAxisSvg).toBeTruthy();

      const legendItems =
        mockElementRef.nativeElement.querySelectorAll('.legend_item');
      expect(legendItems.length).toBeGreaterThan(0);
    });

    // We can add a test to verify the benchmark line is appended if value exists
    it('should render benchmark line if benchmark data is present', () => {
      component.graphData = [
        {
          value: [{ kpiGroup: 'Group A', value: 50 }],
        },
      ];
      // Mock resolveBenchmarkPercentiles to return data this one time without changing component inputs complexly
      spyOn(component, 'resolveBenchmarkPercentiles').and.returnValue({
        seventyPercentile: 60,
        eightyPercentile: 80,
        nintyPercentile: 90,
      });

      component.draw({
        seventyPercentile: 60,
        eightyPercentile: 80,
        nintyPercentile: 90,
      });

      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg.innerHTML).toContain('rgb(21, 186, 64)');

      expect(chartSvg.textContent).toContain('60');
    });
  });
});
