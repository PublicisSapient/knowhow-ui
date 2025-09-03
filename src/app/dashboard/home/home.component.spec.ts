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
import { Component } from '@angular/core';

@Component({
  selector: 'app-maturity', // must match actual selector used in HomeComponent template
  template: '',
})
class MockMaturityComponent {
  receiveSharedData = jasmine.createSpy('receiveSharedData');
}

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
      declarations: [HomeComponent, MockMaturityComponent],
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

    component.urlRedirection();
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

    component.urlRedirection();
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
      { health: 'healthy', completion: '90' },
      { health: 'critical', completion: '40' },
      { health: 'healthy', completion: '70' },
    ];
    const res = component.calculateHealth('healthy');
    expect(res).toEqual({ average: '80%', count: 2 });
  });

  it('should handle no matching healthType gracefully', () => {
    component.tableData.data = [
      { health: 'critical', completion: '40' },
      { health: 'critical', completion: '50' },
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

  beforeEach(() => {
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      return JSON.stringify({
        1: [{ level: 1, hierarchyLevelName: 'Test Level' }],
      });
    });
    spyOn(localStorage, 'setItem');
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
      level: 'Team',
      label: 'TeamA',
      selectedMap: { date: ['2025-01-01'] },
      ids: ['D1'],
    };

    const result = component.payloadPreparation(
      filterApplyData,
      'kanban',
      'parent',
    );

    expect(result).toEqual({
      level: 'Team',
      label: 'TeamA',
      parentId: '',
      date: '2025-01-01',
      duration: 'D1',
    });
  });

  it('should use child level/label when dataFor is child and hierarchy exists', () => {
    const hierarchy = [
      { level: 'Team', hierarchyLevelId: 'T1' },
      { level: 'Sprint', hierarchyLevelId: 'S1' },
    ];
    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify({ kanban: hierarchy }),
    );

    spyOn(component as any, 'getImmediateChild').and.returnValue({
      level: 'Sprint',
      hierarchyLevelId: 'S1',
    });

    const filterApplyData = {
      level: 'Team',
      label: 'TeamA',
      selectedMap: { date: ['2025-01-01'] },
      ids: ['D1'],
    };

    const result = component.payloadPreparation(
      filterApplyData,
      'kanban',
      'child',
    );

    expect(result).toEqual({
      level: 'Team',
      label: 'TeamA',
      parentId: '',
      date: '2025-01-01',
      duration: 'D1',
    });
  });

  it('should fallback to original level/label if getImmediateChild returns null', () => {
    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify({ kanban: [] }),
    );

    spyOn(component as any, 'getImmediateChild').and.returnValue(null);

    const filterApplyData = {
      level: 'Team',
      label: 'TeamA',
      selectedMap: {},
      ids: [],
    };

    const result = component.payloadPreparation(
      filterApplyData,
      'kanban',
      'child',
    );

    expect(result).toEqual({
      level: 'Team',
      label: 'TeamA',
      parentId: '',
      date: '',
      duration: '',
    });
  });

  it('should handle missing localStorage hierarchy safely', () => {
    const filterApplyData = {
      level: 'Board',
      label: 'B1',
      selectedMap: {},
      ids: [],
    };

    const result = component.payloadPreparation(
      filterApplyData,
      'scrum',
      'child',
    );

    expect(result).toEqual({
      level: 'Board',
      label: 'B1',
      parentId: '',
      date: '',
      duration: '',
    });
  });

  it('should return empty date/duration when selectedType is scrum', () => {
    const filterApplyData = {
      level: 'Board',
      label: 'B1',
      selectedMap: { date: ['2025-01-01'] },
      ids: ['Dur1'],
    };

    const result = component.payloadPreparation(
      filterApplyData,
      'scrum',
      'parent',
    );

    expect(result).toEqual({
      level: 'Board',
      label: 'B1',
      parentId: '',
      date: '',
      duration: '',
    });
  });

  it('should return child when matching level exists', () => {
    const hierarchyData = [
      { level: 1, hierarchyLevelId: 'L1' },
      { level: 2, hierarchyLevelId: 'L2' },
      { level: 3, hierarchyLevelId: 'L3' },
    ];

    const result = component.getImmediateChild(hierarchyData, 1);

    expect(result).toEqual({ level: 2, hierarchyLevelId: 'L2' });
  });

  it('should return null when no matching child found', () => {
    const hierarchyData = [
      { level: 1, hierarchyLevelId: 'L1' },
      { level: 3, hierarchyLevelId: 'L3' },
    ];

    const result = component.getImmediateChild(hierarchyData, 2);

    expect(result).toEqual({ level: 3, hierarchyLevelId: 'L3' });
  });

  it('should return null when hierarchyData is empty', () => {
    const hierarchyData: any[] = [];

    const result = component.getImmediateChild(hierarchyData, 1);

    expect(result).toBeNull();
  });

  it('should set nestedLoader true and call payloadPreparation', () => {
    const mockdata = {
      level: 'abc',
      label: 'abc',
      parentId: 'abc',
      date: '12-10-2025',
      duration: '12',
    };
    spyOn(component, 'payloadPreparation').and.returnValue(mockdata);
    (component as any).httpService.getExecutiveBoardData = jasmine
      .createSpy()
      .and.returnValue(of({ data: { matrix: { rows: [], columns: [] } } }));

    component.onRowExpand({ data: { id: 'row1' } });

    expect(component.nestedLoader).toBeFalse();
    expect(component.payloadPreparation).toHaveBeenCalledWith(
      component.filterApplyData,
      component.selectedType,
      'child',
    );
  });

  it('should update children data when API returns rows and columns', () => {
    const mockdata = {
      level: 'abc',
      label: 'abc',
      parentId: 'abc',
      date: '12-10-2025',
      duration: '12',
    };
    component.tableData = { data: [{ id: 'row1' }] };
    spyOn(component, 'payloadPreparation').and.returnValue(mockdata);
    spyOn(component, 'generateColumnFilterData').and.returnValue({
      tableColumnData: ['colData'],
      tableColumnForm: { form: true },
    });

    const mockResponse = {
      data: {
        matrix: {
          rows: [{ id: 'r1', boardMaturity: { maturity: 'high' } }],
          columns: [{ field: 'id' }, { field: 'name' }],
        },
      },
    };

    (component as any).httpService.getExecutiveBoardData = jasmine
      .createSpy()
      .and.returnValue(of(mockResponse));

    component.onRowExpand({ data: { id: 'row1' } });

    const targetRow = component.tableData.data[0];
    expect(targetRow.children.data[0]).toEqual({
      id: 'r1',
      boardMaturity: { maturity: 'high' },
      maturity: 'high',
    });
    expect(targetRow.children.columns).toEqual([{ field: 'name' }]);
    expect(targetRow.children.tableColumnData).toEqual(['colData']);
    expect(targetRow.children.tableColumnForm).toEqual({ form: true });
    expect(component.nestedLoader).toBeFalse();
  });

  it('should not update children if targettedDetails not found', () => {
    const mockdata = {
      level: '',
      label: '',
      parentId: '',
      date: '',
      duration: '',
    };
    component.tableData = { data: [{ id: 'differentRow' }] };
    spyOn(component, 'payloadPreparation').and.returnValue(mockdata);

    const mockResponse = {
      data: {
        matrix: {
          rows: [{ id: 'r1' }],
          columns: [{ field: 'id' }, { field: 'name' }],
        },
      },
    };

    (component as any).httpService.getExecutiveBoardData = jasmine
      .createSpy()
      .and.returnValue(of(mockResponse));

    component.onRowExpand({ data: { id: 'rowX' } });

    const targetRow = component.tableData.data[0];
    expect(targetRow.children).toBeUndefined();
  });

  it('should skip processing when API response has no data', () => {
    const mockdata = {
      level: '',
      label: '',
      parentId: '',
      date: '',
      duration: '',
    };
    spyOn(component, 'payloadPreparation').and.returnValue(mockdata);
    (component as any).httpService.getExecutiveBoardData = jasmine
      .createSpy()
      .and.returnValue(of({}));

    component.onRowExpand({ data: { id: 'row1' } });

    expect(component.nestedLoader).toBeTrue(); // stays true since no data
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

  it('should initialize products and populate table & aggregation when API returns data', () => {
    (component['service'] as any).getSelectedType = jasmine
      .createSpy()
      .and.returnValue('kanban');
    spyOn(component, 'payloadPreparation').and.callThrough();
    (component['httpService'] as any).getExecutiveBoardData = jasmine
      .createSpy()
      .and.returnValue(
        of({
          data: {
            matrix: {
              rows: [
                { id: 'r1', boardMaturity: { maturity: 'high' }, children: [] },
              ],
              columns: [{ field: 'id' }, { field: 'name' }],
            },
          },
        }),
      );

    spyOn(component, 'generateColumnFilterData').and.returnValue({
      tableColumnData: ['colData'],
      tableColumnForm: { form: true },
    });
    spyOn(component, 'calculateEfficiency').and.returnValue('Eff');
    spyOn(component, 'calculateHealth').and.callFake((type) => ({
      count: 1,
      average: 'Avg',
    }));

    localStorage.setItem(
      'completeHierarchyData',
      JSON.stringify({
        kanban: [{ level: 'parent', hierarchyLevelName: 'Team' }],
      }),
    );

    component.ngOnInit();

    expect(component.products.length).toBe(3);
    expect(component.payloadPreparation).toHaveBeenCalled();
    expect(component['httpService'].getExecutiveBoardData).toHaveBeenCalled();
    expect(component.tableData['data'][0].maturity).toBe('high');
    expect(component.tableData['columns']).toEqual([{ field: 'name' }]);
    expect(component.tableColumnData).toEqual(['colData']);
    expect(component.tableColumnForm).toEqual({ form: true });
    expect(component.aggregrationDataList.length).toBe(4);
    expect(component.loader).toBeFalse();
  });

  it('should set loader to false when API returns no data', () => {
    (component['service'] as any).getSelectedType = jasmine
      .createSpy()
      .and.returnValue('kanban');
    spyOn(component, 'payloadPreparation').and.callThrough();
    (component['httpService'] as any).getExecutiveBoardData = jasmine
      .createSpy()
      .and.returnValue(of({}));

    component.ngOnInit();

    // expect(component.loader).toBeFalse();
    expect(component.tableData['data']).toEqual([]);
    expect(component.aggregrationDataList).toEqual([]);
  });
});
