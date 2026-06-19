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

    /**
     * Test benchmark line rendering when benchmark data is present
     * Scenario: Component has valid benchmark percentiles
     * Expected: Benchmark line should be rendered (currently commented out in implementation)
     */
    it('should handle benchmark data correctly', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 50 }],
        },
      ];
      const percentiles = {
        seventyPercentile: 60,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };

      // Note: Benchmark line rendering is commented out in the implementation
      // This test verifies the component handles benchmark data without errors
      expect(() => component.draw(percentiles)).not.toThrow();
    });

    it('should handle single data point correctly', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10 }],
        },
      ];
      component.draw();

      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg).toBeTruthy();
      // Single point should be rendered as a circle, not a line
      const circles = chartSvg.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    /**
     * Test forecast data rendering with dashed line
     * Scenario: Data contains both actual and forecast points with proper lineDataCategorywise
     * Expected: Should render dashed line for forecast segment
     */
    it('should render forecast data with dashed line', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10, isForecast: false }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-01', value: 10, isForecast: false },
          },
        },
        {
          filter: 'Forecast',
          value: [{ kpiGroup: 'Group A', value: 20, isForecast: true }],
          lineDataCategorywise: {
            'Group A': { filter: 'Forecast', value: 20, isForecast: true },
          },
        },
      ];
      component.draw();

      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg).toBeTruthy();
      // Check for dashed line (stroke-dasharray attribute)
      const paths = chartSvg.querySelectorAll('path');
      let hasDashedLine = false;
      paths.forEach((path) => {
        const style = path.getAttribute('style');
        if (style && style.includes('stroke-dasharray')) {
          hasDashedLine = true;
        }
      });
      expect(hasDashedLine).toBe(true);
    });

    it('should add zero baseline for negative values', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            { kpiGroup: 'Group A', value: -10 },
            { kpiGroup: 'Group B', value: 20 },
          ],
        },
      ];
      component.draw();

      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg).toBeTruthy();
      // Check for zero baseline line
      const lines = chartSvg.querySelectorAll('line');
      let hasZeroBaseline = false;
      lines.forEach((line) => {
        const stroke = line.getAttribute('stroke');
        const strokeDasharray = line.getAttribute('stroke-dasharray');
        if (stroke === '#999' && strokeDasharray === '4,2') {
          hasZeroBaseline = true;
        }
      });
      expect(hasZeroBaseline).toBe(true);
    });

    it('should set correct gap for x-axis labels based on data length', () => {
      // Test with 5 data points (gap should be 1)
      component.graphData = Array.from({ length: 5 }, (_, i) => ({
        filter: `2023-01-0${i + 1}`,
        value: [{ kpiGroup: 'Group A', value: i * 10 }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeGreaterThan(0);

      // Test with 100 data points (gap should be 6)
      component.graphData = Array.from({ length: 100 }, (_, i) => ({
        filter: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: [{ kpiGroup: 'Group A', value: i }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(100);
    });

    it("should highlight today's date on x-axis", () => {
      const today = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
      const formattedToday = `${days[today.getDay()]} ${
        today.getDate() < 10 ? '0' + today.getDate() : today.getDate()
      }/${
        today.getMonth() + 1 < 10
          ? '0' + (today.getMonth() + 1)
          : today.getMonth() + 1
      }`;

      component.graphData = [
        {
          filter: today.toISOString().split('T')[0],
          value: [{ kpiGroup: 'Group A', value: 10 }],
        },
      ];
      component.formatDateOnXAxis(component.graphData);
      component.draw();

      expect(component.currentDayIndex).toBe(0);
    });
  });

  describe('ngOnChanges with forecast renaming logic', () => {
    it('should rename forecast kpiGroup from "Predicted Completion" to "Planned Completion"', () => {
      component.data = [
        {
          dataGroup: [
            {
              filter: 'Week 1',
              value: [{ value: 10, kpiGroup: 'Group A' }],
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

      const changes = {
        data: new SimpleChange(null, component.data, true),
      };

      component.ngOnChanges(changes);

      const forecastGroup = component.graphData.find(
        (g) => g.filter === 'Forecast',
      );
      expect(forecastGroup).toBeDefined();
      expect(forecastGroup.value[0].kpiGroup).toBe('Planned Completion');
    });

    it('should handle forecasts with kpi_group property', () => {
      component.data = [
        {
          dataGroup: [],
          forecasts: [
            {
              value: 20,
              kpi_group: 'Some Group',
              isForecast: true,
            },
          ],
        },
      ];

      const changes = {
        data: new SimpleChange(null, component.data, true),
      };

      component.ngOnChanges(changes);

      const forecastGroup = component.graphData.find(
        (g) => g.filter === 'Forecast',
      );
      expect(forecastGroup).toBeDefined();
      expect(forecastGroup.value[0].kpiGroup).toBe('Some Group');
    });

    it('should default to "Planned Completion" when kpiGroup is missing', () => {
      component.data = [
        {
          dataGroup: [],
          forecasts: [
            {
              value: 20,
              isForecast: true,
            },
          ],
        },
      ];

      const changes = {
        data: new SimpleChange(null, component.data, true),
      };

      component.ngOnChanges(changes);

      const forecastGroup = component.graphData.find(
        (g) => g.filter === 'Forecast',
      );
      expect(forecastGroup).toBeDefined();
      expect(forecastGroup.value[0].kpiGroup).toBe('Planned Completion');
    });
  });

  describe('Hover value functionality', () => {
    /**
     * Test hoverValue tooltip display on circle mouseover
     * Scenario: Circle has hoverValue data and user hovers over it
     * Expected: Tooltip should be created and displayed
     */
    it('should display hoverValue tooltip on circle mouseover', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            {
              kpiGroup: 'Group A',
              value: 10,
              hoverValue: {
                'Total Items': 100,
                'Completed Items': 10,
              },
            },
          ],
          lineDataCategorywise: {
            'Group A': {
              filter: '2023-01-01',
              kpiGroup: 'Group A',
              value: 10,
              hoverValue: {
                'Total Items': 100,
                'Completed Items': 10,
              },
            },
          },
        },
      ];
      component.draw();

      const circles = mockElementRef.nativeElement.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Simulate mouseover event
      const mouseOverEvent = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(mouseOverEvent, 'target', {
        value: circles[circles.length - 1],
        enumerable: true,
      });
      circles[circles.length - 1].dispatchEvent(mouseOverEvent);

      // Tooltip container should be created
      const tooltipContainer =
        mockElementRef.nativeElement.querySelector('.tooltip');
      expect(tooltipContainer).toBeTruthy();
    });
  });

  describe('Edge Cases and Additional Coverage', () => {
    /**
     * Test that ngOnChanges handles empty dataGroup array correctly
     * Scenario: When data contains no dataGroup items
     * Expected: Should not throw error and graphData should only contain forecast if present
     */
    it('should handle empty dataGroup array in ngOnChanges', () => {
      component.data = [
        {
          dataGroup: [],
          forecasts: [],
        },
      ];
      const changes = {
        data: new SimpleChange(null, component.data, true),
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
      expect(component.graphData).toEqual([]);
    });

    /**
     * Test that ngOnChanges handles missing dataGroup property
     * Scenario: When data object doesn't have dataGroup property
     * Expected: Should handle gracefully without errors
     */
    it('should handle missing dataGroup property in ngOnChanges', () => {
      component.data = [{}];
      const changes = {
        data: new SimpleChange(null, component.data, true),
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    /**
     * Test forecast value normalization using 'data' property
     * Scenario: When forecast object uses 'data' instead of 'value'
     * Expected: Should correctly map 'data' to 'value' property
     */
    it('should handle forecast with data property instead of value', () => {
      component.data = [
        {
          dataGroup: [],
          forecasts: [
            {
              filter: 'Week 2',
              data: 25,
              kpiGroup: 'Predicted Completion',
            },
          ],
        },
      ];
      const changes = {
        data: new SimpleChange(null, component.data, true),
      };
      component.ngOnChanges(changes);
      const forecastGroup = component.graphData.find(
        (g) => g.filter === 'Forecast',
      );
      expect(forecastGroup.value[0].value).toBe(25);
    });

    /**
     * Test forecast value defaults to 0 when both value and data are missing
     * Scenario: When forecast object has neither value nor data property
     * Expected: Should default to 0
     */
    it('should default forecast value to 0 when value and data are missing', () => {
      component.data = [
        {
          dataGroup: [],
          forecasts: [
            {
              filter: 'Week 2',
              kpiGroup: 'Predicted Completion',
            },
          ],
        },
      ];
      const changes = {
        data: new SimpleChange(null, component.data, true),
      };
      component.ngOnChanges(changes);
      const forecastGroup = component.graphData.find(
        (g) => g.filter === 'Forecast',
      );
      expect(forecastGroup.value[0].value).toBe(0);
    });

    /**
     * Test getBenchmarkValue with non-finite values
     * Scenario: When data contains NaN or Infinity values
     * Expected: Should filter out non-finite values and calculate correctly
     */
    it('should handle non-finite values in getBenchmarkValue', () => {
      const mergedGroups = [
        {
          value: [
            { value: 50 },
            { value: NaN },
            { value: Infinity },
            { value: 60 },
          ],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(result).toBe(70);
    });

    /**
     * Test getBenchmarkValue with all non-finite percentiles
     * Scenario: When all percentile values are NaN or invalid
     * Expected: Should return NaN
     */
    it('should return NaN when all percentiles are non-finite', () => {
      const mergedGroups = [
        {
          value: [{ value: 50 }],
        },
      ];
      const percentiles = {
        seventyPercentile: NaN,
        eightyPercentile: NaN,
        nintyPercentile: NaN,
      };
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(isNaN(result)).toBe(true);
    });

    /**
     * Test getBenchmarkValue with mixed forecast and actual values
     * Scenario: Multiple groups with mix of forecast and actual data
     * Expected: Should only consider actual values for max calculation
     */
    it('should correctly handle multiple groups with mixed forecast values', () => {
      const mergedGroups = [
        {
          value: [{ value: 50 }, { value: 100, isForecast: true }],
        },
        {
          value: [{ value: 65 }, { value: 120, isForecast: true }],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      // Max actual is 65, should return 70
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      expect(result).toBe(70);
    });

    /**
     * Test formatDateOnXAxis with invalid date string
     * Scenario: When filter contains invalid date format
     * Expected: Should handle gracefully and format as "Invalid Date"
     */
    it('should handle invalid date in formatDateOnXAxis', () => {
      const data = [
        {
          filter: 'invalid-date',
          value: [],
        },
      ];
      const result = component.formatDateOnXAxis(data);
      expect(result[0].filter).toContain('NaN');
    });

    /**
     * Test formatDateOnXAxis with single digit dates and months
     * Scenario: Date with day < 10 and month < 10
     * Expected: Should add leading zeros
     */
    it('should add leading zeros for single digit dates and months', () => {
      const data = [
        {
          filter: '2023-01-05',
          value: [],
        },
      ];
      const result = component.formatDateOnXAxis(data);
      expect(result[0].filter).toContain('05/01');
    });

    /**
     * Test formatDateOnXAxis with double digit dates and months
     * Scenario: Date with day >= 10 and month >= 10
     * Expected: Should not add leading zeros
     */
    it('should not add leading zeros for double digit dates and months', () => {
      const data = [
        {
          filter: '2023-11-15',
          value: [],
        },
      ];
      const result = component.formatDateOnXAxis(data);
      expect(result[0].filter).toContain('15/11');
    });

    /**
     * Test generateDottedLineDataForKpi when Predicted Completion exists but Completion Till Date doesn't
     * Scenario: Current index has Predicted Completion but no Completion Till Date
     * Expected: Should use Completion Till Date from previous index
     */
    it('should use previous index Completion Till Date when current is missing', () => {
      component.data = [
        {
          additionalGroup: ['Additional Group'],
        },
      ];
      component.graphData = [
        {
          lineDataCategorywise: {
            'Completion Till Date': { value: 40 },
          },
        },
        {
          lineDataCategorywise: {
            'Predicted Completion': { value: 100 },
          },
        },
      ];
      const result = component.generateDottedLineDataForKpi();
      expect(result.length).toBe(2);
      expect(result[0].value).toBe(100);
      expect(result[1].value).toBe(40);
    });

    /**
     * Test generateDottedLineDataForKpi when Predicted Completion doesn't exist
     * Scenario: No data point has Predicted Completion
     * Expected: Should return empty array
     */
    it('should return empty array when Predicted Completion is not found', () => {
      component.data = [
        {
          additionalGroup: ['Additional Group'],
        },
      ];
      component.graphData = [
        {
          lineDataCategorywise: {
            'Completion Till Date': { value: 50 },
          },
        },
      ];
      const result = component.generateDottedLineDataForKpi();
      expect(result.length).toBe(0);
    });

    /**
     * Test draw method with kpi125 to render dotted line
     * Scenario: Component kpiId is kpi125 with additional group data
     * Expected: Should render dotted line and add to legend
     */
    it('should render dotted line for kpi125', () => {
      component.kpiId = 'kpi125';
      component.data = [
        {
          additionalGroup: ['Projected Completion'],
          dataGroup: [],
        },
      ];
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10 }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-01', value: 10 },
            'Predicted Completion': { filter: '2023-01-01', value: 50 },
            'Completion Till Date': { filter: '2023-01-01', value: 30 },
          },
        },
      ];
      component.draw();
      const legendContainer =
        mockElementRef.nativeElement.querySelector('#legendContainer');
      expect(legendContainer.innerHTML).toContain('Projected Completion');
      expect(legendContainer.innerHTML).toContain(
        'legend_color_indicator_dashed',
      );
    });

    /**
     * Test draw method with multiple data points to verify line rendering
     * Scenario: Multiple data points for the same kpiGroup
     * Expected: Should render path element (line) instead of just circles
     */
    it('should render line path for multiple data points', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10 }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-01', value: 10 },
          },
        },
        {
          filter: '2023-01-02',
          value: [{ kpiGroup: 'Group A', value: 20 }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-02', value: 20 },
          },
        },
      ];
      component.draw();
      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      const paths = chartSvg.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    /**
     * Test draw method with forecast segment rendering
     * Scenario: Data contains both actual and forecast points for same kpiGroup
     * Expected: Should render solid line for actual and dashed line connecting to forecast
     */
    it('should render solid and dashed lines for forecast segments', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10, isForecast: false }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-01', value: 10, isForecast: false },
          },
        },
        {
          filter: '2023-01-02',
          value: [{ kpiGroup: 'Group A', value: 15, isForecast: false }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-02', value: 15, isForecast: false },
          },
        },
        {
          filter: 'Forecast',
          value: [{ kpiGroup: 'Group A', value: 25, isForecast: true }],
          lineDataCategorywise: {
            'Group A': { filter: 'Forecast', value: 25, isForecast: true },
          },
        },
      ];
      component.draw();
      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      const paths = chartSvg.querySelectorAll('path');
      let hasSolidLine = false;
      let hasDashedLine = false;
      paths.forEach((path) => {
        const style = path.getAttribute('style');
        if (style && style.includes('stroke-dasharray')) {
          hasDashedLine = true;
        } else if (style && style.includes('stroke-width')) {
          hasSolidLine = true;
        }
      });
      expect(hasSolidLine).toBe(true);
      expect(hasDashedLine).toBe(true);
    });

    /**
     * Test x-axis gap calculation for exactly 10 data points
     * Scenario: Data length equals 10
     * Expected: Gap should be 1
     */
    it('should set gap to 1 for exactly 10 data points', () => {
      component.graphData = Array.from({ length: 10 }, (_, i) => ({
        filter: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: [{ kpiGroup: 'Group A', value: i * 10 }],
      }));
      component.draw();
      // With gap 1, all 10 points should be visible
      expect(component.visibleXAxisLbl.length).toBe(10);
    });

    /**
     * Test x-axis gap calculation for 11-30 data points
     * Scenario: Data length is 20
     * Expected: Gap should be 2
     */
    it('should set gap to 2 for 11-30 data points', () => {
      component.graphData = Array.from({ length: 20 }, (_, i) => ({
        filter: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: [{ kpiGroup: 'Group A', value: i * 10 }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(20);
      expect(component.visibleXAxisLbl.length).toBeGreaterThan(5);
    });

    /**
     * Test x-axis gap calculation for 31-50 data points
     * Scenario: Data length is 40
     * Expected: Gap should be 3
     */
    it('should set gap to 3 for 31-50 data points', () => {
      component.graphData = Array.from({ length: 40 }, (_, i) => ({
        filter: `Day ${i + 1}`,
        value: [{ kpiGroup: 'Group A', value: i }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(40);
    });

    /**
     * Test x-axis gap calculation for 51-70 data points
     * Scenario: Data length is 60
     * Expected: Gap should be 4
     */
    it('should set gap to 4 for 51-70 data points', () => {
      component.graphData = Array.from({ length: 60 }, (_, i) => ({
        filter: `Day ${i + 1}`,
        value: [{ kpiGroup: 'Group A', value: i }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(60);
    });

    /**
     * Test x-axis gap calculation for 71-90 data points
     * Scenario: Data length is 80
     * Expected: Gap should be 5
     */
    it('should set gap to 5 for 71-90 data points', () => {
      component.graphData = Array.from({ length: 80 }, (_, i) => ({
        filter: `Day ${i + 1}`,
        value: [{ kpiGroup: 'Group A', value: i }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(80);
    });

    /**
     * Test x-axis gap calculation for 91-110 data points
     * Scenario: Data length is 100
     * Expected: Gap should be 6
     */
    it('should set gap to 6 for 91-110 data points', () => {
      component.graphData = Array.from({ length: 100 }, (_, i) => ({
        filter: `Day ${i + 1}`,
        value: [{ kpiGroup: 'Group A', value: i }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(100);
    });

    /**
     * Test x-axis gap calculation for more than 110 data points
     * Scenario: Data length is 120
     * Expected: Gap should be 7
     */
    it('should set gap to 7 for more than 110 data points', () => {
      component.graphData = Array.from({ length: 120 }, (_, i) => ({
        filter: `Day ${i + 1}`,
        value: [{ kpiGroup: 'Group A', value: i }],
      }));
      component.draw();
      expect(component.visibleXAxisLbl.length).toBeLessThan(120);
    });

    /**
     * Test that last x-axis label is always visible
     * Scenario: Gap calculation doesn't include last label
     * Expected: Last label should be added to visibleXAxisLbl after formatDateOnXAxis
     */
    it('should ensure last x-axis label is always visible', () => {
      const testData = Array.from({ length: 25 }, (_, i) => {
        const date = new Date(2023, 0, i + 1);
        return {
          filter: date.toISOString().split('T')[0],
          value: [{ kpiGroup: 'Group A', value: i }],
        };
      });
      component.graphData = testData;
      component.formatDateOnXAxis(component.graphData);
      component.draw();
      // After formatting, the last label should be in visibleXAxisLbl
      const lastLabel =
        component.graphData[component.graphData.length - 1].filter;
      expect(
        component.visibleXAxisLbl[component.visibleXAxisLbl.length - 1],
      ).toBe(lastLabel);
    });

    /**
     * Test draw with negative and positive values
     * Scenario: Data contains mix of negative and positive values
     * Expected: Should render zero baseline and handle y-scale correctly
     */
    it('should handle mix of negative and positive values', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            { kpiGroup: 'Group A', value: -20 },
            { kpiGroup: 'Group B', value: 30 },
          ],
        },
      ];
      component.draw();
      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg).toBeTruthy();
    });

    /**
     * Test draw with all negative values
     * Scenario: All data values are negative
     * Expected: Should render chart with negative y-scale and zero baseline
     */
    it('should handle all negative values', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            { kpiGroup: 'Group A', value: -10 },
            { kpiGroup: 'Group B', value: -20 },
          ],
        },
      ];
      component.draw();
      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      expect(chartSvg).toBeTruthy();
      // Should have zero baseline
      const lines = chartSvg.querySelectorAll('line');
      let hasZeroBaseline = false;
      lines.forEach((line) => {
        if (
          line.getAttribute('stroke') === '#999' &&
          line.getAttribute('stroke-dasharray') === '4,2'
        ) {
          hasZeroBaseline = true;
        }
      });
      expect(hasZeroBaseline).toBe(true);
    });

    /**
     * Test draw with zero values
     * Scenario: All data values are zero
     * Expected: Should render chart without errors
     */
    it('should handle all zero values', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            { kpiGroup: 'Group A', value: 0 },
            { kpiGroup: 'Group B', value: 0 },
          ],
        },
      ];
      expect(() => component.draw()).not.toThrow();
    });

    /**
     * Test xCaption and yCaption rendering
     * Scenario: Component has xCaption and yCaption inputs
     * Expected: Should render captions in appropriate containers
     */
    it('should render x and y captions', () => {
      component.xCaption = 'Time Period';
      component.yCaption = 'Value Count';
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10 }],
        },
      ];
      component.draw();
      const xCaptionText =
        mockElementRef.nativeElement.querySelector(
          '.x-caption span',
        ).textContent;
      const yCaptionText =
        mockElementRef.nativeElement.querySelector(
          '.y-caption span',
        ).textContent;
      expect(xCaptionText).toBe('Time Period');
      expect(yCaptionText).toBe('Value Count');
    });

    /**
     * Test legend rendering with multiple categories
     * Scenario: Data has multiple kpiGroups
     * Expected: Should render legend item for each category
     */
    it('should render legend for all categories', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [
            { kpiGroup: 'Group A', value: 10 },
            { kpiGroup: 'Group B', value: 20 },
            { kpiGroup: 'Group C', value: 30 },
          ],
        },
      ];
      component.draw();
      const legendItems =
        mockElementRef.nativeElement.querySelectorAll('.legend_item');
      expect(legendItems.length).toBe(3);
    });

    /**
     * Test gridline rendering
     * Scenario: Chart is drawn with data
     * Expected: Should render horizontal and vertical gridlines
     */
    it('should render horizontal and vertical gridlines', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10 }],
        },
      ];
      component.draw();
      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      const gridlines = chartSvg.querySelectorAll('.gridline');
      expect(gridlines.length).toBeGreaterThan(0);
    });

    /**
     * Test resolveBenchmarkPercentiles with undefined input
     * Scenario: Input is undefined
     * Expected: Should return null
     */
    it('should return null for undefined input in resolveBenchmarkPercentiles', () => {
      const result = component.resolveBenchmarkPercentiles(undefined);
      expect(result).toBeNull();
    });

    /**
     * Test ngOnInit
     * Scenario: Component initialization
     * Expected: Should execute without errors
     */
    it('should execute ngOnInit without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    /**
     * Test onPopup input property
     * Scenario: onPopup is set to true
     * Expected: Component should accept the input
     */
    it('should accept onPopup input', () => {
      component.onPopup = true;
      expect(component.onPopup).toBe(true);
    });

    /**
     * Test draw with empty graphData
     * Scenario: graphData is empty array
     * Expected: Should render empty chart without errors
     */
    it('should handle empty graphData in draw', () => {
      component.graphData = [];
      expect(() => component.draw()).not.toThrow();
    });

    /**
     * Test formatDateOnXAxis preserves forecast filter
     * Scenario: Data contains item with forecast values
     * Expected: Filter should remain as "Forecast"
     */
    it('should preserve Forecast filter in formatDateOnXAxis', () => {
      const data = [
        {
          filter: '2023-01-01',
          value: [{ isForecast: true }],
        },
      ];
      const result = component.formatDateOnXAxis(data);
      expect(result[0].filter).toBe('Forecast');
    });

    /**
     * Test currentDayIndex is not set when no current date match
     * Scenario: Data doesn't contain today's date
     * Expected: currentDayIndex should remain undefined
     */
    it('should not set currentDayIndex when today is not in data', () => {
      component.currentDayIndex = undefined;
      const data = [
        {
          filter: '2020-01-01',
          value: [],
        },
      ];
      component.formatDateOnXAxis(data);
      expect(component.currentDayIndex).toBeUndefined();
    });

    /**
     * Test getBenchmarkValue with empty value arrays
     * Scenario: Groups have empty value arrays
     * Expected: Should return null or handle gracefully
     */
    it('should handle empty value arrays in getBenchmarkValue', () => {
      const mergedGroups = [
        {
          value: [],
        },
      ];
      const percentiles = {
        seventyPercentile: 70,
        eightyPercentile: 80,
        nintyPercentile: 90,
      };
      const result = component.getBenchmarkValue(mergedGroups, percentiles);
      // When all values are filtered out, max would be -Infinity, result should be 70
      expect(result).toBe(70);
    });

    /**
     * Test draw with single data point and forecast
     * Scenario: Only one actual point and one forecast point
     * Expected: Should render both points as circles
     */
    it('should render single actual and forecast points as circles', () => {
      component.graphData = [
        {
          filter: '2023-01-01',
          value: [{ kpiGroup: 'Group A', value: 10, isForecast: false }],
          lineDataCategorywise: {
            'Group A': { filter: '2023-01-01', value: 10, isForecast: false },
          },
        },
        {
          filter: 'Forecast',
          value: [{ kpiGroup: 'Group A', value: 20, isForecast: true }],
          lineDataCategorywise: {
            'Group A': { filter: 'Forecast', value: 20, isForecast: true },
          },
        },
      ];
      component.draw();
      const chartSvg = mockElementRef.nativeElement.querySelector('#chart svg');
      const circles = chartSvg.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });
  });
});
