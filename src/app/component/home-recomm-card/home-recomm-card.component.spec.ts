import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeRecommCardComponent } from './home-recomm-card.component';

describe('HomeRecommCardComponent', () => {
  let component: HomeRecommCardComponent;
  let fixture: ComponentFixture<HomeRecommCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeRecommCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeRecommCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
