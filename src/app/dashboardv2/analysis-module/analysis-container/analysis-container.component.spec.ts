import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AnalysisContainerComponent } from './analysis-container.component';
import { HttpService } from '../../../services/http.service';
import { SharedService } from '../../../services/shared.service';
import { MessageService } from 'primeng/api';

describe('AnalysisContainerComponent', () => {
  let component: AnalysisContainerComponent;
  let fixture: ComponentFixture<AnalysisContainerComponent>;
  let httpService: jasmine.SpyObj<HttpService>;

  beforeEach(async () => {
    const httpSpy = jasmine.createSpyObj('HttpService', [
      'getFilterData',
      'getAnalyticsMetricsTableData',
      'getAIAnalyticsData',
    ]);
    const sharedSpy = jasmine.createSpyObj('SharedService', [
      'setSelectedTrends',
    ]);
    const messageSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [],
      providers: [
        AnalysisContainerComponent,
        { provide: HttpService, useValue: httpSpy },
        { provide: SharedService, useValue: sharedSpy },
        { provide: MessageService, useValue: messageSpy },
      ],
    }).compileComponents();

    httpService = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    httpService.getFilterData.and.returnValue(of({ success: true, data: [] }));
    httpService.getAnalyticsMetricsTableData.and.returnValue(
      of({ success: true, message: '', data: { analytics: [] } }),
    );
    httpService.getAIAnalyticsData.and.returnValue(
      of({ data: { analytics: [] } }),
    );

    component = TestBed.inject(AnalysisContainerComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should process summary data correctly', () => {
    const mockSummary = { averageGain: 10.5, totalProjects: 5 };

    const result = (component as any).processSummaryData(mockSummary);

    expect(result.length).toBe(2);
    expect(result[0].summaryName).toBe('Average Gain');
  });

  it('should return empty array for null summary', () => {
    const result = (component as any).processSummaryData(null);

    expect(result).toEqual([]);
  });

  it('should convert camelCase to TitleCase', () => {
    const result = (component as any).camelCaseToTitleCase(
      'averageEfficiencyGain',
    );

    expect(result).toBe('Average Efficiency Gain');
  });

  it('should clean name correctly', () => {
    const result = component.cleanName('Project Name 123!@#');

    expect(result).toBe('projectName123');
  });

  it('should get numeric value for total', () => {
    expect((component as any).getNumericValueForTotal(5)).toBe(5);
    expect((component as any).getNumericValueForTotal('string')).toBe(0);
  });

  it('should handle filter select', () => {
    const mockEvent = { type: 'Project', value: [{ nodeId: '1' }] };
    spyOn(component, 'payloadPreparation');

    component.handleFilterSelect(mockEvent);

    expect(component.selectedProjects).toEqual([{ nodeId: '1' }]);
  });

  it('should update kpi settings', () => {
    component.updateKpiSettings();

    expect(component.aiUsageKpiSettings).toBeDefined();
  });

  it('should prepare payload correctly', () => {
    component.selectedProjects = [
      { nodeId: '1', basicProjectConfigId: 'config1' },
    ];
    component.selectedSprint = { nodeId: '2' };
    component.projectData = {
      Sprint: [
        {
          parentId: '1',
          sprintState: 'CLOSED',
          sprintEndDate: '2023-01-01',
          nodeId: 's1',
        },
      ],
    };

    component.payloadPreparation();

    expect(httpService.getAIAnalyticsData).toHaveBeenCalled();
  });

  it('should process metrics table data with complete flow', () => {
    const mockApiData = {
      summary: { totalMetrics: 50, averageValue: 25 },
      analytics: [
        {
          metric: 'Test Metric 1',
          projects: [
            {
              name: 'Project 1',
              sprints: [
                { sprint: 'Sprint 1', value: 10, trend: 'up' },
                { sprint: 'Sprint 2', value: 15, trend: 'down' },
              ],
            },
            {
              name: 'Project 2',
              sprints: [{ sprint: 'Sprint 1', value: 20, trend: 'stable' }],
            },
          ],
        },
        {
          metric: 'Test Metric 2',
          projects: [
            {
              name: 'Project 1',
              sprints: [{ sprint: 'Sprint 1', value: 30, trend: 'up' }],
            },
          ],
        },
      ],
    };
    component.selectedProjects = [
      { nodeDisplayName: 'Project 1' },
      { nodeDisplayName: 'Project 2' },
    ];
    spyOn(component, 'updateKpiSettings');
    spyOn(component, 'processSummaryData').and.returnValue([
      { number: '50', summaryName: 'Total' },
    ]);

    (component as any).processMetricsTableData(mockApiData);

    // Test project headers creation
    expect(component.metricsProjectHeaders.length).toBe(3); // Sprint + 2 projects
    expect(component.metricsProjectHeaders[0].name).toBe('Sprint');
    expect(component.metricsProjectHeaders[1].name).toBe('Project 1');

    // Test sub-columns setup
    expect(component.metricsSubColumns.length).toBe(1);
    expect(component.metricsSubColumns[0].dataSuffix).toBe('_value');

    // Test table data creation
    expect(component.metricsTableData.length).toBeGreaterThan(0);

    // Test base column headers
    expect(component.metricsBaseColumnHeader).toBe('Metrics');
    expect(component.metricsBaseColumnHeader2).toBe('rowId');

    // Test summary processing
    expect(component.processSummaryData).toHaveBeenCalledWith(
      mockApiData.summary,
    );
    expect(component.metricsSummaryDisplayData).toEqual([
      { number: '50', summaryName: 'Total' },
    ]);
  });

  it('should handle missing sprint data in processMetricsTableData', () => {
    const mockApiData = {
      summary: { total: 100 },
      analytics: [
        {
          metric: 'Test Metric',
          projects: [
            {
              name: 'Project 1',
              sprints: [{ sprint: 'Sprint 1', value: 10, trend: 'up' }],
            },
          ],
        },
      ],
    };
    component.selectedProjects = [
      { nodeDisplayName: 'Project 1' },
      { nodeDisplayName: 'Project 2' },
    ];

    (component as any).processMetricsTableData(mockApiData);

    // Should handle missing project data gracefully
    expect(component.metricsTableData.length).toBeGreaterThan(0);
    const row = component.metricsTableData[0];
    expect(row['project2_value']).toBe('NA'); // Missing project should show NA
  });

  it('should handle empty analytics in processMetricsTableData', () => {
    const mockApiData = {
      summary: {},
      analytics: [],
    };
    component.selectedProjects = [];

    (component as any).processMetricsTableData(mockApiData);

    expect(component.metricsTableData).toEqual([]);
    expect(component.metricsProjectHeaders.length).toBe(1); // Only Sprint header
  });

  it('should create correct data keys in processMetricsTableData', () => {
    const mockApiData = {
      summary: {},
      analytics: [
        {
          metric: 'Performance Metric',
          projects: [
            {
              name: 'Test Project',
              sprints: [
                { sprint: 'Sprint Alpha', value: 42, trend: 'improving' },
              ],
            },
          ],
        },
      ],
    };
    component.selectedProjects = [{ nodeDisplayName: 'Test Project' }];

    (component as any).processMetricsTableData(mockApiData);

    const row = component.metricsTableData[0];
    expect(row['sprintName_value']).toBe('Sprint Alpha');
    expect(row['testProject_value']).toBe('42 (improving)');
    expect(row['Metrics']).toBe('Performance Metric');
    expect(row['rowId']).toBe(0);
  });

  it('should get project data successfully', () => {
    const mockFilterApiData = {
      success: true,
      data: [
        { nodeId: '1', nodeDisplayName: 'Project A', labelName: 'project' },
        { nodeId: '2', nodeDisplayName: 'Project B', labelName: 'project' },
        { nodeId: '3', nodeDisplayName: 'Sprint 1', labelName: 'sprint' },
        { nodeId: '4', nodeDisplayName: 'Sprint 2', labelName: 'sprint' },
      ],
    };

    // Initialize component state to prevent errors
    component.filterData = { Project: [], Sprint: [] };
    component.selectedProjects = [];
    component.selectedSprint = {};

    httpService.getFilterData.and.returnValue(of(mockFilterApiData));
    spyOn(component, 'payloadPreparation');

    component.getProjectData();

    expect(httpService.getFilterData).toHaveBeenCalledWith({
      kanban: false,
      sprintIncluded: ['CLOSED', 'ACTIVE'],
    });

    // Verify projectData structure
    expect(component.projectData.Project.length).toBe(2);
    expect(component.projectData.Sprint.length).toBe(2);
    expect(component.projectData.Project[0].nodeDisplayName).toBe('Project A');

    // Verify filterData structure
    expect(component.filterData.Project.length).toBe(2);
    expect(component.filterData.Sprint).toBeDefined();

    // Verify payloadPreparation is called
    expect(component.payloadPreparation).toHaveBeenCalled();
  });

  it('should handle API failure in getProjectData', () => {
    const mockFailureData = {
      success: false,
      data: [],
    };

    httpService.getFilterData.and.returnValue(of(mockFailureData));
    spyOn(component, 'payloadPreparation');

    component.getProjectData();

    expect(httpService.getFilterData).toHaveBeenCalled();
    expect(component.payloadPreparation).not.toHaveBeenCalled();
  });

  it('should sort projects alphabetically in getProjectData', () => {
    const mockFilterApiData = {
      success: true,
      data: [
        { nodeId: '1', nodeDisplayName: 'Z Project', labelName: 'project' },
        { nodeId: '2', nodeDisplayName: 'A Project', labelName: 'project' },
        { nodeId: '3', nodeDisplayName: 'M Project', labelName: 'project' },
      ],
    };

    // Initialize component state
    component.filterData = { Project: [], Sprint: [] };
    component.selectedProjects = [];
    component.selectedSprint = {};

    httpService.getFilterData.and.returnValue(of(mockFilterApiData));
    spyOn(component, 'payloadPreparation');

    component.getProjectData();

    // Verify projects are sorted alphabetically
    expect(component.projectData.Project[0].nodeDisplayName).toBe('A Project');
    expect(component.projectData.Project[1].nodeDisplayName).toBe('M Project');
    expect(component.projectData.Project[2].nodeDisplayName).toBe('Z Project');
  });

  it('should handle subscription in getProjectData', () => {
    const mockFilterApiData = {
      success: true,
      data: [
        { nodeId: '1', nodeDisplayName: 'Test Project', labelName: 'project' },
      ],
    };

    // Initialize component state
    component.filterData = { Project: [], Sprint: [] };
    component.selectedProjects = [];
    component.selectedSprint = {};
    component.subscriptions = [];

    httpService.getFilterData.and.returnValue(of(mockFilterApiData));
    spyOn(component, 'payloadPreparation');

    const initialSubscriptionCount = component.subscriptions.length;
    component.getProjectData();

    // Verify subscription is added
    expect(component.subscriptions.length).toBe(initialSubscriptionCount + 1);
  });

  it('should remove project when multiple projects exist', () => {
    // Initialize component state
    component.selectedProjects = [
      { nodeId: '1', nodeDisplayName: 'Project A' },
      { nodeId: '2', nodeDisplayName: 'Project B' },
      { nodeId: '3', nodeDisplayName: 'Project C' },
    ];

    spyOn(component, 'payloadPreparation');

    const projectToRemove = { nodeId: '2' };
    component.removeProject(projectToRemove);

    // Verify project is removed
    expect(component.selectedProjects.length).toBe(2);
    expect(
      component.selectedProjects.find((p) => p.nodeId === '2'),
    ).toBeUndefined();
    expect(
      component.selectedProjects.find((p) => p.nodeId === '1'),
    ).toBeDefined();
    expect(
      component.selectedProjects.find((p) => p.nodeId === '3'),
    ).toBeDefined();

    // Verify payloadPreparation is called
    expect(component.payloadPreparation).toHaveBeenCalled();
  });

  it('should not remove project when only one project exists', () => {
    // Initialize component state with single project
    component.selectedProjects = [
      { nodeId: '1', nodeDisplayName: 'Only Project' },
    ];

    spyOn(component, 'payloadPreparation');

    const projectToRemove = { nodeId: '1' };
    component.removeProject(projectToRemove);

    // Verify project is not removed
    expect(component.selectedProjects.length).toBe(1);
    expect(component.selectedProjects[0].nodeId).toBe('1');

    // Verify payloadPreparation is not called
    expect(component.payloadPreparation).not.toHaveBeenCalled();
  });

  it('should handle removing non-existent project', () => {
    // Initialize component state
    component.selectedProjects = [
      { nodeId: '1', nodeDisplayName: 'Project A' },
      { nodeId: '2', nodeDisplayName: 'Project B' },
    ];

    spyOn(component, 'payloadPreparation');

    const nonExistentProject = { nodeId: '999' };
    component.removeProject(nonExistentProject);

    // Verify no projects are removed
    expect(component.selectedProjects.length).toBe(2);
    expect(
      component.selectedProjects.find((p) => p.nodeId === '1'),
    ).toBeDefined();
    expect(
      component.selectedProjects.find((p) => p.nodeId === '2'),
    ).toBeDefined();

    // Verify payloadPreparation is still called
    expect(component.payloadPreparation).toHaveBeenCalled();
  });

  it('should handle empty selectedProjects array', () => {
    // Initialize component state with empty array
    component.selectedProjects = [];

    spyOn(component, 'payloadPreparation');

    const projectToRemove = { nodeId: '1' };
    component.removeProject(projectToRemove);

    // Verify array remains empty
    expect(component.selectedProjects.length).toBe(0);

    // Verify payloadPreparation IS called (only length === 1 check prevents it)
    expect(component.payloadPreparation).toHaveBeenCalled();
  });

  it('should process AI usage table data with complete flow', () => {
    const mockApiData = {
      summary: { totalEfficiency: 85.5, projectCount: 3 },
      analytics: [
        {
          aiUsageType: 'Code Generation',
          projects: [
            { name: 'Project Alpha', efficiencyGain: 15.2, issueCount: 25 },
            { name: 'Project Beta', efficiencyGain: 8.7, issueCount: 18 },
          ],
        },
        {
          aiUsageType: 'Code Review',
          projects: [
            { name: 'Project Alpha', efficiencyGain: 12.1, issueCount: 30 },
            { name: 'Project Gamma', efficiencyGain: 5.5, issueCount: 12 },
          ],
        },
      ],
    };

    // Initialize component state
    component.selectedProjects = [
      { nodeDisplayName: 'Project Alpha', nodeName: 'Project Alpha' },
      { nodeDisplayName: 'Project Beta', nodeName: 'Project Beta' },
      { nodeDisplayName: 'Project Gamma', nodeName: 'Project Gamma' },
    ];

    spyOn(component, 'updateKpiSettings');
    spyOn(component, 'processSummaryData').and.returnValue([
      { number: '85.5', summaryName: 'Total' },
    ]);

    (component as any).processAiUsageTableData(mockApiData);

    // Test base column setup
    expect(component.aiUsageBaseColumnHeader).toBe('Usage Type');
    expect(component.aiUsageBaseColumnKey).toBe('usageType');

    // Test sub-columns setup
    expect(component.aiUsageSubColumns.length).toBe(2);
    expect(component.aiUsageSubColumns[0].label).toBe('Efficiency gain');
    expect(component.aiUsageSubColumns[1].label).toBe('Issue count');

    // Test project headers creation (3 projects + Total)
    expect(component.aiUsageProjectHeaders.length).toBe(4);
    expect(component.aiUsageProjectHeaders[3].name).toBe('Total');
    expect(component.aiUsageProjectHeaders[3].isTotalColumn).toBe(true);

    // Test table data creation (2 usage types + 1 total row)
    expect(component.aiUsageTableData.length).toBe(3);
    expect(component.aiUsageTableData[0].usageType).toBe('Code Generation');
    expect(component.aiUsageTableData[2].usageType).toBe('Total');
    expect(component.aiUsageTableData[2].isTotalRow).toBe(true);

    // Test summary processing
    expect(component.processSummaryData).toHaveBeenCalledWith(
      mockApiData.summary,
    );
    expect(component.aiUsageSummaryDisplayData).toEqual([
      { number: '85.5', summaryName: 'Total' },
    ]);
  });

  it('should handle missing project data in processAiUsageTableData', () => {
    const mockApiData = {
      summary: { total: 100 },
      analytics: [
        {
          aiUsageType: 'Testing',
          projects: [
            { name: 'Project Alpha', efficiencyGain: 10, issueCount: 5 },
          ],
        },
      ],
    };

    component.selectedProjects = [
      { nodeDisplayName: 'Project Alpha', nodeName: 'Project Alpha' },
      { nodeDisplayName: 'Project Missing', nodeName: 'Project Missing' },
    ];

    (component as any).processAiUsageTableData(mockApiData);

    const row = component.aiUsageTableData[0];
    expect(row['projectAlpha_efficiencyGain']).toBe(10);
    expect(row['projectMissing_efficiencyGain']).toBe('NA'); // Missing project shows NA
    expect(row['projectMissing_issueCount']).toBe('NA');
  });

  it('should handle null and undefined values in processAiUsageTableData', () => {
    const mockApiData = {
      summary: {},
      analytics: [
        {
          aiUsageType: 'Null Test',
          projects: [
            {
              name: 'Project Test',
              efficiencyGain: null,
              issueCount: undefined,
            },
          ],
        },
      ],
    };

    component.selectedProjects = [
      { nodeDisplayName: 'Project Test', nodeName: 'Project Test' },
    ];

    (component as any).processAiUsageTableData(mockApiData);

    const row = component.aiUsageTableData[0];
    expect(row['projectTest_efficiencyGain']).toBe('NA');
    expect(row['projectTest_issueCount']).toBe('NA');
    expect(row.totalEfficiencyGain).toBe(0); // Numeric calculation should be 0
    expect(row.totalIssueCount).toBe(0);
  });

  it('should calculate totals correctly in processAiUsageTableData', () => {
    const mockApiData = {
      summary: {},
      analytics: [
        {
          aiUsageType: 'Type A',
          projects: [
            { name: 'Project 1', efficiencyGain: 10, issueCount: 5 },
            { name: 'Project 2', efficiencyGain: 15, issueCount: 8 },
          ],
        },
        {
          aiUsageType: 'Type B',
          projects: [{ name: 'Project 1', efficiencyGain: 20, issueCount: 12 }],
        },
      ],
    };

    component.selectedProjects = [
      { nodeDisplayName: 'Project 1', nodeName: 'Project 1' },
      { nodeDisplayName: 'Project 2', nodeName: 'Project 2' },
    ];

    (component as any).processAiUsageTableData(mockApiData);

    // Check row totals
    expect(component.aiUsageTableData[0].totalEfficiencyGain).toBe(25); // 10 + 15
    expect(component.aiUsageTableData[0].totalIssueCount).toBe(13); // 5 + 8
    expect(component.aiUsageTableData[1].totalEfficiencyGain).toBe(20); // 20 + 0

    // Check final total row
    const totalRow = component.aiUsageTableData[2];
    expect(totalRow.totalEfficiencyGain).toBe(45); // 25 + 20
    expect(totalRow.totalIssueCount).toBe(25); // 13 + 12

    // Check column totals in total row
    expect(totalRow['project1_efficiencyGain']).toBe(30); // 10 + 20
    expect(totalRow['project2_efficiencyGain']).toBe(15); // 15 + 0
  });

  it('should handle empty analytics in processAiUsageTableData', () => {
    const mockApiData = {
      summary: { empty: true },
      analytics: [],
    };

    component.selectedProjects = [];
    spyOn(component, 'updateKpiSettings');

    (component as any).processAiUsageTableData(mockApiData);

    expect(component.aiUsageTableData.length).toBe(1); // Only total row
    expect(component.aiUsageTableData[0].usageType).toBe('Total');
    expect(component.aiUsageProjectHeaders.length).toBe(1); // Only Total header
  });

  it('should open project settings with valid project by nodeName', () => {
    // Initialize component state
    component.projectData = {
      Project: [
        {
          nodeId: '1',
          nodeName: 'test-project',
          nodeDisplayName: 'Test Project',
          basicProjectConfigId: 'config123',
        },
        {
          nodeId: '2',
          nodeName: 'another-project',
          nodeDisplayName: 'Another Project',
          basicProjectConfigId: 'config456',
        },
      ],
    };

    component.kpiCardComponent = {
      onOpenFieldMappingDialog: jasmine.createSpy('onOpenFieldMappingDialog'),
      selectedTrendObject: null,
    };

    component.openProjectSettings('test-project');

    // Verify trend object is set
    expect(component.kpiCardComponent.selectedTrendObject).toEqual({
      nodeId: '1',
      nodeName: 'test-project',
      basicProjectConfigId: 'config123',
    });

    // Verify dialog is opened
    expect(
      component.kpiCardComponent.onOpenFieldMappingDialog,
    ).toHaveBeenCalled();
  });

  it('should open project settings with valid project by nodeDisplayName', () => {
    component.projectData = {
      Project: [
        {
          nodeId: '1',
          nodeName: 'project-alpha',
          nodeDisplayName: 'Project Alpha',
          basicProjectConfigId: 'config789',
        },
      ],
    };

    component.kpiCardComponent = {
      onOpenFieldMappingDialog: jasmine.createSpy('onOpenFieldMappingDialog'),
      selectedTrendObject: null,
    };

    component.openProjectSettings('Project Alpha');

    expect(component.kpiCardComponent.selectedTrendObject).toEqual({
      nodeId: '1',
      nodeName: 'project-alpha',
      basicProjectConfigId: 'config789',
    });
    expect(
      component.kpiCardComponent.onOpenFieldMappingDialog,
    ).toHaveBeenCalled();
  });

  it('should handle project not found in openProjectSettings', () => {
    component.projectData = {
      Project: [
        {
          nodeId: '1',
          nodeName: 'existing-project',
          nodeDisplayName: 'Existing Project',
          basicProjectConfigId: 'config123',
        },
      ],
    };

    spyOn(console, 'error');

    component.openProjectSettings('non-existent-project');

    expect(console.error).toHaveBeenCalledWith(
      'The complete object for project "non-existent-project" was not found in the available project list.',
    );
  });

  it('should handle missing kpiCardComponent in openProjectSettings', () => {
    component.projectData = {
      Project: [
        {
          nodeId: '1',
          nodeName: 'test-project',
          nodeDisplayName: 'Test Project',
          basicProjectConfigId: 'config123',
        },
      ],
    };

    // Set kpiCardComponent but without onOpenFieldMappingDialog method
    component.kpiCardComponent = {
      onOpenFieldMappingDialog: null,
      selectedTrendObject: null,
    } as any;

    spyOn(console, 'error');

    component.openProjectSettings('test-project');

    expect(console.error).toHaveBeenCalledWith(
      'FATAL ERROR: KpiCardV2 component reference is missing or does not have onOpenFieldMappingDialog method.',
    );
    expect(component.kpiCardComponent.selectedTrendObject).toBeNull();
  });

  it('should handle empty projectData in openProjectSettings', () => {
    component.projectData = { Project: [] };

    spyOn(console, 'error');

    component.openProjectSettings('any-project');

    expect(console.error).toHaveBeenCalledWith(
      'The complete object for project "any-project" was not found in the available project list.',
    );
  });

  it('should handle case insensitive project matching in openProjectSettings', () => {
    component.projectData = {
      Project: [
        {
          nodeId: '1',
          nodeName: 'CamelCase-Project',
          nodeDisplayName: 'CamelCase Project',
          basicProjectConfigId: 'config123',
        },
      ],
    };

    component.kpiCardComponent = {
      onOpenFieldMappingDialog: jasmine.createSpy('onOpenFieldMappingDialog'),
      selectedTrendObject: null,
    };

    // Test with different case
    component.openProjectSettings('CAMELCASE-PROJECT');

    expect(component.kpiCardComponent.selectedTrendObject).toEqual({
      nodeId: '1',
      nodeName: 'CamelCase-Project',
      basicProjectConfigId: 'config123',
    });
    expect(
      component.kpiCardComponent.onOpenFieldMappingDialog,
    ).toHaveBeenCalled();
  });
});
