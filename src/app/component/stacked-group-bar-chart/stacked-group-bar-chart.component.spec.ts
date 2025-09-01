import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackedGroupBarChartComponent } from './stacked-group-bar-chart.component';

describe('StackedGroupBarChartComponent', () => {
  let component: StackedGroupBarChartComponent;
  let fixture: ComponentFixture<StackedGroupBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StackedGroupBarChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StackedGroupBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
