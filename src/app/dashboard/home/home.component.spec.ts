import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
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
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeatureFlagsService } from 'src/app/services/feature-toggle.service';

@Component({
  selector: 'app-maturity',
  template: '',
})
class MockMaturityComponent {
  receiveSharedData = jasmine.createSpy('receiveSharedData');
}

@Component({
  selector: 'app-nba',
  template: '',
})
class MockNbaComponent {
  rawData: any;
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockSharedService: jasmine.SpyObj<SharedService>;
  let mockHelperService: jasmine.SpyObj<HelperService>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockHttpService: jasmine.SpyObj<HttpService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockFeatureFlagsService: jasmine.SpyObj<any>;
  let routerMock;
  let activatedRouteMock;

  beforeEach(async () => {
    const routes: Routes = [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'authentication/login', component: DashboardComponent },
    ];

    routerMock = {
      navigate: jasmine.createSpy('navigate'),
      routerState: { root: {} },
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

    mockHttpService = jasmine.createSpyObj('HttpService', [
      'handleRestoreUrl',
      'getPebProductivityData',
      'getHomeNBAData',
      'getExecutiveBoardData',
      'getFeatureFlags',
    ]);

    mockHttpService.getPebProductivityData.and.returnValue(
      of({
        message: 'Productivity data was successfully retrieved',
        success: true,
        data: {
          summary: {
            levelName: 'Test Level',
            categoryScores: {
              overall: 85.5,
              speed: 80.0,
              quality: 90.0,
              efficiency: 88.0,
              productivity: 85.5,
            },
            trends: { positive: [], negative: [] },
          },
          details: [],
        },
      }),
    );

    mockHttpService.getHomeNBAData.and.returnValue(
      of({ message: 'No data found', success: true, data: [] }),
    );

    mockHttpService.getExecutiveBoardData.and.returnValue(
      of({
        message: 'Success',
        success: true,
        data: {
          matrix: {
            rows: [
              {
                id: 'r1',
                name: 'Test Row',
                completion: '80%',
                health: 'healthy',
                boardMaturity: {
                  dora: 'M3',
                  value: 'M3',
                  speed: 'M3',
                  quality: 'M3',
                },
              },
            ],
            columns: [
              { field: 'id', header: 'ID' },
              { field: 'name', header: 'Name' },
            ],
          },
        },
      }),
    );

    mockLocation = jasmine.createSpyObj('Location', ['path', 'getState']);

    mockHelperService = jasmine.createSpyObj('HelperService', [
      'urlRedirection',
      'fetchPEBaData',
    ]);

    mockHelperService.fetchPEBaData.and.returnValue(
      of({
        message: 'Productivity data was successfully retrieved',
        success: true,
        data: {
          summary: {
            trends: { positive: [], negative: [] },
            levelName: 'Test Level',
            categoryScores: {
              overall: 85.5,
              speed: 80.0,
              quality: 90.0,
              efficiency: 88.0,
              productivity: 85.5,
            },
          },
          details: [],
        },
      }),
    );

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
        'getFilterData',
        'setPEBData',
        'getSelectedType',
        'setPEBDataCache',
        'getPEBDataCache',
        'clearPEBDataCache',
      ],
      {
        passDataToDashboard: of({
          masterData: {},
          filterData: {},
          filterApplyData: {
            level: 1,
            label: 'project',
            selectedMap: { date: ['2023-01-01'] },
            ids: ['123'],
          },
          dashConfigData: {},
        }),
        pebData$: of({ summary: { trends: { positive: [], negative: [] } } }),
      },
    );

    mockSharedService.getSelectedType.and.returnValue('kanban');
    mockSharedService.getFilterData.and.returnValue([]);
    mockSharedService.getPEBDataCache.and.returnValue(null);
    mockSharedService.setPEBDataCache.and.stub();
    mockSharedService.clearPEBDataCache.and.stub();

    mockMessageService = jasmine.createSpyObj('MessageService', ['add']);

