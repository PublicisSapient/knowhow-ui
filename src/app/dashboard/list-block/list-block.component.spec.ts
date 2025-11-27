import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListBlockComponent, MetricItem } from './list-block.component';

describe('ListBlockComponent', () => {
  let component: ListBlockComponent;
  let fixture: ComponentFixture<ListBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty metrics array by default', () => {
    expect(component.data).toEqual([]);
  });

  it('should have neutral trend by default', () => {
    expect(component.trend).toBe('neutral');
  });

  it('should accept dateFilter input', () => {
    component.dateFilter = 'Last Month';
    expect(component.dateFilter).toBe('Last Month');
  });

  it('should accept data input', () => {
    const data: MetricItem[] = [
      { label: 'Total', value: 100, trend: 'positive' },
    ];
    component.data = data;
    expect(component.data).toEqual(data);
  });

  it('should accept trend input', () => {
    component.trend = 'positive';
    expect(component.trend).toBe('positive');
  });
});
