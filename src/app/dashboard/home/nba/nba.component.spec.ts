import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MetricsService } from 'src/app/services/metrics.service';
import { NbaComponent } from './nba.component';

describe('NbaComponent', () => {
  let component: NbaComponent;
  let fixture: ComponentFixture<NbaComponent>;

  const mockRawData = [
    {
      projectId: '1',
      projectName: 'Test Project',
      recommendations: {
        severity: 'High',
        title: 'Test Observation',
        description: 'Test Details',
        saving: '$1000',
        keyPerformanceIndicator: ['KPI1', 'KPI2'],
        actionPlans: [{ title: 'Step 1', description: 'Description 1' }],
        timeToValue: '2 weeks',
      },
    },
  ];

  beforeEach(async () => {
    const metricsSpy = jasmine.createSpyObj('MetricsService', ['trackRecommendedActionClick']);

    await TestBed.configureTestingModule({
      imports: [NbaComponent, HttpClientTestingModule],
      providers: [{ provide: MetricsService, useValue: metricsSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NbaComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.displayModal).toBeFalse();
    expect(component.selectedRecommendation).toEqual({});
    expect(component.recommendations).toEqual([]);
    expect(component.rawData).toEqual([]);
  });

  it('should prepare recommendation cards on rawData change', () => {
    component.rawData = mockRawData;
    const changes: SimpleChanges = {
      rawData: {
        currentValue: mockRawData,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    component.ngOnChanges(changes);

    expect(component.recommendations.length).toBe(1);
    expect(component.recommendations[0].priority).toBe('High');
    expect(component.recommendations[0].title).toBe('Test Observation');
  });

  it('should not process changes if rawData is not changed', () => {
    spyOn(component as any, 'prepareRecommCards');
    const changes: SimpleChanges = {
      otherProperty: {
        currentValue: 'new',
        previousValue: 'old',
        firstChange: false,
        isFirstChange: () => false,
      },
    };

    component.ngOnChanges(changes);

    expect((component as any).prepareRecommCards).not.toHaveBeenCalled();
  });

  it('should open project details popup with correct data', () => {
    const mockItem = {
      title: 'Test Title',
      category: 'Test Category',
      rawData: {
        severity: 'High',
        timeToValue: '2 weeks',
        keyPerformanceIndicator: ['KPI1', 'KPI2'],
        actionPlans: [{ title: 'Step 1', description: 'Description 1' }],
      },
    };

    component.openProjectDetailsPopup(mockItem);

    expect(component.displayModal).toBeTrue();
    expect(component.selectedRecommendation.title).toBe('Test Title');
    expect(component.selectedRecommendation.nodeName).toBe('Test Category');
    expect(component.selectedRecommendation.infoBoxes.length).toBe(2);
    expect(component.selectedRecommendation.infoBoxes[0].label).toBe(
      'Implementation',
    );
  });

  it('should handle empty rawData', () => {
    component.rawData = [];
    const changes: SimpleChanges = {
      rawData: {
        currentValue: [],
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    component.ngOnChanges(changes);

    expect(component.recommendations).toEqual([]);
  });

  it('should handle null rawData', () => {
    component.rawData = null as any;
    const changes: SimpleChanges = {
      rawData: {
        currentValue: null,
        previousValue: [],
        firstChange: false,
        isFirstChange: () => false,
      },
    };

    component.ngOnChanges(changes);

    expect(component.recommendations).toEqual([]);
  });
});
