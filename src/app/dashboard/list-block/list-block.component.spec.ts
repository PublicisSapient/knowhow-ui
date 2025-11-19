import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListBlockComponent, MetricItem } from './list-block.component';

describe('ListBlockComponent', () => {
  let component: ListBlockComponent;
  let fixture: ComponentFixture<ListBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('This Month');
  });

  it('should have empty metrics array by default', () => {
    expect(component.metrics).toEqual([]);
  });

  it('should have neutral trend by default', () => {
    expect(component.trend).toBe('neutral');
  });

  it('should accept title input', () => {
    component.title = 'Last Month';
    expect(component.title).toBe('Last Month');
  });

  it('should accept metrics input', () => {
    const metrics: MetricItem[] = [
      { label: 'Total', value: 100, trend: 'positive' },
    ];
    component.metrics = metrics;
    expect(component.metrics).toEqual(metrics);
  });

  it('should accept trend input', () => {
    component.trend = 'positive';
    expect(component.trend).toBe('positive');
  });
});
