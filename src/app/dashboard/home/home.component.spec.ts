import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeComponent } from './home.component';
import { SharedService } from '../../services/shared.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard.component';
import { HttpService } from 'src/app/services/http.service';
import { HelperService } from 'src/app/services/helper.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { APP_CONFIG, AppConfig } from 'src/app/services/app.config';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let service: SharedService;
  let http: HttpService;
  let helper: HelperService;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'authentication/login', component: DashboardComponent },
    ];
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
      ],
      declarations: [HomeComponent],
      providers: [
        SharedService,
        HttpService,
        HelperService,
        MessageService,
        { provide: APP_CONFIG, useValue: AppConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
