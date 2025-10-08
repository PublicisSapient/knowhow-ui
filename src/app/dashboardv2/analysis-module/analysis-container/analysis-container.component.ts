import { Component, ViewChild, OnInit } from '@angular/core';
import { KpiCardV2Component } from '../../kpi-card-v2/kpi-card-v2.component';
import { ToastModule } from 'primeng/toast';
import { HttpService } from '../../../services/http.service';
import { SharedService } from '../../../services/shared.service';
import { DynamicKpiTableComponent } from '../../../component/dynamic-kpi-table/dynamic-kpi-table.component';
import { Subscription } from 'rxjs';
import { GenericFilterComponent } from '../analysis-generic-filter/generic-filter.component';
import { ButtonModule } from 'primeng/button';

interface SubColumn {
  label: string;
  dataSuffix: string;
  pipe?: string;
  isSortable: boolean;
  totalDataKey: string;
}

interface ProjectHeader {
  name: string;
  cleanName: string;
  isTotalColumn?: boolean;
}

interface SelectedTrend {
  nodeId: string;
  nodeName: string;
  basicProjectConfigId: string;
}

interface KpiCardV2ComponentType {
  onOpenFieldMappingDialog: () => void;
  selectedTrendObject: SelectedTrend | null;
}

export interface AnalyticsSummary {
  number: string;
  summaryName: string;
}

@Component({
  selector: 'app-analysis-container',
  templateUrl: './analysis-container.component.html',
  styleUrls: ['./analysis-container.component.css'],
  standalone: true,
  imports: [
    KpiCardV2Component,
    ToastModule,
    DynamicKpiTableComponent,
    GenericFilterComponent,
    ButtonModule,
  ],
})
export class AnalysisContainerComponent implements OnInit {
  projectData: any;
  selectedProject: any;
  selectedSprint: any = {};

  // --- VARIABLES FOR AI USAGE TABLE ---
  public aiUsageKpiSettings: any;
  public aiUsageTableData: any[] = [];
  aiUsageProjectHeaders: ProjectHeader[] = [];
  aiUsageSubColumns: SubColumn[] = [];
  aiUsageBaseColumnHeader: string = '';
  aiUsageSummaryDisplayData: AnalyticsSummary[] = [];

  // --- VARIABLES FOR METRICS TABLE ---
  public metricsKpiSettings: any;
  public metricsTableData: any[] = [];
  metricsProjectHeaders: ProjectHeader[] = [];
  metricsSubColumns: SubColumn[] = [];
  metricsBaseColumnHeader: string = '';
  metricsBaseColumnHeader2: string = '';
  metricsSummaryDisplayData: AnalyticsSummary[] = [];

  selectedProjects: string[] = [];
  subscriptions: Subscription[] = [];
  newAPIData: any;
  filterData: any = null;
  projectFilterConfig: any = null;
  sprintFilterConfig: any = null;

  analyticsSummary: any;
  @ViewChild('kpiCard') kpiCardComponent!: KpiCardV2ComponentType;

  metricsAPIData = {
    analytics: [
      {
        metricDescription:
          'Stories still in Grooming status on Day 1 of current sprint',
        metricKey: 'groomingStories',
        projects: [
          {
            projectName: 'Buy & Deliver',
            sprint45Value: '3',
            sprint44Value: '2',
          },
          {
            projectName: 'ASO Mobile App',
            sprint45Value: '1',
            sprint44Value: '0',
          },
          {
            projectName: 'Career Growth Tool',
            sprint45Value: '5',
            sprint44Value: '6',
          },
          {
            projectName: 'Dotcom',
            sprint45Value: '2',
            sprint44Value: '1',
          },
        ],
      },
      {
        metricDescription: '% of Stories that are not dev completed',
        metricKey: 'devCompletionDelay',
        projects: [
          {
            projectName: 'Buy & Deliver',
            sprint45Value: '15',
            sprint44Value: '12',
          },
          {
            projectName: 'ASO Mobile App',
            sprint45Value: '8',
            sprint44Value: '5',
          },
          {
            projectName: 'Career Growth Tool',
            sprint45Value: '22',
            sprint44Value: '20',
          },
          {
            projectName: 'Dotcom',
            sprint45Value: '18',
            sprint44Value: '14',
          },
        ],
      },
    ],
    sprintNames: ['Sprint 45', 'Sprint 44'],
    projectNames: [
      'Buy & Deliver',
      'ASO Mobile App',
      'Career Growth Tool',
      'Dotcom',
    ],
  };

