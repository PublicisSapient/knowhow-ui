import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChanges } from '@angular/core';
import { NbaComponent } from './nba.component';

describe('NbaComponent', () => {
  let component: NbaComponent;
  let fixture: ComponentFixture<NbaComponent>;

  const mockRawData = [
    {
      nodeId: '1',
      nodeName: 'Test Node',
      recommendations: {
        recommendationType: 'High',
        observation: 'Test Observation',
        recommendationDetails: 'Test Details',
        saving: '$1000',
        keyPerformanceIndicator: ['KPI1', 'KPI2'],
        recommendedActionPlan: {
          actionPlan: [
            { step: 1, title: 'Step 1', description: 'Description 1' },
          ],
        },
        timeToVale: '2 weeks',
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NbaComponent],
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
      rawData: mockRawData[0].recommendations,
    };

    component.openProjectDetailsPopup(mockItem);

    expect(component.displayModal).toBeTrue();
    expect(component.selectedRecommendation.title).toBe('Test Title');
    expect(component.selectedRecommendation.nodeName).toBe('Test Category');
    expect(component.selectedRecommendation.infoBoxes.length).toBe(3);
    expect(component.selectedRecommendation.infoBoxes[0].label).toBe(
      'Projected Benefit',
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
