import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { KpiAiRecommendationTargetComponent } from './kpi-ai-recommendation-target.component';

describe('KpiAiRecommendationTargetComponent', () => {
  let component: KpiAiRecommendationTargetComponent;
  let fixture: ComponentFixture<KpiAiRecommendationTargetComponent>;
  let httpService: jasmine.SpyObj<HttpService>;

  beforeEach(async () => {
    const httpSpy = jasmine.createSpyObj('HttpService', [
      'getkpiAITargetRecommData',
    ]);

    await TestBed.configureTestingModule({
      imports: [KpiAiRecommendationTargetComponent],
      providers: [{ provide: HttpService, useValue: httpSpy }],
    }).compileComponents();

    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiAiRecommendationTargetComponent);
    component = fixture.componentInstance;
    component.kpiData = { kpiDetail: { kpiName: 'Test KPI' } };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set displayAiRecommModal to true when onViewPlanClick is called', () => {
    component.onViewPlanClick();
    expect(component.displayAiRecommModal).toBe(true);
  });

  it('should update aiRecommendationData on successful fetchData', () => {
    const mockData = { success: true, data: {} };
    httpService.getkpiAITargetRecommData.and.returnValue(of(mockData));

    component.fetchData();

    expect(component.aiRecommendationData).toBeDefined();
  });
});
