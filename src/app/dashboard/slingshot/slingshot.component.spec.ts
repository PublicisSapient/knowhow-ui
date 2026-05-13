import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlingshotComponent } from './slingshot.component';
import { SharedService } from '../../services/shared.service';

describe('SlingshotComponent', () => {
  let component: SlingshotComponent;
  let fixture: ComponentFixture<SlingshotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SlingshotComponent],
      providers: [
        {
          provide: SharedService,
          useValue: { getSelectedType: () => 'scrum' },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SlingshotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
