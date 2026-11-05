import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NavNewComponent } from './nav-new.component';
import { HttpService } from '../../services/http.service';
import { SharedService } from '../../services/shared.service';
import { MessageService } from 'primeng/api';
import { Router, Routes } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HelperService } from 'src/app/services/helper.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { APP_CONFIG, AppConfig } from '../../services/app.config';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardV2Component } from '../dashboard-v2/dashboard-v2.component';
import { FeatureFlagsService } from 'src/app/services/feature-toggle.service';

const mockHierarchyData = {
  kanban: [
    {
      id: '6442815917ed167d8157f0f5',
      level: 1,
      hierarchyLevelId: 'bu',
      hierarchyLevelName: 'BU',
      hierarchyInfo: 'Business Unit',
    },
    {
      id: '6442815917ed167d8157f0f6',
      level: 2,
      hierarchyLevelId: 'ver',
      hierarchyLevelName: 'Vertical',
      hierarchyInfo: 'Industry',
    },
    {
      id: '6442815917ed167d8157f0f7',
      level: 3,
      hierarchyLevelId: 'acc',
      hierarchyLevelName: 'Account',
      hierarchyInfo: 'Account',
    },
    {
      id: '6442815917ed167d8157f0f8',
      level: 4,
      hierarchyLevelId: 'port',
      hierarchyLevelName: 'Engagement',
      hierarchyInfo: 'Engagement',
    },
    {
      level: 5,
      hierarchyLevelId: 'project',
      hierarchyLevelName: 'Project',
    },
    {
      level: 6,
      hierarchyLevelId: 'release',
      hierarchyLevelName: 'Release',
    },
    {
      level: 7,
      hierarchyLevelId: 'sqd',
      hierarchyLevelName: 'Squad',
    },
  ],
  scrum: [
    {
      id: '6442815917ed167d8157f0f5',
      level: 1,
      hierarchyLevelId: 'bu',
      hierarchyLevelName: 'BU',
      hierarchyInfo: 'Business Unit',
    },
    {
      id: '6442815917ed167d8157f0f6',
      level: 2,
      hierarchyLevelId: 'ver',
      hierarchyLevelName: 'Vertical',
      hierarchyInfo: 'Industry',
    },
    {
      id: '6442815917ed167d8157f0f7',
      level: 3,
      hierarchyLevelId: 'acc',
      hierarchyLevelName: 'Account',
      hierarchyInfo: 'Account',
    },
    {
      id: '6442815917ed167d8157f0f8',
      level: 4,
      hierarchyLevelId: 'port',
      hierarchyLevelName: 'Engagement',
      hierarchyInfo: 'Engagement',
    },
    {
      level: 5,
      hierarchyLevelId: 'project',
      hierarchyLevelName: 'Project',
    },
    {
      level: 6,
      hierarchyLevelId: 'sprint',
      hierarchyLevelName: 'Sprint',
    },
    {
      level: 6,
      hierarchyLevelId: 'release',
      hierarchyLevelName: 'Release',
    },
    {
      level: 7,
      hierarchyLevelId: 'sqd',
      hierarchyLevelName: 'Squad',
    },
  ],
};
describe('NavNewComponent', () => {
  let component: NavNewComponent;
  let fixture: ComponentFixture<NavNewComponent>;
  let httpService: jasmine.SpyObj<HttpService>;
  let sharedService: SharedService;
  let messageService: jasmine.SpyObj<MessageService>;
  let router: jasmine.SpyObj<Router>;
  let helperService: jasmine.SpyObj<HelperService>;
  let featureFlagService: jasmine.SpyObj<FeatureFlagsService>;

  // const originalLocation = window.location;

  // const mockWindowLocationHash = (hash: string) => {
  //   const location = {
  //     ...window.location,
  //     hash,
  //   };
  //   spyOnProperty(window, 'location', 'get').and.returnValue(location);
  // };

  beforeEach(async () => {
    // const httpSpy = jasmine.createSpyObj('HttpService', ['getShowHideOnDashboardNewUI', 'getAllHierarchyLevels']);

    const messageSpy = jasmine.createSpyObj('MessageService', ['add']);
    const routerSpy = jasmine.createSpyObj('Router', [
      'navigate',
      'navigateByUrl',
      'createUrlTree',
      'serializeUrl',
      'parseUrl',
      'isActive',
      'events',
      'routerState',
      'triggerEvent',
    ]);
    routerSpy.url = '/dashboard/iteration';
    const helperSpy = jasmine.createSpyObj('HelperService', [
      'setBackupOfFilterSelectionState',
      'deepEqual',
    ]);
    const featureFlagSpy = jasmine.createSpyObj('FeatureFlagsService', [
      'isFeatureEnabled',
    ]);
    const routes: Routes = [
      { path: 'dashboard', component: DashboardV2Component },
    ];
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes(routes),
      ],
      declarations: [NavNewComponent],
      providers: [
        HttpService,
        SharedService,
        { provide: MessageService, useValue: messageSpy },
        { provide: APP_CONFIG, useValue: AppConfig },
        { provide: Router, useValue: routerSpy },
        { provide: HelperService, useValue: helperSpy },
        { provide: FeatureFlagsService, useValue: featureFlagSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavNewComponent);
    component = fixture.componentInstance;
    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    sharedService = TestBed.inject(
      SharedService,
    ) as jasmine.SpyObj<SharedService>;
    messageService = TestBed.inject(
      MessageService,
    ) as jasmine.SpyObj<MessageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    helperService = TestBed.inject(
      HelperService,
    ) as jasmine.SpyObj<HelperService>;
    featureFlagService = TestBed.inject(
      FeatureFlagsService,
    ) as jasmine.SpyObj<FeatureFlagsService>;

    // Set default mocks
    // spyOn(sharedService, 'getSelectedType').and.returnValue('scrum');
    // spyOn(sharedService, 'getSelectedTrends').and.returnValue([]);
    // spyOn(httpService, 'getShowHideOnDashboardNewUI').and.returnValue(of({ data: 'mock data' }));
    component.selectedType = 'scrum';
    component.dashConfigData = {
      scrum: [
        {
          boardName: 'Board 1',
          boardSlug: 'board-1',
          filters: {
            primaryFilter: { defaultLevel: { labelName: 'Project' } },
            parentFilter: { labelName: 'Engagement' },
          },
          kpis: [
            { kpiId: 'kpi1', shown: true },
            { kpiId: 'kpi2', shown: true },
          ],
        },
      ],
      others: [
        {
          boardName: 'Board 2',
          boardSlug: 'board-2',
          filters: {
            primaryFilter: { defaultLevel: { labelName: 'Project' } },
            parentFilter: { labelName: 'Engagement' },
          },
          kpis: [
            { kpiId: 'kpi3', shown: true },
            { kpiId: 'kpi4', shown: true },
          ],
        },
      ],
      configDetails: undefined,
    };

    featureFlagService.isFeatureEnabled.and.returnValue(Promise.resolve(true));
    component.homeTabFlag.next(true);
    component.pebFlag.next(true);
  });

  afterEach(() => {
    localStorage.clear();
    // spyOnProperty(window, 'location', 'get').and.returnValue(originalLocation);
    // sharedService.getSelectedType.calls.reset();
    // sharedService.getSelectedTrends.calls.reset();
    // sharedService.setScrumKanban.calls.reset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call setSelectedBoard if selectedTab is not "unauthorized access"', () => {
    const obj = { boardSlug: 'iteration' };
    spyOn(sharedService, 'setSelectedBoard');
    component.handleMenuTabFunctionality(obj);

    expect(sharedService.setSelectedBoard).toHaveBeenCalledWith('iteration');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/iteration']);
  });

  it('should not call setSelectedBoard if selectedTab is "unauthorized access"', () => {
    const obj = { boardSlug: 'unauthorized access' };
    spyOn(sharedService, 'setSelectedBoard');
    component.handleMenuTabFunctionality(obj);

    expect(sharedService.setSelectedBoard).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith([
      '/dashboard/unauthorized access',
    ]);
  });

  it('should call setBackupOfFilterSelectionState for specific tabs', () => {
    const obj = { boardSlug: 'iteration' };
    spyOn(sharedService, 'setBackupOfFilterSelectionState');
    component.handleMenuTabFunctionality(obj);

    expect(sharedService.setBackupOfFilterSelectionState).toHaveBeenCalledWith({
      additional_level: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/iteration']);
  });

  it('should call setBackupOfFilterSelectionState for release tab', () => {
    const obj = { boardSlug: 'release' };
    spyOn(sharedService, 'setBackupOfFilterSelectionState');
    component.handleMenuTabFunctionality(obj);

    expect(sharedService.setBackupOfFilterSelectionState).toHaveBeenCalledWith({
      additional_level: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/release']);
  });

  xit('should not call setBackupOfFilterSelectionState for other tabs', () => {
    const obj = { boardSlug: 'some-other-tab' };
    spyOn(sharedService, 'setBackupOfFilterSelectionState');
    component.handleMenuTabFunctionality(obj);

    expect(
      sharedService.setBackupOfFilterSelectionState,
    ).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/some-other-tab']);
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe all subscriptions', () => {
      const subscriptionMock = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      component.subscriptions = [subscriptionMock, subscriptionMock];

      component.ngOnDestroy();

      expect(subscriptionMock.unsubscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('getBoardConfig', () => {
    it('should call httpService and handle success response', (done) => {
      const responseMock = { success: true, data: { userBoardConfigDTO: {} } };
      spyOn(component, 'setBoards');
      spyOn(httpService, 'getShowHideOnDashboardNewUI').and.returnValue(
        of(responseMock),
      );

      // ngOnInit sets up the subscription that listens to projectListSubject
      component.ngOnInit();

      component.getBoardConfig(['proj1']);

      // Use setTimeout to allow the subscription to process
      setTimeout(() => {
        expect(httpService.getShowHideOnDashboardNewUI).toHaveBeenCalledWith({
          basicProjectConfigIds: ['proj1'],
        });
        expect(component.setBoards).toHaveBeenCalledWith(responseMock, true);
        done();
      }, 100);
    });

    it('should handle error and call MessageService.add when getShowHideOnDashboardNewUI fails', (done) => {
      // Simulate an error in the HTTP call
      spyOn(httpService, 'getShowHideOnDashboardNewUI').and.returnValue(
        throwError({ message: 'Error' }),
      );

      // ngOnInit sets up the subscription with error handling
      component.ngOnInit();

      // Call the function that triggers the HTTP call
      component.getBoardConfig([]);

      // Use setTimeout to allow the subscription to process the error
      setTimeout(() => {
        // Now, check that MessageService.add was called with the expected error object
        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Error',
        });
        done();
      }, 100);
    });
  });

  describe('setBoards', () => {
    beforeEach(() => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify({
          scrum: [
            { hierarchyLevelId: 'level1', hierarchyLevelName: 'Level 1' },
          ],
        }),
      );
      component.selectedType = 'scrum';
    });

    it('should set board data when localStorage has hierarchy data', () => {
      component.selectedType = 'scrum';
      const responseMock = {
        success: true,
        data: {
          userBoardConfigDTO: {
            scrum: [
              {
                boardName: 'Scrum Board',
                boardSlug: 'scrum-board',
                filters: {
                  primaryFilter: { defaultLevel: { labelName: 'level1' } },
                },
                kpis: [
                  { kpiId: 'kpi1', shown: true },
                  { kpiId: 'kpi2', shown: true },
                ],
              },
            ],
            others: [],
          },
        },
      };

      component.setBoards(responseMock);

      expect(component.items.length).toBe(1);
      expect(component.items[0].label).toBe('Scrum Board');
    });

    it('should call getAllHierarchyLevels when localStorage is empty', () => {
      localStorage.removeItem('completeHierarchyData');
      const responseMock = {
        success: true,
        data: { userBoardConfigDTO: { scrum: [], others: [] } },
      };
      const getAllHierarchyLevelsSpy = spyOn(
        httpService,
        'getAllHierarchyLevels',
      ).and.returnValue(of({ data: 'mockHierarchyData' }));

      component.setBoards(responseMock);

      expect(getAllHierarchyLevelsSpy).toHaveBeenCalled();
    });
  });

  describe('handleMenuTabFunctionality', () => {
    it('should navigate to the correct route and update selectedTab', () => {
      const mockObj = { boardSlug: 'iteration' };
      component.handleMenuTabFunctionality(mockObj);

      expect(component.selectedTab).toBe('iteration');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/iteration']);
    });

    it('should set backup filter selection state when tab is iteration', () => {
      const mockObj = { boardSlug: 'iteration' };
      spyOn(sharedService, 'setBackupOfFilterSelectionState');
      component.handleMenuTabFunctionality(mockObj);

      expect(
        component.sharedService.setBackupOfFilterSelectionState,
      ).toHaveBeenCalledWith({ additional_level: null });
    });
  });

  it('should set boards and items when response is successful', () => {
    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify(mockHierarchyData),
    );
    component.selectedType = 'scrum';
    const response = {
      success: true,
      data: {
        userBoardConfigDTO: {
          scrum: [
            {
              boardName: 'Board 1',
              boardSlug: 'board-1',
              filters: {
                primaryFilter: { defaultLevel: { labelName: 'project' } },
                parentFilter: { labelName: 'port' },
              },
              kpis: [
                { kpiId: 'kpi1', shown: true },
                { kpiId: 'kpi2', shown: true },
              ],
            },
          ],
          others: [
            {
              boardName: 'Board 2',
              boardSlug: 'board-2',
              filters: {
                primaryFilter: { defaultLevel: { labelName: 'project' } },
                parentFilter: { labelName: 'port' },
              },
              kpis: [
                { kpiId: 'kpi3', shown: true },
                { kpiId: 'kpi4', shown: true },
              ],
            },
          ],
          configDetails: {},
        },
      },
    };
    // let getAllHierarchyLevelsSpy = spyOn(component.httpService, 'getAllHierarchyLevels').and.returnValue(of({ data: [] }));

    component.setBoards(response);

    expect(component.dashConfigData).toEqual({
      scrum: [
        {
          boardName: 'Board 1',
          boardSlug: 'board-1',
          filters: {
            primaryFilter: { defaultLevel: { labelName: 'Project' } },
            parentFilter: { labelName: 'Engagement' },
          },
          kpis: [
            { kpiId: 'kpi1', shown: true },
            { kpiId: 'kpi2', shown: true },
          ],
        },
      ],
      others: [
        {
          boardName: 'Board 2',
          boardSlug: 'board-2',
          filters: {
            primaryFilter: { defaultLevel: { labelName: 'Project' } },
            parentFilter: { labelName: 'Engagement' },
          },
          kpis: [
            { kpiId: 'kpi3', shown: true },
            { kpiId: 'kpi4', shown: true },
          ],
        },
      ],
      configDetails: undefined,
    });
    // expect(component.items).toEqual([
    //   {
    //     label: 'Board 1',
    //     slug: 'board-1',
    //     command: jasmine.any(Function),
    //     disabled: false,
    //   },
    //   {
    //     label: 'Board 2',
    //     slug: 'board-2',
    //     command: jasmine.any(Function),
    //     disabled: false,
    //   },
    // ]);
  });

  it('should call getAllHierarchyLevels when completeHierarchyData is not available', () => {
    // localStorage.setItem('completeHierarchyData', JSON.stringify(mockHierarchyData));
    const response = {
      success: true,
      data: { userBoardConfigDTO: {}, configDetails: {} },
    };
    const getAllHierarchyLevelsSpy = spyOn(
      httpService,
      'getAllHierarchyLevels',
    ).and.returnValue(of({ data: [] }));

    component.setBoards(response);

    expect(getAllHierarchyLevelsSpy).toHaveBeenCalled();
  });

  describe('NavNewComponent.ngOnInit() ngOnInit method', () => {
    describe('Happy paths', () => {
      it('should initialize selectedType and set it in sharedService', () => {
        spyOn(sharedService, 'getSelectedType').and.returnValue('kanban');
        spyOn(sharedService, 'setScrumKanban').and.callFake(() => {});

        component.ngOnInit();

        expect(component.selectedType).toBe('kanban');
        expect(sharedService.setScrumKanban).toHaveBeenCalledWith('kanban');
      });

      it('should call getBoardConfig with selected trends', fakeAsync(() => {
        const trends = [{ basicProjectConfigId: '123' }];
        spyOn(sharedService, 'getSelectedTrends').and.returnValue(trends);
        spyOn<any>(component, 'getBoardConfig').and.callFake(() => {});

        component.ngOnInit();
        tick(); // Wait for setTimeout to execute

        expect(component['getBoardConfig']).toHaveBeenCalledWith(['123']);
      }));

      // it('should subscribe to onTabSwitch and update selectedTab', () => {
      //   const tabSwitchData = { selectedBoard: 'newTab' };
      //   spyOn(sharedService.onTabSwitch, 'subscribe').and.callFake((callback: ({ selectedBoard: string }) => void) => {
      //     callback(tabSwitchData);
      //     return { unsubscribe: jasmine.createSpy() };
      //   });

      //   component.ngOnInit();

      //   expect(component.selectedTab).toBe('newTab');
      // });
    });

    describe('Edge cases', () => {
      describe('Edge cases', () => {
        it('should handle empty selected trends gracefully', fakeAsync(() => {
          spyOn(sharedService, 'getSelectedTrends').and.returnValue([]);
          spyOn<any>(component, 'getBoardConfig').and.callFake(() => {});

          component.ngOnInit();
          tick(); // Wait for setTimeout to execute

          expect(component['getBoardConfig']).toHaveBeenCalledWith([]);
        }));

        it('should handle null selectedType and default to scrum', () => {
          spyOn(sharedService, 'getSelectedType').and.returnValue(null);
          spyOn(sharedService, 'setScrumKanban').and.callFake(() => {});

          component.ngOnInit();

          expect(component.selectedType).toBe('scrum');
          expect(sharedService.setScrumKanban).toHaveBeenCalledWith('scrum');
        });

        // it('should handle errors in getBoardConfig gracefully', () => {
        //   spyOn<any>(component, 'getBoardConfig').and.callFake(() => {
        //     throw new Error('Test error');
        //   });
        //   messageService.add.and.callFake(() => { });

        //   expect(() => component.ngOnInit()).not.toThrow();
        //   expect(messageService.add).toHaveBeenCalledWith({
        //     severity: 'error',
        //     summary: 'Test error',
        //   });
        // });
      });
    });
  });

  describe('Feature Flag Methods', () => {
    it('should call getHomeTabFeatureFlag and set homeTabFlag', async () => {
      featureFlagService.isFeatureEnabled.and.returnValue(
        Promise.resolve(true),
      );

      await component.getHomeTabFeatureFlag();

      expect(featureFlagService.isFeatureEnabled).toHaveBeenCalledWith(
        'HOME_TAB',
      );
      expect(component.homeTabFlag.value).toBe(true);
    });

    it('should call getPEBFeatureFlag and set pebFlag', async () => {
      featureFlagService.isFeatureEnabled.and.returnValue(
        Promise.resolve(false),
      );

      await component.getPEBFeatureFlag();

      expect(featureFlagService.isFeatureEnabled).toHaveBeenCalledWith('PEB');
      expect(component.pebFlag.value).toBe(false);
    });
  });

  describe('setBoards with feature flags', () => {
    it('should filter out home tab when homeTabFlag is false', () => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'scrum';
      component.homeTabFlag.next(false);
      component.pebFlag.next(true);

      const response = {
        success: true,
        data: {
          userBoardConfigDTO: {
            scrum: [
              {
                boardName: 'Home',
                boardSlug: 'home',
                filters: {
                  primaryFilter: { defaultLevel: { labelName: 'project' } },
                },
                kpis: [{ kpiId: 'kpi1', shown: true }],
              },
            ],
            others: [],
          },
        },
      };

      component.setBoards(response);

      expect(component.items.length).toBe(0);
    });

    it('should filter out PEB tab when pebFlag is false', () => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'scrum';
      component.homeTabFlag.next(true);
      component.pebFlag.next(false);

      const response = {
        success: true,
        data: {
          userBoardConfigDTO: {
            scrum: [
              {
                boardName: 'PEB',
                boardSlug: 'potential-economic-benefits',
                filters: {
                  primaryFilter: { defaultLevel: { labelName: 'project' } },
                },
                kpis: [{ kpiId: 'kpi1', shown: true }],
              },
            ],
            others: [],
          },
        },
      };

      component.setBoards(response);

      expect(component.items.length).toBe(0);
    });

    it('should disable PEB for kanban or when pebFlag is false', () => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'kanban';
      component.pebFlag.next(true);
      spyOn(sharedService, 'getSelectedType').and.returnValue('kanban');

      const response = {
        success: true,
        data: {
          userBoardConfigDTO: {
            kanban: [
              {
                boardName: 'PEB',
                boardSlug: 'potential-economic-benefits',
                filters: {
                  primaryFilter: { defaultLevel: { labelName: 'project' } },
                },
                kpis: [{ kpiId: 'kpi1', shown: true }],
              },
            ],
            others: [],
          },
        },
      };

      component.setBoards(response);

      expect(component.items[0].disabled).toBe(true);
    });
  });

  describe('getBoardConfig with projectListSubject', () => {
    it('should emit project list and call httpService via subscription', (done) => {
      const projectList = ['proj1', 'proj2'];
      const responseMock = { success: true, data: { userBoardConfigDTO: {} } };

      spyOn(httpService, 'getShowHideOnDashboardNewUI').and.returnValue(
        of(responseMock),
      );
      spyOn(component, 'setBoards');

      component.ngOnInit();

      component.getBoardConfig(projectList);

      setTimeout(() => {
        expect(httpService.getShowHideOnDashboardNewUI).toHaveBeenCalledWith({
          basicProjectConfigIds: projectList,
        });
        expect(component.setBoards).toHaveBeenCalledWith(responseMock, true);
        done();
      }, 100);
    });

    it('should handle empty project list in subscription', (done) => {
      const responseMock = { success: true, data: { userBoardConfigDTO: {} } };

      spyOn(httpService, 'getShowHideOnDashboardNewUI').and.returnValue(
        of(responseMock),
      );
      spyOn(component, 'setBoards');

      component.ngOnInit();

      component.getBoardConfig([]);

      setTimeout(() => {
        expect(httpService.getShowHideOnDashboardNewUI).toHaveBeenCalledWith({
          basicProjectConfigIds: [],
        });
        done();
      }, 100);
    });
  });

  describe('handleMenuTabFunctionality edge cases', () => {
    it('should handle missing boardSlug gracefully', () => {
      const obj = { value: { someOtherProperty: 'test' } };

      spyOn(sharedService, 'setSelectedBoard');
      spyOn(console, 'warn');

      component.handleMenuTabFunctionality(obj);

      expect(sharedService.setSelectedBoard).not.toHaveBeenCalled();
    });

    it('should navigate correctly when boardSlug is in nested value property', () => {
      const obj = { value: { boardSlug: 'backlog' } };

      spyOn(sharedService, 'setSelectedBoard');
      spyOn(sharedService, 'setBackupOfFilterSelectionState');

      component.handleMenuTabFunctionality(obj);

      expect(component.selectedTab).toBe('backlog');
      expect(sharedService.setSelectedBoard).toHaveBeenCalledWith('backlog');
      expect(
        sharedService.setBackupOfFilterSelectionState,
      ).toHaveBeenCalledWith({
        additional_level: null,
      });
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard/backlog']);
    });

    it('should set backup filter for dora tab', () => {
      const obj = { boardSlug: 'dora' };

      spyOn(sharedService, 'setBackupOfFilterSelectionState');

      component.handleMenuTabFunctionality(obj);

      expect(
        sharedService.setBackupOfFilterSelectionState,
      ).toHaveBeenCalledWith({
        additional_level: null,
      });
    });

    it('should set backup filter for kpi-maturity tab', () => {
      const obj = { boardSlug: 'kpi-maturity' };

      spyOn(sharedService, 'setBackupOfFilterSelectionState');

      component.handleMenuTabFunctionality(obj);

      expect(
        sharedService.setBackupOfFilterSelectionState,
      ).toHaveBeenCalledWith({
        additional_level: null,
      });
    });
  });

  describe('updateDataDirectly', () => {
    it('should call handleMenuTabFunctionality after timeout', (done) => {
      const searchQuery = { value: { boardSlug: 'iteration' } };

      spyOn(component, 'handleMenuTabFunctionality');

      component.updateDataDirectly(searchQuery);

      setTimeout(() => {
        expect(component.handleMenuTabFunctionality).toHaveBeenCalledWith(
          searchQuery.value,
        );
        done();
      }, 350);
    });
  });

  describe('setBoards with iteration board kpi121 filtering', () => {
    it('should filter out kpi121 from iteration board when selectedType is scrum', () => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'scrum';
      component.homeTabFlag.next(true);
      component.pebFlag.next(true);

      const response = {
        success: true,
        data: {
          userBoardConfigDTO: {
            scrum: [
              {
                boardName: 'Iteration',
                boardSlug: 'iteration',
                filters: {
                  primaryFilter: { defaultLevel: { labelName: 'project' } },
                },
                kpis: [
                  { kpiId: 'kpi121', shown: true },
                  { kpiId: 'kpi123', shown: true },
                ],
              },
            ],
            others: [],
          },
        },
      };

      component.setBoards(response);

      const iterationBoard = component.dashConfigData.scrum.find(
        (board) => board.boardSlug === 'iteration',
      );
      expect(iterationBoard.kpis.length).toBe(1);
      expect(iterationBoard.kpis[0].kpiId).toBe('kpi123');
    });
  });

  // ========================================
  // NEW TEST CASES FOR BUG FIXES
  // ========================================

  describe('Bug Fix: Nav bar tabs not appearing on first login', () => {
    describe('globalDashConfigData subscription', () => {
      it('should subscribe to globalDashConfigData and update tabs when data is emitted', (done) => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        spyOn(component, 'setBoards');

        const mockDashConfig = {
          scrum: [
            {
              boardName: 'Speed',
              boardSlug: 'speed',
              filters: {
                primaryFilter: { defaultLevel: { labelName: 'project' } },
              },
              kpis: [{ kpiId: 'kpi1', shown: true }],
            },
          ],
          others: [],
          configDetails: {},
        };

        component.ngOnInit();

        // Emit data via globalDashConfigData
        sharedService.globalDashConfigData.emit(mockDashConfig);

        setTimeout(() => {
          expect(component.setBoards).toHaveBeenCalledWith(
            {
              success: true,
              data: {
                userBoardConfigDTO: mockDashConfig,
                configDetails: mockDashConfig.configDetails,
              },
            },
            false,
          );
          done();
        }, 100);
      });

      it('should not call setBoards when globalDashConfigData emits empty data', (done) => {
        spyOn(component, 'setBoards');

        component.ngOnInit();

        // Emit empty data
        sharedService.globalDashConfigData.emit({});

        setTimeout(() => {
          expect(component.setBoards).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      it('should not call setBoards when globalDashConfigData emits null', (done) => {
        spyOn(component, 'setBoards');

        component.ngOnInit();

        // Emit null
        sharedService.globalDashConfigData.emit(null);

        setTimeout(() => {
          expect(component.setBoards).not.toHaveBeenCalled();
          done();
        }, 100);
      });
    });

    describe('Initial dashboard config check', () => {
      it('should render tabs immediately if dashboard config exists in shared service on ngOnInit', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';

        const existingConfig = {
          scrum: [
            {
              boardName: 'Iteration',
              boardSlug: 'iteration',
              filters: {
                primaryFilter: { defaultLevel: { labelName: 'project' } },
              },
              kpis: [{ kpiId: 'kpi1', shown: true }],
            },
          ],
          others: [],
          configDetails: {},
        };

        spyOn(sharedService, 'getDashConfigData').and.returnValue(
          existingConfig,
        );
        spyOn(component, 'setBoards');

        component.ngOnInit();

        expect(sharedService.getDashConfigData).toHaveBeenCalled();
        expect(component.setBoards).toHaveBeenCalledWith(
          {
            success: true,
            data: {
              userBoardConfigDTO: existingConfig,
              configDetails: existingConfig.configDetails,
            },
          },
          false,
        );
      });

      it('should trigger getBoardConfig if no existing dashboard config on ngOnInit', () => {
        spyOn(sharedService, 'getDashConfigData').and.returnValue(null);
        spyOn(component, 'getBoardConfig');

        component.ngOnInit();

        expect(component.getBoardConfig).toHaveBeenCalledWith([]);
      });

      it('should trigger getBoardConfig if existing config is empty object', () => {
        spyOn(sharedService, 'getDashConfigData').and.returnValue({});
        spyOn(component, 'getBoardConfig');

        component.ngOnInit();

        expect(component.getBoardConfig).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Bug Fix: Slingshot tab not appearing until tab switch', () => {
    describe('KPI filtering with null safety', () => {
      it('should include Slingshot tab when it has valid KPIs with shown: true', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        component.homeTabFlag.next(true);
        component.pebFlag.next(true);

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Slingshot',
                  boardSlug: 'slingshot',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [
                    { kpiId: 'kpi1', shown: true },
                    { kpiId: 'kpi2', shown: false },
                  ],
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.items.length).toBe(1);
        expect(component.items[0].slug).toBe('slingshot');
        expect(component.items[0].label).toBe('Slingshot');
      });

      it('should filter out boards with undefined kpis array', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Invalid Board',
                  boardSlug: 'invalid-board',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: undefined,
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.items.length).toBe(0);
      });

      it('should filter out boards with null kpis array', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Null KPIs Board',
                  boardSlug: 'null-kpis',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: null,
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.items.length).toBe(0);
      });

      it('should filter out boards with empty kpis array', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Empty KPIs Board',
                  boardSlug: 'empty-kpis',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [],
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.items.length).toBe(0);
      });

      it('should filter out boards where all KPIs have shown: false', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Hidden Board',
                  boardSlug: 'hidden-board',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [
                    { kpiId: 'kpi1', shown: false },
                    { kpiId: 'kpi2', shown: false },
                  ],
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.items.length).toBe(0);
      });

      it('should include multiple tabs including Slingshot when all have at least one shown KPI', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        component.homeTabFlag.next(true);
        component.pebFlag.next(true);

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Speed',
                  boardSlug: 'speed',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [{ kpiId: 'kpi1', shown: true }],
                },
                {
                  boardName: 'Slingshot',
                  boardSlug: 'slingshot',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [
                    { kpiId: 'kpi2', shown: true },
                    { kpiId: 'kpi3', shown: false },
                  ],
                },
              ],
              others: [
                {
                  boardName: 'Iteration',
                  boardSlug: 'iteration',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [{ kpiId: 'kpi4', shown: true }],
                },
              ],
            },
          },
        };

        component.setBoards(response);

        expect(component.items.length).toBe(3);
        const slugs = component.items.map((item) => item.slug);
        expect(slugs).toContain('speed');
        expect(slugs).toContain('slingshot');
        expect(slugs).toContain('iteration');
      });
    });

    describe('Active item fallback logic', () => {
      it('should set activeItem to first tab when selectedTab does not match any item', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        component.selectedTab = 'non-existent-tab';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Speed',
                  boardSlug: 'speed',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [{ kpiId: 'kpi1', shown: true }],
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.activeItem).toBeDefined();
        expect(component.activeItem.slug).toBe('speed');
        expect(component.selectedTab).toBe('speed');
      });

      it('should set activeItem correctly when selectedTab matches an item', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        component.selectedTab = 'slingshot';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Speed',
                  boardSlug: 'speed',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [{ kpiId: 'kpi1', shown: true }],
                },
                {
                  boardName: 'Slingshot',
                  boardSlug: 'slingshot',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [{ kpiId: 'kpi2', shown: true }],
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.activeItem).toBeDefined();
        expect(component.activeItem.slug).toBe('slingshot');
        expect(component.selectedTab).toBe('slingshot');
      });

      it('should not set activeItem when items array is empty', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        component.activeItem = null;

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.items).toBeUndefined();
        expect(component.activeItem).toBeNull();
      });

      it('should handle case-insensitive tab matching', () => {
        localStorage.setItem(
          'completeHierarchyData',
          JSON.stringify(mockHierarchyData),
        );
        component.selectedType = 'scrum';
        component.selectedTab = 'SLINGSHOT';

        const response = {
          success: true,
          data: {
            userBoardConfigDTO: {
              scrum: [
                {
                  boardName: 'Slingshot',
                  boardSlug: 'slingshot',
                  filters: {
                    primaryFilter: { defaultLevel: { labelName: 'project' } },
                  },
                  kpis: [{ kpiId: 'kpi1', shown: true }],
                },
              ],
              others: [],
            },
          },
        };

        component.setBoards(response);

        expect(component.activeItem).toBeDefined();
        expect(component.activeItem.slug).toBe('slingshot');
      });
    });
  });

  describe('Integration: First-time login scenario', () => {
    it('should render all tabs including Slingshot on first login with fresh session', (done) => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'scrum';
      component.homeTabFlag.next(true);
      component.pebFlag.next(true);

      const mockBoardConfig = {
        scrum: [
          {
            boardName: 'Home',
            boardSlug: 'home',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi1', shown: true }],
          },
          {
            boardName: 'My KnowHOW',
            boardSlug: 'my-knowhow',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi2', shown: true }],
          },
          {
            boardName: 'Speed',
            boardSlug: 'speed',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi3', shown: true }],
          },
          {
            boardName: 'Iteration',
            boardSlug: 'iteration',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi4', shown: true }],
          },
          {
            boardName: 'Slingshot',
            boardSlug: 'slingshot',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [
              { kpiId: 'kpi5', shown: true },
              { kpiId: 'kpi6', shown: true },
            ],
          },
        ],
        others: [],
        configDetails: {},
      };

      const responseMock = {
        success: true,
        data: { userBoardConfigDTO: mockBoardConfig },
      };

      // Mock getDashConfigData to return null (simulating fresh session)
      spyOn(sharedService, 'getDashConfigData').and.returnValue(null);
      spyOn(httpService, 'getShowHideOnDashboardNewUI').and.returnValue(
        of(responseMock),
      );

      component.ngOnInit();

      setTimeout(() => {
        expect(component.items).toBeDefined();
        expect(component.items.length).toBe(5);
        const slugs = component.items.map((item) => item.slug);
        expect(slugs).toContain('home');
        expect(slugs).toContain('my-knowhow');
        expect(slugs).toContain('speed');
        expect(slugs).toContain('iteration');
        expect(slugs).toContain('slingshot');
        done();
      }, 100);
    });

    it('should handle race condition where filter loads before nav component initializes', (done) => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'scrum';

      const mockDashConfig = {
        scrum: [
          {
            boardName: 'Slingshot',
            boardSlug: 'slingshot',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi1', shown: true }],
          },
        ],
        others: [],
        configDetails: {},
      };

      // Simulate dashboard config already in shared service
      spyOn(sharedService, 'getDashConfigData').and.returnValue(mockDashConfig);

      component.ngOnInit();

      setTimeout(() => {
        expect(component.items).toBeDefined();
        expect(component.items.length).toBe(1);
        expect(component.items[0].slug).toBe('slingshot');
        done();
      }, 100);
    });

    it('should show Slingshot tab when changing projects on Iteration board', (done) => {
      localStorage.setItem(
        'completeHierarchyData',
        JSON.stringify(mockHierarchyData),
      );
      component.selectedType = 'scrum';
      component.selectedTab = 'iteration';
      component.homeTabFlag.next(true);
      component.pebFlag.next(true);

      // Initial config without Slingshot
      const initialConfig = {
        scrum: [
          {
            boardName: 'Iteration',
            boardSlug: 'iteration',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi1', shown: true }],
          },
        ],
        others: [],
        configDetails: {},
      };

      // New config with Slingshot (simulating project change)
      const newConfigWithSlingshot = {
        scrum: [
          {
            boardName: 'Iteration',
            boardSlug: 'iteration',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [{ kpiId: 'kpi1', shown: true }],
          },
          {
            boardName: 'Slingshot',
            boardSlug: 'slingshot',
            filters: {
              primaryFilter: { defaultLevel: { labelName: 'project' } },
            },
            kpis: [
              { kpiId: 'kpi5', shown: true },
              { kpiId: 'kpi6', shown: true },
            ],
          },
        ],
        others: [],
        configDetails: {},
      };

      spyOn(sharedService, 'getDashConfigData').and.returnValue(initialConfig);
      helperService.deepEqual.and.returnValue(false);

      component.ngOnInit();

      setTimeout(() => {
        // Initially only Iteration tab
        expect(component.items).toBeDefined();
        expect(component.items.length).toBe(1);
        expect(component.items[0].slug).toBe('iteration');

        // Simulate project change by emitting new config via globalDashConfigData
        sharedService.globalDashConfigData.emit(newConfigWithSlingshot);

        setTimeout(() => {
          // After project change, both tabs should be visible
          expect(component.items).toBeDefined();
          expect(component.items.length).toBe(2);
          const slugs = component.items.map((item: any) => item.slug);
          expect(slugs).toContain('iteration');
          expect(slugs).toContain('slingshot');
          done();
        }, 100);
      }, 100);
    });
  });
});
