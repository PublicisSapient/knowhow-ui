import { Component, ViewChild, OnInit } from '@angular/core';
import { KpiCardV2Component } from '../../kpi-card-v2/kpi-card-v2.component';
import { ToastModule } from 'primeng/toast';
import { HttpService } from '../../../services/http.service';
import { SharedService } from '../../../services/shared.service';
import { DynamicKpiTableComponent } from '../../../component/dynamic-kpi-table/dynamic-kpi-table.component';
import { Subscription } from 'rxjs';
import { GenericFilterComponent } from '../analysis-generic-filter/generic-filter.component';
import { ButtonModule } from 'primeng/button';
import * as analysisConstant from '../analysis-constant';

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
  selectedSprint: any = {};
  selectedTab: any;

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

  selectedProjects: any = [];
  subscriptions: Subscription[] = [];
  filterData: any = null;
  projectFilterConfig: any = null;
  sprintFilterConfig: any = null;

  analyticsSummary: any;
  @ViewChild('kpiCard') kpiCardComponent!: KpiCardV2ComponentType;

  constructor(
    private httpService: HttpService,
    public service: SharedService,
  ) {}

  ngOnInit() {
    // const projectNames = new Set<string>();
    // this.selectedProjects = Array.from(projectNames);
    this.getProjectData();
    this.projectFilterConfig = analysisConstant.PROJECT_FILTER_CONFIG;
    this.sprintFilterConfig = analysisConstant.SPRINT_FILTER_CONFIG;
    this.selectedTab = analysisConstant.SELECTED_TAB_ANALYSIS_KEY;
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

  updateKpiSettings(type) {
    this.aiUsageKpiSettings = analysisConstant.AI_USES_TABLE_DUMMY_KPI;
    this.metricsKpiSettings = analysisConstant.MATRICS_TABLE_DUMMY_KPI;
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
            const filteredProjects = allData
              .filter((item: any) => item.labelName === 'project')
              .sort((a, b) =>
                a.nodeDisplayName.localeCompare(b.nodeDisplayName, 'en', {
                  sensitivity: 'base',
                }),
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
              Sprint: analysisConstant.SPRINT_FILTER_OPTIONS,
            };
            this.selectedProjects = [
              this.filterData[analysisConstant.PROJECT_KEY][1],
            ];
            this.selectedSprint =
              this.filterData[analysisConstant.SPRINT_KEY][2];
            this.processProjectData(this.projectData);
            this.payloadPreparasation();
          }
        }),
    );
  }

  processProjectData(data: any) {}

  private processAiUsageTableData(apiData: any) {
    const projectNames = new Set<string>();
    apiData?.analytics?.forEach((type: any) => {
      type.projects?.forEach((project: any) => {
        projectNames.add(project.name);
      });
    });

    // this.selectedProjects = Array.from(projectNames);

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
      const isTotal = projectName === 'Total';
      const displayName = isTotal ? 'Total' : projectName.nodeDisplayName;

      const cleanName = this.cleanName(displayName);

      this.aiUsageProjectHeaders.push({
        name: displayName,
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
        const projectData = projectsMap.get(projectName.nodeName);
        const fieldNamePrefix = this.cleanName(projectName.nodeDisplayName);

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
      const fieldNamePrefix = this.cleanName(projectName.nodeDisplayName);

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
    const allProjects =
      this.selectedProjects.map((data) => data.nodeDisplayName) || [];
    const allSprints = [
      ...new Set(
        apiData.analytics.flatMap((a) =>
          a.projects.flatMap((p) => p.sprints.map((s) => s.sprint)),
        ),
      ),
    ];

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
      const metricDescription = metricData.metric;

      const projectsDataMap = new Map<string, any>();
      metricData.projects.forEach((projectData: any) => {
        projectsDataMap.set(projectData.name, projectData.sprints);
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

          const dataKey = `${projectPrefix}${this.metricsSubColumns[0].dataSuffix}`;
          const projectData = projectsDataMap.get(projectName);
          if (projectData) {
            const sprintData = projectData.find(
              (sprint: any) => sprint.sprint === sprintName,
            );
            if (sprintData) {
              newRow[dataKey] = `${sprintData.value} (${sprintData.trend})`;
            } else {
              newRow[dataKey] = 'NA';
            }
          } else {
            newRow[dataKey] = 'NA';
          }
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

  removeProject(project: any) {
    if (this.selectedProjects.length === 1) {
      return;
    }

    this.selectedProjects = [
      ...this.selectedProjects.filter(
        (item: any) => item.nodeId !== project.nodeId,
      ),
    ];

    this.payloadPreparasation();
  }

  cleanName(name: string): string {
    if (!name) {
      return '';
    }

    if (typeof name !== 'string') {
      console.error('cleanName received non-string input:', name);
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
    console.log(`Settings for project: ${projectName} clicked.`);

    const lowerCaseProjectName = projectName?.toLowerCase();

    const projectObject = this.projectData[analysisConstant.PROJECT_KEY]?.find(
      (p: any) =>
        p.nodeName?.toLowerCase() === lowerCaseProjectName ||
        p.nodeDisplayName?.toLowerCase() === lowerCaseProjectName,
    );

    const trendObject: SelectedTrend = projectObject
      ? {
          nodeId: projectObject.nodeId,
          nodeName: projectObject.nodeName,
          basicProjectConfigId: projectObject.basicProjectConfigId,
        }
      : null;

    if (trendObject) {
      this.kpiCardComponent.selectedTrendObject = trendObject;

      if (
        this.kpiCardComponent &&
        this.kpiCardComponent.onOpenFieldMappingDialog
      ) {
        this.kpiCardComponent.onOpenFieldMappingDialog();
      } else {
        console.error(
          'FATAL ERROR: KpiCardV2 component reference is missing or does not have onOpenFieldMappingDialog method.',
        );
        this.kpiCardComponent.selectedTrendObject = null;
      }
    } else {
      console.error(
        `The complete object for project "${projectName}" was not found in the available project list.`,
      );
    }
  }

  handleFilterSelect(event: any) {
    if (event.type === analysisConstant.PROJECT_KEY) {
      this.selectedProjects = event['value'];
      this.payloadPreparasation();
    } else {
      this.selectedSprint = event['value'];
      this.payloadPreparasation();
    }
  }

  payloadPreparasation() {
    const proejctAlongWithSprint = {};
    this.selectedProjects.forEach((project) => {
      const allSprintsForAProject = this.projectData[
        analysisConstant.SPRINT_KEY
      ].filter((sprintDetails) => sprintDetails.parentId === project.nodeId);
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

    const projectBasicConfigIds = this.selectedProjects.map(
      (p: any) => p.basicProjectConfigId,
    );

    const payload = {
      project: Object.keys(latestClosedSprintsPerProject),
      sprint: Object.values(latestClosedSprintsPerProject).flat(),
    };

    const aiPayload = {
      numberOfSprintsToInclude: parseInt(this.selectedSprint.nodeId || '2'),
      projectBasicConfigIds: projectBasicConfigIds,
    };

    console.log('api will hit from here', payload);

    // GET Matrics Table Data
    this.httpService.getAlalyticsMatricesTableData(payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.processMetricsTableData(response.data);
        } else {
          console.warn('Did not get data from API');
          this.metricsTableData = [];
          this.updateKpiSettings('');
        }
      },
      error: (error) => {
        console.error('Error fetching Matrix Data:', error);
        this.metricsTableData = [];
        this.updateKpiSettings('');
      },
    });

    //GET AI analytics Data
    this.subscriptions.push(
      this.httpService.getAIAnalyticsData(aiPayload).subscribe({
        next: (response: any) => {
          const apiData = response?.data;
          if (apiData && apiData.analytics?.length > 0) {
            this.processAiUsageTableData(apiData);
          } else {
            console.warn(
              'AI Analytics API returned empty data or was not in the expected format.',
            );
            this.aiUsageTableData = [];
            this.updateKpiSettings('aiUsage');
          }
        },
        error: (error) => {
          console.error('Error fetching AI Analytics Data:', error);
          this.aiUsageTableData = [];
          this.updateKpiSettings('aiUsage');
        },
      }),
    );
  }
}
