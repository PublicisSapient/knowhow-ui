import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndicatorsComponent } from './indicators.component';

describe('IndicatorsComponent', () => {
  let component: IndicatorsComponent;
  let fixture: ComponentFixture<IndicatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndicatorsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.title).toBe('Mean Time to Merge');
    expect(component.icon).toBe('pi-clock');
    expect(component.metricValue).toBe(2.4);
    expect(component.metricUnit).toBe('days');
    expect(component.trendValue).toBe(-12);
    expect(component.trendLabel).toBe('from last month');
    expect(component.iconColor).toBe('#0d6efd');
  });

  describe('isPositiveTrend', () => {
    it('should return true for positive trend value', () => {
      component.trendValue = 10;
      expect(component.isPositiveTrend).toBe(true);
    });

    it('should return true for zero trend value', () => {
      component.trendValue = 0;
      expect(component.isPositiveTrend).toBe(true);
    });

    it('should return false for negative trend value', () => {
      component.trendValue = -10;
      expect(component.isPositiveTrend).toBe(false);
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
    it('should return success for positive trend', () => {
      component.trendValue = 10;
      expect(component.trendSeverity).toBe('success');
    });

    it('should return danger for negative trend', () => {
      component.trendValue = -10;
      expect(component.trendSeverity).toBe('danger');
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
});