  constructor(
    private httpService: HttpService,
    public service: SharedService,
  ) {}

  ngOnInit() {
    this.newAPIData = {
      summary: {
        averageEfficiencyGainPerAiUsageType: 214,
        averageEfficiencyGainPerProject: 534,
        usageTypesNumber: 10,
        projectsNumber: 5,
      },
      analytics: [
        {
          aiUsageType: 'Usage type 1',
          projects: [
            { issueCount: 20, efficiencyGain: 5.1, name: 'Project 1' },
            { issueCount: 30, efficiencyGain: 0.1, name: 'KnowHow' },
            {
              issueCount: 50,
              efficiencyGain: 2.2,
              name: 'Travel Insurance',
            },
          ],
        },
        {
          aiUsageType: 'Usage type 2',
          projects: [
            { issueCount: 80, efficiencyGain: 4.2, name: 'Project 1' },
            { issueCount: 40, efficiencyGain: 2.1, name: 'Project 2' },
          ],
        },
        {
          aiUsageType: 'Usage type 3',
          projects: [
            { issueCount: 70, efficiencyGain: 2.4, name: 'Project A' },
            { issueCount: 50, efficiencyGain: 0.6, name: 'Project D' },
          ],
        },
      ],
    };

    const projectNames = new Set<string>();
    this.newAPIData.analytics.forEach((type: any) => {
      type.projects.forEach((project: any) => {
        projectNames.add(project.name);
      });
    });
    this.selectedProjects = Array.from(projectNames);

    this.processMetricsTableData(this.metricsAPIData);
    this.processAiUsageTableData(this.newAPIData);

    this.getProjectData();
    this.projectFilterConfig = {
      type: 'multiSelect',
      defaultLevel: {
        labelName: 'Project',
      },
    };

    this.sprintFilterConfig = {
      type: 'singleSelect',
      defaultLevel: {
        labelName: 'Sprint',
      },
    };
  }

  private processSummaryData(summary: any): AnalyticsSummary[] {
    if (!summary) {
      return [];
    }

    const summaryArray: AnalyticsSummary[] = [];

    for (const key in summary) {
      if (summary.hasOwnProperty(key)) {
        const value = summary[key];
        const displayName = this.camelCaseToTitleCase(key);

        summaryArray.push({
          number: typeof value === 'number' ? value.toFixed(1) : value,
          summaryName: displayName,
        });
      }
    }

    return summaryArray;
  }

  private camelCaseToTitleCase(camelCase: string): string {
    if (!camelCase) return '';

    const result = camelCase.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
  }

  updateKpiSettings(type: 'aiUsage' | 'metrics') {
    const kpiSettings = {
      kpiId: 'kpi198',
      kpiFilter: 'table',
      kpiDetail: {
        kpiInfo: 'Info here',
        kpiSource: 'Jira',
      },
      kpiName: type === 'aiUsage' ? 'AI Usage Analytics' : 'Metrics Analytics',
    };

    if (type === 'aiUsage') {
      this.aiUsageKpiSettings = {
        ...kpiSettings,
        currentChartData: {
          chartData: this.aiUsageTableData,
          data: this.aiUsageTableData,
        },
        projectHeaders: this.aiUsageProjectHeaders,
      };
    } else if (type === 'metrics') {
      this.metricsKpiSettings = {
        ...kpiSettings,
        currentChartData: {
          chartData: this.metricsTableData,
          data: this.metricsTableData,
        },
        projectHeaders: this.metricsProjectHeaders,
        baseColumnHeader2: this.metricsBaseColumnHeader2,
        subColumns: this.metricsSubColumns,
      };
    }
  }