    mockFeatureFlagsService = jasmine.createSpyObj('FeatureFlagsService', [
      'isFeatureEnabled',
    ]);
    mockFeatureFlagsService.isFeatureEnabled.and.returnValue(
      Promise.resolve(false),
    );

    mockHttpService.getFeatureFlags.and.returnValue(
      Promise.resolve([{ name: 'RECOMMENDATION_ACTION_PLAN', enabled: false }]),
    );

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [HomeComponent, MockMaturityComponent, MockNbaComponent],
      providers: [
        { provide: MessageService, useValue: mockMessageService },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: APP_CONFIG, useValue: AppConfig },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: mockLocation },
        { provide: HttpService, useValue: mockHttpService },
        { provide: SharedService, useValue: mockSharedService },
        { provide: HelperService, useValue: mockHelperService },
        { provide: FeatureFlagsService, useValue: mockFeatureFlagsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    // Initialize component properties to avoid undefined errors
    component.completeHierarchyData = [
      {
        level: 1,
        hierarchyLevelName: 'Test Level',
        hierarchyLevelId: 'project',
      },
    ];
    component.filterApplyData = {
      level: 1,
      label: 'project',
      selectedMap: { date: ['2023-01-01'] },
      ids: ['123'],
    };
    component.selectedType = 'kanban';
    component.productivityData = {};
    component.tableData = { columns: [], data: [] };
    component.aggregrationDataList = [];
    component.bottomTilesData.set([]);
    component.productivityExpandRowDataLoader = false;
    component.BottomTilesLoader = false;
    component.calculatorDataLoader = true;
    component.nestedLoader = false;

    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (key === 'completeHierarchyData') {
        return JSON.stringify({
          kanban: [
            {
              level: 1,
              hierarchyLevelName: 'Test Level',
              hierarchyLevelId: 'project',
            },
          ],
        });
      }
      return null;
    });
    spyOn(localStorage, 'setItem');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct efficiency percentage', () => {
    component.tableData.data = [
      { completion: '80' },
      { completion: '100' },
      { completion: '60' },
    ];
    expect(component.calculateEfficiency()).toBe('80%');
  });

  it('should return 0% efficiency if no data', () => {
    component.tableData.data = [];
    expect(component.calculateEfficiency()).toBe('0%');
  });

  it('should calculate correct healthy statistics', () => {
    component.tableData.data = [
      { health: 'healthy', completion: '90%' },
      { health: 'unhealthy', completion: '40%' },
      { health: 'healthy', completion: '70%' },
    ];
    const res = component.calculateHealth('healthy');
    expect(res).toEqual({ average: '80%', count: 2 });
  });

  it('should handle no matching healthType gracefully', () => {
    component.tableData.data = [
      { health: 'unhealthy', completion: '40%' },
      { health: 'unhealthy', completion: '50%' },
    ];
    const res = component.calculateHealth('healthy');
    expect(res).toEqual({ average: '0%', count: 0 });
  });

  it('should generate filter data for columns', () => {
    const dummyData = [
      { id: 1, name: 'A', type: 'alpha' },
      { id: 2, name: 'B', type: 'beta' },
      { id: 3, name: 'A', type: 'alpha' },
    ];
    const dummyColumns = [{ field: 'name' }, { field: 'type' }];
    const { tableColumnData, tableColumnForm } =
      component.generateColumnFilterData(dummyData, dummyColumns);
    expect(tableColumnData).toEqual({
      name: [
        { name: 'A', value: 'A' },
        { name: 'B', value: 'B' },
      ],
      type: [
        { name: 'alpha', value: 'alpha' },
        { name: 'beta', value: 'beta' },
      ],
    });
    expect(tableColumnForm).toEqual({ name: [], type: [] });
  });

  it('should return undefined when data is empty', () => {
    const result = component.generateColumnFilterData([], [{ field: 'x' }]);
    expect(result).toBeUndefined();
  });

  it('should return correct class for each value', () => {
    expect(component.getMClass('healthy')).toBe('healthy');
    expect(component.getMClass('m4')).toBe('m4');
    expect(component.getMClass('unknown')).toBeUndefined();
  });

  it('should set filter column on click', () => {
    component.onFilterClick('col1');
    expect(component.filteredColumn).toBe('col1');
  });

  it('should unset filter column on blur if same column', () => {
    component.filteredColumn = 'col1';
    component.onFilterBlur('col1');
    expect(component.filteredColumn).toBe('');
  });

  it('should return same level/label when dataFor is parent', () => {
    const filterApplyData = {
      level: 1,
      label: 'project',
      selectedMap: { date: ['2025-01-01'] },
      ids: ['D1'],
    };
    component.completeHierarchyData = [
      { level: 1, hierarchyLevelName: 'Project', hierarchyLevelId: 'project' },
      { level: 2, hierarchyLevelName: 'Team', hierarchyLevelId: 'team' },
    ];

    const result = component.payloadPreparation(
      filterApplyData,
      'kanban',
      'parent',
    );

    expect(result).toEqual({
      level: 1,
      label: 'Project',
      parentId: '',
      date: '2025-01-01',
      duration: 'D1',
    });
  });

  it('should return child when matching level exists', () => {
    const hierarchyData = [
      { level: 1, hierarchyLevelName: 'Project', hierarchyLevelId: 'project' },
      { level: 2, hierarchyLevelName: 'Team', hierarchyLevelId: 'team' },
      { level: 3, hierarchyLevelName: 'Sprint', hierarchyLevelId: 'sprint' },
    ];

    const result = component.getImmediateChild(hierarchyData, 2);

    expect(result).toEqual({
      level: 2,
      hierarchyLevelName: 'Team',
      hierarchyLevelId: 'team',
    });
  });

  it('should return null when no matching child found', () => {
    const hierarchyData = [
      { level: 1, hierarchyLevelName: 'Project', hierarchyLevelId: 'project' },
      { level: 3, hierarchyLevelName: 'Sprint', hierarchyLevelId: 'sprint' },
    ];

    const result = component.getImmediateChild(hierarchyData, 2);

    expect(result).toEqual(null);
  });

  it('should return null when hierarchyData is empty', () => {
    const hierarchyData: any[] = [];

    const result = component.getImmediateChild(hierarchyData, 1);

    expect(result).toBeNull();
  });

  it('should return columnName when it is a string', () => {
    const result = component.sortableColumn('name');
    expect(result).toBe('name');
  });

  it('should return columnName.field when columnName is an object', () => {
    const columnObj = { field: 'age', header: 'Age' };
    const result = component.sortableColumn(columnObj);
    expect(result).toBe('age');
  });

  it('should calculate quarterly risk correctly', () => {
    const testData = [
      { name: 'Project A', completion: '90%' },
      { name: 'Project B', completion: '70%' },
      { name: 'Project C', completion: '50%' },
      { name: 'Project D', completion: '30%' },
      { name: 'Project E', completion: '80%' },
    ];

    const result = component.calculateQuertlyRisk(testData);

    expect(result.length).toBe(4);
    expect(result[0]).toEqual({ property: 'Project D', value: '30%' });
    expect(result[1]).toEqual({ property: 'Project C', value: '50%' });
  });

  it('should calculate trend data for positive trends', () => {
    const testData = [
      { kpiName: 'KPI 1', trendValue: 5.5 },
      { kpiName: 'KPI 2', trendValue: 3.2 },
      { kpiName: 'KPI 3', trendValue: 8.1 },
    ];

    const result = component.calculateTrendData(testData, 'positive');

    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ property: 'KPI 3', value: '8.1' });
    expect(result[1]).toEqual({ property: 'KPI 1', value: '5.5' });
  });

  it('should return empty array when trend data is null', () => {
    const result = component.calculateTrendData(null, 'positive');
    expect(result).toEqual([]);
  });

  it('should process filter data correctly', () => {
    const testData = [
      { nodeDisplayName: 'Node B', labelName: 'project' },
      { nodeDisplayName: 'Node A', labelName: 'project' },
      { nodeDisplayName: 'Node C', labelName: 'team' },
    ];

    const result = component.processFilterData(testData, 'project');

    expect(result.length).toBe(2);
    expect(result[0].nodeDisplayName).toBe('Node A');
    expect(result[1].nodeDisplayName).toBe('Node B');
  });

  it('should return empty array when filter data is not array', () => {
    const result = component.processFilterData(null, 'project');
    expect(result).toEqual([]);
  });

  it('should get productivity for row', () => {
    component.productivityData = {
      'Test Row': 85.5,
      'Another Row': 92.3,
    };
    component.selectedType = 'scrum';

    expect(component.getProductivityForRow('Test Row')).toBe('85.50%');
    expect(component.getProductivityForRow('Unknown Row')).toBe('N/A');
  });

  it('should handle dropdown change for scrum type', () => {
    component.selectedType = 'scrum';
    component.filterApplyData = { ids: [], selectedMap: { project: [] } };

    const event = { value: { nodeId: 'node123' } };
    spyOn(component, 'getMaturityWheelData');

    component.onDropdownChange(event);

    expect(component.filterApplyData.ids).toEqual(['node123']);
    expect(component.getMaturityWheelData).toHaveBeenCalled();
  });

  it('should process PEB data correctly', () => {
    const testData = {
      summary: {
        levelName: 'Project Level',
        categoryScores: { productivity: 88.5 },
        trends: {
          positive: [{ kpiName: 'KPI 1', trendValue: 5.5 }],
          negative: [{ kpiName: 'KPI 2', trendValue: -2.3 }],
        },
      },
      details: [
        {
          organizationEntityName: 'Entity 1',
          categoryScores: { productivity: 75.2 },
        },
      ],
    };

    component.tableData = {
      data: [
        {
          name: 'Entity 1',
          completion: '80%',
          children: {
            data: [{ name: 'Child Entity 1', completion: '70%' }],
          },
        },
      ],
    };
    component.selectedType = 'scrum';

    component.processPEBData(testData);

    expect(component.productivityData['Project Level']).toBe(88.5);
    expect(component.productivityData['Entity 1']).toBe(75.2);
    expect(component.tableData.data[0].productivity).toBe('75.20%');
    expect(component.tableData.data[0].children.data[0].productivity).toBe(
      'N/A',
    );
    expect(component.BottomTilesLoader).toBeFalse();
  });

  it('should initialize bottom data for ALL reset', () => {
    component.initializeBottomData('ALL');

    const bottomData = component.bottomTilesData();
    expect(bottomData.length).toBe(3);
    expect(bottomData[0].category).toBe('Top 4 Risks this Quarter');
    expect(bottomData[1].category).toBe('Positive Trends');
    expect(bottomData[2].category).toBe('Negative Trends');
  });

  it('should handle fetchPEBaData error', fakeAsync(() => {
    // Setup proper hierarchy data for the test
    component.completeHierarchyData = [
      { level: 0, hierarchyLevelName: 'Root Level', hierarchyLevelId: 'root' },
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
    ];

    mockSharedService.getPEBDataCache.and.returnValue(null);
    mockHelperService.fetchPEBaData.and.returnValue(
      throwError({ error: 'Network error' }),
    );

    spyOn(component, 'initializeBottomData');

    component.fetchPEBaData({ label: 'project', level: 1, parentId: '' });
    tick();

    expect(component.BottomTilesLoader).toBeFalse();
    expect(component.calculatorDataLoader).toBeFalse();
    expect(component.initializeBottomData).toHaveBeenCalledWith('ONLYTRENDS');
    expect(mockMessageService.add).toHaveBeenCalled();
  }));

  it('should handle getNBAData success', () => {
    mockHttpService.getHomeNBAData.and.returnValue(
      of({ success: true, data: { details: [{ id: 1, name: 'NBA Data' }] } }),
    );

    component.getNBAData('project');

    expect(component.nbaRawData).toEqual([{ id: 1, name: 'NBA Data' }]);
  });

  it('should handle getNBAData error', () => {
    mockHttpService.getHomeNBAData.and.returnValue(
      throwError({ error: 'Network error' }),
    );

    component.getNBAData('project');

    expect(component.nbaRawData).toEqual([]);
    expect(mockMessageService.add).toHaveBeenCalled();
  });

  it('should handle onRowExpand with error response', () => {
    mockHttpService.getExecutiveBoardData.and.returnValue(
      of({ message: 'API Error', success: false, error: true, data: null }),
    );

    spyOn(component, 'payloadPreparation').and.returnValue({
      level: 1,
      label: 'test',
      parentId: '',
      date: '',
      duration: '',
    });

    component.onRowExpand({ data: { id: 'row1' } });

    expect(component.nestedLoader).toBeFalse();
    expect(component.productivityExpandRowDataLoader).toBeFalse();
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'API Error',
    });
  });

  it('should handle onRowExpand success and call fetchNestedPEBData', fakeAsync(() => {
    const mockResponse = {
      message: 'Success',
      success: true,
      data: {
        matrix: {
          rows: [
            {
              id: 'child1',
              name: 'Child Row',
              completion: '70%',
              health: 'healthy',
              boardMaturity: {
                dora: 'M2',
                value: 'M2',
                speed: 'M2',
                quality: 'M2',
              },
            },
          ],
          columns: [
            { field: 'id', header: 'ID' },
            { field: 'name', header: 'Name' },
          ],
        },
      },
    };

    mockHttpService.getExecutiveBoardData.and.returnValue(of(mockResponse));
    spyOn(component, 'payloadPreparation').and.returnValue({
      level: 2,
      label: 'team',
      parentId: 'row1',
      date: '',
      duration: '',
    });
    spyOn(component, 'fetchNestedPEBData');
    spyOn(component, 'generateColumnFilterData').and.returnValue({
      tableColumnData: {},
      tableColumnForm: {},
    });

    component.tableData = {
      data: [{ id: 'row1', name: 'Parent Row' }],
      columns: [],
    };
    component.mainTable = { first: 0 };

    component.onRowExpand({ data: { id: 'row1' } });
    tick();
    tick(100); // For setTimeout

    expect(component.nestedLoader).toBeFalse();
    expect(component.fetchNestedPEBData).toHaveBeenCalled();
  }));

  it('should handle fetchNestedPEBData success', fakeAsync(() => {
    const mockPEBResponse = {
      message: 'Productivity data was successfully retrieved',
      success: true,
      data: {
        details: [
          {
            organizationEntityName: 'Child Entity',
            categoryScores: {
              overall: 78.5,
              speed: 75.0,
              quality: 82.0,
              efficiency: 80.0,
              productivity: 78.5,
            },
          },
        ],
      },
    };

    mockSharedService.getPEBDataCache.and.returnValue(null);
    mockHelperService.fetchPEBaData.and.returnValue(of(mockPEBResponse));
    component.completeHierarchyData = [
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
      { level: 2, hierarchyLevelName: 'Team Level', hierarchyLevelId: 'team' },
    ];
    component.selectedType = 'scrum';

    const targettedDetails = {
      children: {
        data: [{ name: 'Child Entity', productivity: 'N/A' }],
      },
    };

    component.fetchNestedPEBData(
      { level: 2, label: 'team', parentId: 'parent1' },
      targettedDetails,
    );
    tick();

    expect(component.productivityData['Child Entity']).toBe(78.5);
    expect(targettedDetails.children.data[0].productivity).toBe('78.50%');
    expect(component.productivityExpandRowDataLoader).toBeFalse();
  }));

  it('should handle fetchNestedPEBData error', () => {
    mockHelperService.fetchPEBaData.and.returnValue(
      throwError({ error: 'Network error' }),
    );
    component.completeHierarchyData = [
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
      { level: 2, hierarchyLevelName: 'Team Level', hierarchyLevelId: 'team' },
    ];

    spyOn(console, 'error');

    component.fetchNestedPEBData(
      { level: 2, label: 'team', parentId: 'parent1' },
      { children: { data: [] } },
    );

    expect(console.error).toHaveBeenCalledWith(
      'Failed to load nested PEBa data:',
      { error: 'Network error' },
    );
  });

  it('should handle ngOnDestroy', () => {
    const mockSubscription = jasmine.createSpyObj('Subscription', [
      'unsubscribe',
    ]);
    component.subscription = [mockSubscription];

    component.ngOnDestroy();

    expect(mockSharedService.setPEBData).toHaveBeenCalledWith({});
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.subscription).toEqual([]);
  });

  it('should handle urlRedirection', () => {
    component.urlRedirection();
    // This method is currently empty, so we just verify it doesn't throw
    expect(true).toBe(true);
  });

  it('should handle retryPEBData', () => {
    spyOn(component, 'payloadPreparation').and.returnValue({
      label: 'project',
      level: 1,
      parentId: '',
      date: '',
      duration: '',
    });
    spyOn(component, 'fetchPEBaData');

    component.retryPEBData();

    expect(component.fetchPEBaData).toHaveBeenCalled();
  });

  it('should handle getMaturityWheelData', () => {
    // Initialize the maturity component mock
    component.maturityComponent = {
      receiveSharedData: jasmine.createSpy('receiveSharedData'),
    } as any;

    const sharedobject = {
      masterData: {},
      filterData: {},
      filterApplyData: {},
      dashConfigData: {},
    };

    component.getMaturityWheelData(sharedobject);

    expect(component.maturityComponent.receiveSharedData).toHaveBeenCalledWith({
      masterData: sharedobject.masterData,
      filterData: sharedobject.filterData,
      filterApplyData: sharedobject.filterApplyData,
      dashConfigData: sharedobject.dashConfigData,
    });
  });

  it('should handle getImmediateParentDisplayName when parent exists', () => {
    component.completeHierarchyData = [
      { level: 1, hierarchyLevelName: 'Project', hierarchyLevelId: 'project' },
      { level: 2, hierarchyLevelName: 'Team', hierarchyLevelId: 'team' },
    ];
    component.selectedHierarchy = { hierarchyLevelName: 'Team' };

    mockSharedService.getFilterData.and.returnValue([
      {
        nodeId: 'parent1',
        nodeDisplayName: 'Parent Project',
        labelName: 'project',
      },
    ]);

    const child = { parentId: 'parent1' };
    const result = component.getImmediateParentDisplayName(child);

    expect(result).toBe('Parent Project');
  });

  it('should return undefined for root level hierarchy', () => {
    component.completeHierarchyData = [
      { level: 1, hierarchyLevelName: 'Project', hierarchyLevelId: 'project' },
    ];
    component.selectedHierarchy = { hierarchyLevelName: 'Project' };

    const child = { parentId: 'parent1' };
    const result = component.getImmediateParentDisplayName(child);

    expect(result).toBeUndefined();
  });

  it('should use cached data when available in fetchPEBaData', () => {
    const cachedData = {
      summary: {
        levelName: 'Cached Level',
        categoryScores: { productivity: 90.0 },
        trends: { positive: [], negative: [] },
      },
      details: [],
    };

    mockSharedService.getPEBDataCache.and.returnValue(cachedData);
    spyOn(component, 'processPEBData');

    component.completeHierarchyData = [
      { level: 0, hierarchyLevelName: 'Root Level', hierarchyLevelId: 'root' },
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
    ];

    component.fetchPEBaData({ label: 'project', level: 1, parentId: '' });

    expect(mockSharedService.getPEBDataCache).toHaveBeenCalledWith(
      'project level',
    );
    expect(component.processPEBData).toHaveBeenCalledWith(cachedData);
    expect(component.calculatorDataLoader).toBeFalse();
    expect(mockHelperService.fetchPEBaData).not.toHaveBeenCalled();
  });

  it('should cache data after successful API call in fetchPEBaData', fakeAsync(() => {
    const apiResponse = {
      success: true,
      data: {
        summary: {
          levelName: 'API Level',
          categoryScores: { productivity: 85.0 },
          trends: { positive: [], negative: [] },
        },
        details: [],
      },
    };

    mockSharedService.getPEBDataCache.and.returnValue(null);
    mockHelperService.fetchPEBaData.and.returnValue(of(apiResponse));
    spyOn(component, 'processPEBData');

    component.completeHierarchyData = [
      { level: 0, hierarchyLevelName: 'Root Level', hierarchyLevelId: 'root' },
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
    ];

    component.fetchPEBaData({ label: 'project', level: 1, parentId: '' });
    tick();

    expect(mockSharedService.setPEBDataCache).toHaveBeenCalledWith(
      'project level',
      apiResponse.data,
    );
    expect(component.processPEBData).toHaveBeenCalledWith(apiResponse.data);
  }));

  it('should use cached data when available in fetchNestedPEBData', () => {
    const cachedData = {
      details: [
        {
          organizationEntityName: 'Cached Entity',
          categoryScores: { productivity: 88.0 },
        },
      ],
    };

    mockSharedService.getPEBDataCache.and.returnValue(cachedData);
    component.completeHierarchyData = [
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
      { level: 2, hierarchyLevelName: 'Team Level', hierarchyLevelId: 'team' },
    ];
    component.selectedType = 'scrum';

    const targettedDetails = {
      children: {
        data: [{ name: 'Cached Entity', productivity: 'N/A' }],
      },
    };

    component.fetchNestedPEBData(
      { level: 2, label: 'team', parentId: 'parent1' },
      targettedDetails,
    );

    expect(mockSharedService.getPEBDataCache).toHaveBeenCalledWith(
      'team level',
    );
    expect(component.productivityData['Cached Entity']).toBe(88.0);
    expect(targettedDetails.children.data[0].productivity).toBe('88.00%');
    expect(component.productivityExpandRowDataLoader).toBeFalse();
    expect(mockHelperService.fetchPEBaData).not.toHaveBeenCalled();
  });

  it('should cache data after successful API call in fetchNestedPEBData', fakeAsync(() => {
    const apiResponse = {
      success: true,
      data: {
        details: [
          {
            organizationEntityName: 'API Entity',
            categoryScores: { productivity: 92.0 },
          },
        ],
      },
    };

    mockSharedService.getPEBDataCache.and.returnValue(null);
    mockHelperService.fetchPEBaData.and.returnValue(of(apiResponse));
    component.completeHierarchyData = [
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
      { level: 2, hierarchyLevelName: 'Team Level', hierarchyLevelId: 'team' },
    ];
    component.selectedType = 'scrum';

    const targettedDetails = {
      children: {
        data: [{ name: 'API Entity', productivity: 'N/A' }],
      },
    };

    component.fetchNestedPEBData(
      { level: 2, label: 'team', parentId: 'parent1' },
      targettedDetails,
    );
    tick();

    expect(mockSharedService.setPEBDataCache).toHaveBeenCalledWith(
      'team level',
      apiResponse.data,
    );
    expect(component.productivityData['API Entity']).toBe(92.0);
    expect(targettedDetails.children.data[0].productivity).toBe('92.00%');
  }));

  it('should clear cache when passDataToDashboard subscription triggers', () => {
    component.ngOnInit();

    expect(mockSharedService.clearPEBDataCache).toHaveBeenCalled();
  });

  it('should handle fetchPEBaData when no hierarchy item found', () => {
    component.completeHierarchyData = [];
    spyOn(component, 'initializeBottomData');

    component.fetchPEBaData({ label: 'project', level: 1, parentId: '' });

    expect(component.BottomTilesLoader).toBeFalse();
    expect(component.calculatorDataLoader).toBeFalse();
    expect(mockHelperService.fetchPEBaData).not.toHaveBeenCalled();
  });

  it('should handle fetchNestedPEBData when no hierarchy item found', () => {
    component.completeHierarchyData = [];
    const targettedDetails = { children: { data: [] } };

    component.fetchNestedPEBData(
      { level: 2, label: 'team', parentId: 'parent1' },
      targettedDetails,
    );

    expect(component.productivityExpandRowDataLoader).toBeFalse();
    expect(mockHelperService.fetchPEBaData).not.toHaveBeenCalled();
  });

  it('should handle fetchPEBaData API failure', fakeAsync(() => {
    const apiResponse = {
      success: false,
      message: 'API failed',
    };

    mockSharedService.getPEBDataCache.and.returnValue(null);
    mockHelperService.fetchPEBaData.and.returnValue(of(apiResponse));
    spyOn(component, 'initializeBottomData');

    component.completeHierarchyData = [
      { level: 0, hierarchyLevelName: 'Root Level', hierarchyLevelId: 'root' },
      {
        level: 1,
        hierarchyLevelName: 'Project Level',
        hierarchyLevelId: 'project',
      },
    ];

    component.fetchPEBaData({ label: 'project', level: 1, parentId: '' });
    tick();

    expect(component.BottomTilesLoader).toBeFalse();
    expect(component.calculatorDataLoader).toBeFalse();
    expect(component.initializeBottomData).toHaveBeenCalledWith('ONLYTRENDS');
    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Failed to load PEBa data. Please try again.',
    });
  }));

  it('should handle initializeBottomData with ONLYTRENDS reset', () => {
    component.bottomTilesData.set([
      {
        category: 'Risk',
        value: [],
        icon: false,
        color: '#cdba38',
        fontColor: 'black',
        cssClassName: '',
      },
      {
        category: 'Old Positive',
        value: [],
        icon: true,
        color: '#15ba40',
        fontColor: 'black',
        cssClassName: '',
      },
      {
        category: 'Old Negative',
        value: [],
        icon: true,
        color: '#eb3d4b',
        fontColor: 'black',
        cssClassName: '',
      },
    ]);

    component.initializeBottomData('ONLYTRENDS');

    const bottomData = component.bottomTilesData();
    expect(bottomData[1].color).toBe('#99cda9');
    expect(bottomData[2].color).toBe('#ed8888');
    expect(bottomData[1].category).toBe('Positive Trends');
    expect(bottomData[2].category).toBe('Negative Trends');
  });

  it('should handle executive board API error in ngOnInit subscription', fakeAsync(() => {
    const errorResponse = {
      message: 'Executive board API error',
      success: false,
      error: true,
      data: null,
    };

    mockHttpService.getExecutiveBoardData.and.returnValue(of(errorResponse));

    component.ngOnInit();
    tick();

    expect(mockMessageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Executive board API error',
    });
  }));

  it('should handle executive board API success and update table data', fakeAsync(() => {
    const successResponse = {
      message: 'Success',
      success: true,
      data: {
        matrix: {
          rows: [
            {
              id: 'r1',
              name: 'Test Project',
              completion: '85%',
              health: 'healthy',
              boardMaturity: {
                dora: 'M4',
                value: 'M4',
                speed: 'M4',
                quality: 'M4',
              },
            },
          ],
          columns: [
            { field: 'id', header: 'ID' },
            { field: 'name', header: 'Name' },
            { field: 'completion', header: 'Completion' },
          ],
        },
      },
    };

    mockHttpService.getExecutiveBoardData.and.returnValue(of(successResponse));
    spyOn(component, 'getProductivityForRow').and.returnValue('85.50%');
    spyOn(component, 'generateColumnFilterData').and.returnValue({
      tableColumnData: {},
      tableColumnForm: {},
    });
    spyOn(component, 'calculateQuertlyRisk').and.returnValue([]);
    spyOn(component, 'calculateEfficiency').and.returnValue('85%');
    spyOn(component, 'calculateHealth').and.returnValue({
      count: 1,
      average: '85%',
    });

    component.ngOnInit();
    tick();

    expect(component.tableData.data.length).toBe(1);
    expect(component.tableData.data[0].name).toBe('Test Project');
    expect(component.tableData.data[0].productivity).toBe('85.50%');
    expect(component.loader).toBeFalse();
  }));
});
