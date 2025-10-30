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
});
