import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PebCalculatorComponent } from './peb-calculator.component';

describe('PebCalculatorComponent', () => {
  let component: PebCalculatorComponent;
  let fixture: ComponentFixture<PebCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PebCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PebCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
