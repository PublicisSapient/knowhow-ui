import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionalInputV2Component } from './conditional-input-v2.component';

describe('ConditionalInputV2Component', () => {
  let component: ConditionalInputV2Component;
  let fixture: ComponentFixture<ConditionalInputV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConditionalInputV2Component],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalInputV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