  getProjectData() {
    const selectedFilterData = {};
    selectedFilterData['kanban'] = false;
    selectedFilterData['sprintIncluded'] = ['CLOSED', 'ACTIVE'];
    this.subscriptions.push(
      this.httpService
        .getFilterData(selectedFilterData)
        .subscribe((filterApiData) => {
          if (filterApiData['success']) {
            const allData = filterApiData['data'];
            const filteredProjects = allData.filter(
              (item: any) => item.labelName === 'project',
            );

            const filteredSprint = allData.filter(
              (item: any) => item.labelName === 'sprint',
            );

            this.projectData = {
              Project: filteredProjects,
              Sprint: filteredSprint,
            };

            this.filterData = {
              Project: filteredProjects,
              Sprint: [
                {
                  nodeId: '2',
                  nodeName: 'Last 2 Sprint',
                  nodeDisplayName: 'Last 2 Sprint',
                  labelName: 'sprint',
                },
                {
                  nodeId: '4',
                  nodeName: 'Last 4 Sprint',
                  nodeDisplayName: 'Last 4 Sprint',
                  labelName: 'sprint',
                },
                {
                  nodeId: '6',
                  nodeName: 'Last 6 Sprint',
                  nodeDisplayName: 'Last 6 Sprint',
                  labelName: 'sprint',
                },
                {
                  nodeId: '8',
                  nodeName: 'Last 8 Sprint',
                  nodeDisplayName: 'Last 8 Sprint',
                  labelName: 'sprint',
                },
              ],
            };

            this.processProjectData(this.projectData);
          }
        }),
    );
  }

  processProjectData(data: any) {}

