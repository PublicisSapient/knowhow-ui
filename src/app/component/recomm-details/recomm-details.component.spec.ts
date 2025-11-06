import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommDetailsComponent } from './recomm-details.component';

describe('RecommDetailsComponent', () => {
  let component: RecommDetailsComponent;
  let fixture: ComponentFixture<RecommDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.infoBoxes).toEqual([]);
    expect(component.kpis).toEqual([]);
    expect(component.actionPlan).toEqual([]);
    expect(component.showAiRationale).toBeFalse();
    expect(component.aiRationaleTitle).toBe('AI Rationale');
    expect(component.showSupportingData).toBeFalse();
    expect(component.supportingDataTitle).toBe('Supporting Data Trends');
    expect(component.kpiSectionTitle).toBe(
      'Affected Key Performance Indicators',
    );
    expect(component.actionPlanTitle).toBe('Recommended Action Plan');
  });

  it('should accept infoBoxes input', () => {
    const mockInfoBoxes = [
      { label: 'Benefit', value: '$1000', color: 'green' },
      { label: 'Implementation', value: 'Medium', color: 'blue' },
    ];

    component.infoBoxes = mockInfoBoxes;

    expect(component.infoBoxes).toEqual(mockInfoBoxes);
  });

  it('should accept kpis input', () => {
    const mockKpis = ['Performance', 'Quality', 'Speed'];

    component.kpis = mockKpis;

    expect(component.kpis).toEqual(mockKpis);
  });

  it('should accept actionPlan input', () => {
    const mockActionPlan = [
      { step: 1, title: 'Plan', description: 'Planning phase' },
      { step: 2, title: 'Execute', description: 'Execution phase' },
    ];

    component.actionPlan = mockActionPlan;

    expect(component.actionPlan).toEqual(mockActionPlan);
  });

  it('should handle AI rationale section inputs', () => {
    component.showAiRationale = true;
    component.aiRationaleTitle = 'Custom AI Title';
    component.aiRationaleDescription = 'Custom description';

    expect(component.showAiRationale).toBeTrue();
    expect(component.aiRationaleTitle).toBe('Custom AI Title');
    expect(component.aiRationaleDescription).toBe('Custom description');
  });

  it('should handle supporting data section inputs', () => {
    const mockDataList = ['Data point 1', 'Data point 2'];

    component.showSupportingData = true;
    component.supportingDataTitle = 'Custom Data Title';
    component.supportingDataList = mockDataList;

    expect(component.showSupportingData).toBeTrue();
    expect(component.supportingDataTitle).toBe('Custom Data Title');
    expect(component.supportingDataList).toEqual(mockDataList);
  });

  it('should handle KPI section customization', () => {
    component.kpiSectionTitle = 'Custom KPI Title';
    component.kpiSectionIcon = '📊';

    expect(component.kpiSectionTitle).toBe('Custom KPI Title');
    expect(component.kpiSectionIcon).toBe('📊');
  });

  it('should handle action plan section customization', () => {
    component.actionPlanTitle = 'Custom Action Title';
    component.actionPlanIcon = '⚡';

    expect(component.actionPlanTitle).toBe('Custom Action Title');
    expect(component.actionPlanIcon).toBe('⚡');
  });

  describe('Backward compatibility setters', () => {
    beforeEach(() => {
      component.infoBoxes = [
        { label: 'Benefit', value: '', color: 'green' },
        { label: 'Implementation', value: '', color: 'blue' },
        { label: 'Time', value: '', color: 'purple' },
      ];
    });

    it('should set benefit value using setter', () => {
      component.benefit = '$5000';

      expect(component.infoBoxes[0].value).toBe('$5000');
    });

    it('should set implementation value using setter', () => {
      component.implementation = 'High';

      expect(component.infoBoxes[1].value).toBe('High');
    });

    it('should set timeToValue using setter', () => {
      component.timeToValue = '6 months';

      expect(component.infoBoxes[2].value).toBe('6 months');
    });

    it('should handle setters when infoBoxes array is empty', () => {
      component.infoBoxes = [];

      expect(() => {
        component.benefit = '$1000';
        component.implementation = 'Medium';
        component.timeToValue = '3 months';
      }).not.toThrow();
    });

    it('should handle setters when specific index does not exist', () => {
      component.infoBoxes = [{ label: 'Only one', value: '', color: 'green' }];

      expect(() => {
        component.implementation = 'Medium';
        component.timeToValue = '3 months';
      }).not.toThrow();
    });
  });

  it('should handle all inputs together', () => {
    const mockData = {
      infoBoxes: [{ label: 'Test', value: 'Value', color: 'red' }],
      kpis: ['KPI1', 'KPI2'],
      actionPlan: [{ step: 1, title: 'Test', description: 'Desc' }],
      showAiRationale: true,
      aiRationaleTitle: 'AI Test',
      showSupportingData: true,
      supportingDataList: ['Data1'],
    };

    Object.assign(component, mockData);

    expect(component.infoBoxes).toEqual(mockData.infoBoxes);
    expect(component.kpis).toEqual(mockData.kpis);
    expect(component.actionPlan).toEqual(mockData.actionPlan);
    expect(component.showAiRationale).toBeTrue();
    expect(component.showSupportingData).toBeTrue();
  });
});
