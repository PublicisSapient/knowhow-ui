import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndicatorsComponent } from './indicators.component';

describe('IndicatorsComponent', () => {
  let component: IndicatorsComponent;
  let fixture: ComponentFixture<IndicatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicatorsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isUpwardTrend', () => {
    it('should return true for positive trend value', () => {
      component.trendValue = 10;
      expect(component.isUpwardTrend).toBe(true);
    });

    it('should return true for zero trend value', () => {
      component.trendValue = 0;
      expect(component.isUpwardTrend).toBe(true);
    });

    it('should return false for negative trend value', () => {
      component.trendValue = -10;
      expect(component.isUpwardTrend).toBe(false);
    });
  });

  describe('trendIcon', () => {
    it('should return arrow-up for positive trend', () => {
      component.trendValue = 10;
      expect(component.trendIcon).toBe('pi-arrow-up');
    });

    it('should return arrow-down for negative trend', () => {
      component.trendValue = -10;
      expect(component.trendIcon).toBe('pi-arrow-down');
    });
  });

  describe('trendSeverity', () => {
    it('should return success for positive trend when upwardIsPositive is true', () => {
      component.trendValue = 10;
      component.kpiData = { kpiDetail: { isPositiveTrend: true } };
      expect(component.trendSeverity).toBe('success');
    });

    it('should return danger for negative trend when upwardIsPositive is true', () => {
      component.trendValue = -10;
      component.kpiData = { kpiDetail: { isPositiveTrend: true } };
      expect(component.trendSeverity).toBe('danger');
    });

    it('should return danger for positive trend when upwardIsPositive is false', () => {
      component.trendValue = 10;
      component.kpiData = { kpiDetail: { isPositiveTrend: false } };
      expect(component.trendSeverity).toBe('danger');
    });

    it('should return success for negative trend when upwardIsPositive is false', () => {
      component.trendValue = -10;
      component.kpiData = { kpiDetail: { isPositiveTrend: false } };
      expect(component.trendSeverity).toBe('success');
    });

    it('should return success for positive trend when kpiData is missing (default true)', () => {
      component.trendValue = 10;
      component.kpiData = undefined;
      expect(component.trendSeverity).toBe('success');
    });
  });

  describe('absoluteTrendValue', () => {
    it('should return absolute value for positive number', () => {
      component.trendValue = 15;
      expect(component.absoluteTrendValue).toBe(15);
    });

    it('should return absolute value for negative number', () => {
      component.trendValue = -15;
      expect(component.absoluteTrendValue).toBe(15);
    });

    it('should return zero for zero', () => {
      component.trendValue = 0;
      expect(component.absoluteTrendValue).toBe(0);
    });
  });

  describe('roundToTwoDecimals', () => {
    it('should round to two decimal places', () => {
      expect(component['roundToTwoDecimals'](3.14159)).toBe(3.14);
      expect(component['roundToTwoDecimals'](2.999)).toBe(3);
    });

    it('should handle whole numbers', () => {
      expect(component['roundToTwoDecimals'](5)).toBe(5);
    });

    it('should handle zero', () => {
      expect(component['roundToTwoDecimals'](0)).toBe(0);
    });
  });

  describe('roundedMetricValue', () => {
    it('should return rounded metric value', () => {
      component.metricValue = 3.14159;
      expect(component.roundedMetricValue).toBe(3.14);
    });

    it('should handle undefined metric value', () => {
      component.metricValue = undefined;
      expect(component.roundedMetricValue).toBeNaN();
    });
  });

  describe('roundedTrendValue', () => {
    it('should return rounded absolute trend value', () => {
      component.trendValue = -3.14159;
      expect(component.roundedTrendValue).toBe(3.14);
    });

    it('should return rounded positive trend value', () => {
      component.trendValue = 2.999;
      expect(component.roundedTrendValue).toBe(3);
    });

    it('should handle zero trend value', () => {
      component.trendValue = 0;
      expect(component.roundedTrendValue).toBe(0);
    });
  });
});