  private processAiUsageTableData(apiData: any) {
    // 1. Define the Base Column
    this.aiUsageBaseColumnHeader = 'Usage Type';

    // 2. Define the Sub-Columns (Two-level metrics)
    this.aiUsageSubColumns = [
      {
        label: 'Efficiency gain',
        dataSuffix: '_efficiencyGain',
        pipe: '1.2-2',
        isSortable: true,
        totalDataKey: 'totalEfficiencyGain',
      },
      {
        label: 'Issue count',
        dataSuffix: '_issueCount',
        pipe: undefined,
        isSortable: true,
        totalDataKey: 'totalIssueCount',
      },
    ];

    this.aiUsageTableData = [];
    this.aiUsageProjectHeaders = [];
    this.aiUsageSummaryDisplayData = this.processSummaryData(apiData.summary);

    // 3. Generate Project Headers (including "Total")
    const allHeaders = [...this.selectedProjects, 'Total'];

    allHeaders.forEach((projectName) => {
      const cleanName = this.cleanName(projectName);
      const isTotal = projectName === 'Total';

      this.aiUsageProjectHeaders.push({
        name: projectName === 'Total' ? 'Total' : projectName,
        cleanName: cleanName,
        isTotalColumn: isTotal,
      });
    });

    let finalTotalEfficiencyGain = 0;
    let finalTotalIssueCount = 0;

    // 4. Flatten the Data (Creating Rows)
    apiData.analytics.forEach((usageTypeData: any) => {
      const row: any = {
        usageType: usageTypeData.aiUsageType,
        totalEfficiencyGain: 0,
        totalIssueCount: 0,
      };

      const projectsMap = new Map<string, any>();
      usageTypeData.projects.forEach((projectData: any) => {
        projectsMap.set(projectData.name, projectData);
      });

      this.selectedProjects.forEach((projectName) => {
        const projectData = projectsMap.get(projectName);
        const fieldNamePrefix = this.cleanName(projectName);

        const efficiencyGainValue = projectData?.efficiencyGain;
        const issueCountValue = projectData?.issueCount;

        const efficiencyGainNumeric =
          this.getNumericValueForTotal(efficiencyGainValue);
        const issueCountNumeric = this.getNumericValueForTotal(issueCountValue);

        const efficiencyGainDisplay =
          efficiencyGainValue !== null && efficiencyGainValue !== undefined
            ? efficiencyGainValue
            : 'N/A';
        const issueCountDisplay =
          issueCountValue !== null && issueCountValue !== undefined
            ? issueCountValue
            : 'N/A';

        row[`${fieldNamePrefix}_efficiencyGain`] = efficiencyGainDisplay;
        row[`${fieldNamePrefix}_issueCount`] = issueCountDisplay;

        row.totalEfficiencyGain += efficiencyGainNumeric;
        row.totalIssueCount += issueCountNumeric;
      });

      this.aiUsageTableData.push(row);

      finalTotalEfficiencyGain += row.totalEfficiencyGain;
      finalTotalIssueCount += row.totalIssueCount;
    });

    // 5. Create the "Total" Row (Vertical)
    const totalRow: any = {
      usageType: 'Total',
      isTotalRow: true,
      totalEfficiencyGain: finalTotalEfficiencyGain,
      totalIssueCount: finalTotalIssueCount,
    };

    this.selectedProjects.forEach((projectName) => {
      const fieldNamePrefix = this.cleanName(projectName);

      const projectEfficiencyTotal = this.aiUsageTableData.reduce(
        (sum, row) =>
          sum +
          this.getNumericValueForTotal(
            row[`${fieldNamePrefix}_efficiencyGain`],
          ),
        0,
      );
      const projectIssuesTotal = this.aiUsageTableData.reduce(
        (sum, row) =>
          sum +
          this.getNumericValueForTotal(row[`${fieldNamePrefix}_issueCount`]),
        0,
      );

      totalRow[`${fieldNamePrefix}_efficiencyGain`] = projectEfficiencyTotal;
      totalRow[`${fieldNamePrefix}_issueCount`] = projectIssuesTotal;
    });

    this.aiUsageTableData.push(totalRow);

    this.aiUsageBaseColumnHeader = 'usageType';

    this.updateKpiSettings('aiUsage');
  }

  private processMetricsTableData(apiData: any) {
    const allProjects = apiData.projectNames || [];
    const allSprints = apiData.sprintNames || [];

    // 1. Set the dynamic headers: Projects
    let projectHeaders: ProjectHeader[] = allProjects.map(
      (projectName: string) => ({
        name: projectName,
        cleanName: this.cleanName(projectName),
        isTotalColumn: false,
      }),
    );

    // 2. Add Sprint Name as the first dynamic header
    const sprintHeader: ProjectHeader = {
      name: 'Sprint',
      cleanName: 'sprintName',
      isTotalColumn: false,
    };

    // Move "Sprint" to the first position in the dynamic headers list
    this.metricsProjectHeaders = [sprintHeader, ...projectHeaders];

    // 3. Define a single, empty technical sub-column. This forces the table
    // to render in the complex mode (CASE 1) without a visible Level 2 header.
    this.metricsSubColumns = [
      {
        label: '',
        dataSuffix: '_value',
        pipe: undefined,
        isSortable: false,
        totalDataKey: '',
      },
    ];

    this.metricsTableData = [];
    this.metricsSummaryDisplayData = this.processSummaryData(apiData.summary);

    const finalTableData: any[] = [];
    let rowIndex = 0;

    // 4. Data Transformation (Creating Rows)
    apiData.analytics.forEach((metricData: any) => {
      const metricDescription = metricData.metricDescription;

      const projectsDataMap = new Map<string, any>();
      metricData.projects.forEach((projectData: any) => {
        projectsDataMap.set(projectData.projectName, projectData);
      });

      // Iterate through each Sprint to create distinct rows
      allSprints.forEach((sprintName: string, index: number) => {
        const sprintPrefix = this.cleanName(sprintName);

        const newRow: any = {
          Metrics: index === 0 ? metricDescription : '\u00A0',
          rowId: rowIndex++,
        };

        // Data key for the Sprint column (e.g., sprintName_value)
        const sprintDataKey = `${sprintHeader.cleanName}${this.metricsSubColumns[0].dataSuffix}`;
        newRow[sprintDataKey] = sprintName;

        // Iterate through Projects to populate dynamic columns
        allProjects.forEach((projectName) => {
          const projectPrefix = this.cleanName(projectName);

          // Value key from the API data (e.g., 'sprint45Value')
          const valueKey = `${sprintPrefix}Value`;
          const projectData = projectsDataMap.get(projectName);

          const dataKey = `${projectPrefix}${this.metricsSubColumns[0].dataSuffix}`;

          newRow[dataKey] = projectData ? projectData[valueKey] : 'N/A';
        });

        finalTableData.push(newRow);
      });
    });

    this.metricsTableData = finalTableData;

    // 5. Setting Base Column Headers
    this.metricsBaseColumnHeader = 'Metrics'; // First fixed column (visible)
    this.metricsBaseColumnHeader2 = 'rowId'; // Second fixed column (technical/invisible)

    this.updateKpiSettings('metrics');
  }

