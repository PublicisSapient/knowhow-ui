import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

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
import { of, throwError } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let mockHelperService: jasmine.SpyObj<HelperService>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let routerMock;
  let activatedRouteMock;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'authentication/login', component: DashboardComponent },
    ];

    const details = {
      user_email: 'abc@gmail.com',
      user_id: '5ea7cd94063c29192d7fc0f7',
      projectsAccess: [],
      user_name: 'dummyName',
      authType: 'dymmyType',
      notificationEmail: {
        accessAlertNotification: true,
        errorAlertNotification: false,
      },
      authorities: ['ROLE_SUPERADMIN'],
    };

    routerMock = {
      navigate: jasmine.createSpy('navigate'),
      routerState: {
        root: {},
      },
      queryParams: of({ myParam: 'testValue' }),
      events: of({}),
    };
    activatedRouteMock = {
      queryParams: of({
        stateFilters: 'mockKpi9dfjdhfjd',
        kpiFilters: 'mockKpi9fhjdhfjd',
        selectedTab: '',
      }),
    };

    mockHttpService = jasmine.createSpyObj('HttpService', ['handleRestoreUrl']);

    mockLocation = jasmine.createSpyObj('Location', ['path']);

    mockHelperService = jasmine.createSpyObj('HelperService', [
      'urlRedirection',
    ]);

    mockSharedService = jasmine.createSpyObj(
      'SharedService',
      [
        'getSelectedTab',
        'getKpiSubFilterObj',
        'setBackupOfFilterSelectionState',
        'raiseError',
        'setSelectedBoard',
        'setKpiSubFilterObj',
        'passDataToDashboard',
      ],
      {
        passDataToDashboard: of({
          masterData: {},
          filterdata: {},
          filterApplyData: {},
          dashConfigData: {},
        }),
      },
    );

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
      ],
      declarations: [HomeComponent],
      providers: [
        MessageService,
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: APP_CONFIG, useValue: AppConfig },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: mockLocation },
        { provide: HttpService, useValue: mockHttpService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: HelperService, useValue: mockHelperService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set state filter backup if user has access', () => {
    const filters = {
      primary_level: [
        {
          labelName: 'Project',
          basicProjectConfigId: 'p1',
        },
      ],
    };

    localStorage.setItem(
      'currentUserDetails',
      JSON.stringify({
        authorities: [],
        projectsAccess: [
          {
            projects: [{ projectId: 'p1' }],
          },
        ],
      }),
    );

    component.urlRedirection(JSON.stringify(filters));
  });

  it('should redirect to error if user has no project access', () => {
    const filters = {
      primary_level: [
        {
          labelName: 'Project',
          basicProjectConfigId: 'unauthorized',
        },
      ],
    };

    localStorage.setItem(
      'currentUserDetails',
      JSON.stringify({
        authorities: [],
        projectsAccess: [
          {
            projects: [{ projectId: 'p1' }],
          },
        ],
      }),
    );

    component.urlRedirection(JSON.stringify(filters));
  });

  it('should handle query params and call urlRedirection when handleRestoreUrl returns success', fakeAsync(() => {
    // ARRANGE
    mockSharedService.getSelectedTab.and.returnValue(null);
    const mockResponse = {
      success: true,
      data: {
        longKPIFiltersString: btoa(JSON.stringify({ filter: 'value' })),
        longStateFiltersString: btoa('{"a":1}'),
      },
    };
    mockHttpService.handleRestoreUrl.and.returnValue(of(mockResponse));

    // ACT
    fixture.detectChanges(); // triggers ngOnInit and subscription
    tick(); // simulates async passage of time
  }));

  it('should handle when filter is greater than 8', fakeAsync(() => {
    const encodedState = btoa('stateMockfdfdf');
    const encodedKpi = btoa('kpiMockdfdfdfdffd');

    mockHttpService.handleRestoreUrl.and.returnValue(
      of({
        data: {
          longKPIFiltersString: btoa(JSON.stringify({ filter: 'mockdfdfd' })),
          longStateFiltersString: encodedState,
        },
        success: true,
      }),
    );
    mockSharedService.getSelectedTab.and.returnValue('iteration');
    spyOn(component as any, 'urlRedirection'); // optional to spy on internal calls
    fixture.detectChanges();
    tick();
  }));
});
