import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiAiRecommendationTargetComponent } from './kpi-ai-recommendation-target.component';

describe('KpiAiRecommendationTargetComponent', () => {
  let component: KpiAiRecommendationTargetComponent;
  let fixture: ComponentFixture<KpiAiRecommendationTargetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KpiAiRecommendationTargetComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KpiAiRecommendationTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit viewPlanClick when action link is clicked', () => {
    spyOn(component.viewPlanClick, 'emit');
    component.onViewPlanClick();
    expect(component.viewPlanClick.emit).toHaveBeenCalled();
  });
});