  processAnalyticsData(apiData: any) {
    this.processAiUsageTableData(apiData);
  }

  removeProject(project: any) {}

  cleanName(name: string): string {
    if (!name) {
      return '';
    }
    let cleaned = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '');
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }

  private getNumericValueForTotal(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    return 0;
  }

  openProjectSettings(projectName: string) {
    console.log(`Settings for project: ${projectName}`);

    const lowerCaseProjectName = projectName?.toLowerCase();

    const projectObject = this.projectData['Project']?.find(
      (p: any) =>
        p.nodeName?.toLowerCase() === lowerCaseProjectName ||
        p.nodeDisplayName?.toLowerCase() === lowerCaseProjectName,
    );

    if (projectObject) {
      console.warn(
        'Project settings are open, but we do not know which kpiCard to use.',
      );
    } else {
      console.error(
        `The complete object for project "${projectName}" was not found in the available project list.`,
      );
    }
  }

  handleFilterSelect(event: any) {
    if (event.type === 'Project') {
      this.selectedProject = event['value'];
      this.payloadPreparasation(event.type);
    } else {
      this.selectedSprint = event['value'];
      this.payloadPreparasation(event.type);
    }
  }

  payloadPreparasation(changeType) {
    const proejctAlongWithSprint = {};
    this.selectedProject.forEach((project) => {
      const allSprintsForAProject = this.projectData['Sprint'].filter(
        (sprintDetails) => sprintDetails.parentId === project.nodeId,
      );
      proejctAlongWithSprint[project.nodeId] = allSprintsForAProject;
    });

    const latestClosedSprintsPerProject = Object.fromEntries(
      Object.entries(proejctAlongWithSprint).map(([projectId, sprints]) => {
        const latestClosed = (sprints as any[])
          .filter((s: any) => s.sprintState === 'CLOSED')
          .sort(
            (a: any, b: any) =>
              new Date(b.sprintEndDate).getTime() -
              new Date(a.sprintEndDate).getTime(),
          )
          .slice(0, this.selectedSprint.nodeId || 2)
          .map((s: any) => s.nodeId);
        return [projectId, latestClosed];
      }),
    );

    const payload = {
      project: Object.keys(latestClosedSprintsPerProject),
      sprint: Object.values(latestClosedSprintsPerProject).flat(),
    };

    // GET Matrics Table Data
    this.httpService.getAlalyticsMatricesTableData(payload).subscribe({
      next: (response) => {},
      error: (error) => {},
    });

    // GET AI analytics Data
    this.httpService.getAIAnalyticsData(payload).subscribe({
      next: (response) => {},
      error: (error) => {},
    });
  }
}
