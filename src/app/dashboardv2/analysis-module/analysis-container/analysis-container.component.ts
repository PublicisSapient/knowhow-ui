import { Component, ViewChild, OnInit } from '@angular/core';
import { KpiCardV2Component } from '../../kpi-card-v2/kpi-card-v2.component';
import { ToastModule } from 'primeng/toast';
import { HttpService } from '../../../services/http.service';
import { SharedService } from '../../../services/shared.service';
import { DynamicKpiTableComponent } from '../../../component/dynamic-kpi-table/dynamic-kpi-table.component';
import { Subscription } from 'rxjs';
import { GenericFilterComponent } from '../analysis-generic-filter/generic-filter.component';

interface SubColumn {
  label: string;
  dataSuffix: string;
  pipe?: string;
  isSortable: boolean;
  totalDataKey: string;
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
  imports: [KpiCardV2Component, ToastModule, DynamicKpiTableComponent,GenericFilterComponent,],
})
export class AnalysisContainerComponent implements OnInit {
  projectData: any;
  selectedProject: any;
  public kpiSettingsForTable: any;
  public kpiTableData: any[] = [];
  selectedProjects: string[] = [];
  subscriptions: Subscription[] = [];
  newAPIData: any;
  filterData: any = null;
  projectFilterConfig : any = null;
  sprintFilterConfig : any = null;

  // Used by DynamicKpiTableComponent
  projectHeaders: { name: string; cleanName: string }[] = [];
  subColumns: SubColumn[] = [];
  baseColumnHeader: string = '';
  summaryDisplayData: any;
  analyticsSummary: any;
  @ViewChild('kpiCard') kpiCardComponent!: KpiCardV2ComponentType;

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
            { issueCount: 70, efficiencyGain: 2.4, name: 'Project 1' },
            { issueCount: 50, efficiencyGain: 0.6, name: 'Project 2' },
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

    this.analyticsSummary = this.newAPIData.summary;

    this.processAnalyticsData(this.newAPIData);
    this.updateKpiSettings();
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
          number: value,
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

  updateKpiSettings() {
    this.kpiSettingsForTable = {
      kpiId: 'kpi198',
      kpiFilter: 'table',
      kpiDetail: {
        kpiInfo: 'Info here',
        kpiSource: 'Jira',
      },
      currentChartData: {
        chartData: this.kpiTableData,
        data: this.kpiTableData,
      },
      kpiName: 'AI Usage Analytics',
      projectHeaders: this.projectHeaders,
    };
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

  processAnalyticsData(apiData: any) {
    if (!apiData || !apiData.analytics) {
      this.kpiTableData = [];
      this.projectHeaders = [];
      this.subColumns = [];
      this.baseColumnHeader = '';
      this.summaryDisplayData = [];
      return;
    }

    // 0. Process the summary for display, generating names dynamically
    this.summaryDisplayData = this.processSummaryData(apiData.summary);

    // 1. Define the Base Column
    this.baseColumnHeader = 'usageType'; // The key in the final row will be 'usageType'

    // 2. Define the Sub-Columns (Two-level metrics)
    this.subColumns = [
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

    this.kpiTableData = [];
    this.projectHeaders = [];

    // 3. Generate Project Headers (including "Total")
    const allHeaders = [...this.selectedProjects, 'Total'];

    allHeaders.forEach((projectName) => {
      const cleanName = this.cleanName(projectName);
      this.projectHeaders.push({
        name: projectName === 'Total' ? 'Total' : projectName,
        cleanName: cleanName,
      });
    });

    let finalTotalEfficiencyGain = 0;
    let finalTotalIssueCount = 0;

    // 4. Flatten the Data (Creating Rows)
    apiData.analytics.forEach((usageTypeData: any) => {
      const row: any = {
        [this.baseColumnHeader]: usageTypeData.aiUsageType,
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

        // Numeric value for calculation (0 if missing/null/undefined)
        const efficiencyGainNumeric =
          this.getNumericValueForTotal(efficiencyGainValue);
        const issueCountNumeric = this.getNumericValueForTotal(issueCountValue);

        // Value for display ('N/A' if missing/null/undefined)
        // Use strict check for null and undefined to allow valid 0
        const efficiencyGainDisplay =
          efficiencyGainValue !== null && efficiencyGainValue !== undefined
            ? efficiencyGainValue
            : 'N/A';
        const issueCountDisplay =
          issueCountValue !== null && issueCountValue !== undefined
            ? issueCountValue
            : 'N/A';

        // Populate the row with the display value
        row[`${fieldNamePrefix}_efficiencyGain`] = efficiencyGainDisplay;
        row[`${fieldNamePrefix}_issueCount`] = issueCountDisplay;

        // Calculate the row total (horizontal) using the numeric value
        row.totalEfficiencyGain += efficiencyGainNumeric;
        row.totalIssueCount += issueCountNumeric;
      });

      this.kpiTableData.push(row);

      // Calculate the grand total (for the "Total" row)
      finalTotalEfficiencyGain += row.totalEfficiencyGain;
      finalTotalIssueCount += row.totalIssueCount;
    });

    // 5. Create the "Total" Row (Vertical)
    const totalRow: any = {
      [this.baseColumnHeader]: 'Total', // Key becomes 'usageType': 'Total'
      totalEfficiencyGain: finalTotalEfficiencyGain,
      totalIssueCount: finalTotalIssueCount,
    };

    this.selectedProjects.forEach((projectName) => {
      const fieldNamePrefix = this.cleanName(projectName);

      // Calculate the column total for each project
      const projectEfficiencyTotal = this.kpiTableData.reduce(
        (sum, row) =>
          sum +
          this.getNumericValueForTotal(
            row[`${fieldNamePrefix}_efficiencyGain`],
          ),
        0,
      );
      const projectIssuesTotal = this.kpiTableData.reduce(
        (sum, row) =>
          sum +
          this.getNumericValueForTotal(row[`${fieldNamePrefix}_issueCount`]),
        0,
      );

      // Populate the Total row with column totals (which are purely numeric)
      totalRow[`${fieldNamePrefix}_efficiencyGain`] = projectEfficiencyTotal;
      totalRow[`${fieldNamePrefix}_issueCount`] = projectIssuesTotal;
    });

    this.kpiTableData.push(totalRow);

    console.log('Final Headers (projectHeaders):', this.projectHeaders);
    console.log('Final SubColumns (subColumns):', this.subColumns);
    console.log('Final Table Data (kpiTableData):', this.kpiTableData);
    console.log('Base Column Header:', this.baseColumnHeader);
    console.log('Summary Data for Display:', this.summaryDisplayData);
  }

  removeProject(project: any) {}


  cleanName(name: string): string {
    if (!name) {
      return '';
    }
    return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
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
      if (
        this.kpiCardComponent &&
        this.kpiCardComponent.onOpenFieldMappingDialog
      ) {
        this.kpiCardComponent.selectedTrendObject = projectObject;
        this.kpiCardComponent.onOpenFieldMappingDialog();
      } else {
        console.error(
          'Reference to kpiCardComponent or onOpenFieldMappingDialog method is missing!',
        );
      }
    } else {
      console.error(
        `The complete object for project "${projectName}" was not found in the available project list.`,
      );
    }
  }
  handleFilterSelect(event) {
    if (Array.isArray(event)) {
      this.selectedProject = event;
    }
  }
}
