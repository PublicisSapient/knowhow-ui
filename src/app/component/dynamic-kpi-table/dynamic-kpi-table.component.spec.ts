import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicKpiTableComponent } from './dynamic-kpi-table.component';

describe('DynamicKpiTableComponent', () => {
  let component: DynamicKpiTableComponent;
  let fixture: ComponentFixture<DynamicKpiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicKpiTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicKpiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
