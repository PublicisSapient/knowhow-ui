import { Component, OnInit } from '@angular/core';
import { PrimaryFilterComponent } from '../../filter-v2/primary-filter/primary-filter.component';
import { ParentFilterComponent } from '../../filter-v2/parent-filter/parent-filter.component';
import { KpiCardV2Component } from '../../kpi-card-v2/kpi-card-v2.component';
import { ToastModule } from 'primeng/toast';
import { NgIf } from '@angular/common';
import { HttpService } from '../../../services/http.service';
import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-analysis-container',
  templateUrl: './analysis-container.component.html',
  styleUrls: ['./analysis-container.component.css'],
  standalone: true,
  imports: [
    PrimaryFilterComponent,
    ParentFilterComponent,
    KpiCardV2Component,
    ToastModule,
    NgIf,
  ],
})
export class AnalysisContainerComponent implements OnInit {
  projectData: any;
  sprintData: any;
  selectedProject: any;
  projectFilterConfig: any;
  sprintFilterConfig: any;
  public kpiSettingsForTable: any;
  public kpiTableData: any[];
  public kpiTableColumns: any[];
  selectedProjects: string[];
  subscriptions: any[] = [];
  public selectedFilterLevel = 'Project';
  newAPIData: any;
  private projectHeaders: { name: string, cleanName: string }[] = [];

  constructor(
    private httpService: HttpService,
    public service: SharedService,
  ) {}

  ngOnInit() {
    this.projectFilterConfig = {
      name: 'Project',
      labelName: 'Project',
    };

    this.sprintFilterConfig = {
      labelName: 'Sprint',
      inputType: 'singleSelect',
    };

    this.sprintData = {
      Sprint: [
        { nodeId: 'sprint1', nodeDisplayName: 'Sprint 1' },
        { nodeId: 'sprint2', nodeDisplayName: 'Sprint 2' },
      ],
    };

    this.kpiSettingsForTable = {
      kpiDetail: {
        kpiFilter: 'table',
        kpiId: '12345',
        kpiInfo: 'Info here',
      },
      currentChartData: {
        chartData: this.kpiTableData,
        data: this.kpiTableData,
      },
      kpiName: 'AI Usage Analytics',
      projectHeaders: this.projectHeaders,
    };

    this.selectedProjects = ['Project 1', 'Project 2', 'Project 3'];

    this.newAPIData = {
      "aggregations": {
        "averageEfficiencyGainPerAiUsageType": 0,
        "averageEfficiencyGainPerProject": 0,
        "usageTypesNumber": 0,
        "projectsNumber": 0
      },
      "aiUsageTypeAnalytics": [
        {
          "aiUsageType": "Usage type 1",
          "projectsAiUsageAnalytics": [
            { "issueCount": 20, "efficiencyGain": 0.2, "projectName": "Project 1" },
            { "issueCount": 30, "efficiencyGain": 0.1, "projectName": "Project 2" }
          ]
        },
        {
          "aiUsageType": "Usage type 2",
          "projectsAiUsageAnalytics": [
            { "issueCount": 20, "efficiencyGain": 0.2, "projectName": "Project 1" },
            { "issueCount": 30, "efficiencyGain": 0.1, "projectName": "Project 2" }
          ]
        }
      ]
    };

    this.processAnalyticsData(this.newAPIData);
    this.getProjectData();
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
              (item) => item.labelName === 'project',
            );
            this.service.setFilterData({
              Project: filteredProjects['Project'],
            });
            this.projectData = {
              Project: filteredProjects,
            };

            this.processProjectData(this.projectData);
          }
        }),
    );
  }

  processProjectData(data) {
  }

  processAnalyticsData(apiData: any) {
    if (!apiData || !apiData.aiUsageTypeAnalytics) {
      this.kpiTableData = [];
      this.kpiTableColumns = [{ field: 'usageType', header: 'Usage Type' }];
      this.projectHeaders = [];
      return;
    }

    this.kpiTableData = [];
    this.kpiTableColumns = [{ field: 'usageType', header: 'Usage Type' }];
    this.projectHeaders = [];

    const allHeaders = [...this.selectedProjects, 'Total'];

    allHeaders.forEach(projectName => {
      const cleanName = this.cleanName(projectName);

      this.projectHeaders.push({
        name: projectName === 'Total' ? 'Total' : projectName,
        cleanName: cleanName
      });

      if (projectName !== 'Total') {
        this.kpiTableColumns.push(
          { field: `${cleanName}_efficiencyGain`, header: `${projectName} (Efficiency gain)` },
          { field: `${cleanName}_issueCount`, header: 'Issue count' }
        );
      }
    });

    this.kpiTableColumns.push(
      { field: 'totalEfficiencyGain', header: 'Total (Efficiency gain)' },
      { field: 'totalIssueCount', header: 'Total (Issue count)' }
    );

    this.kpiSettingsForTable = { ...this.kpiSettingsForTable, projectHeaders: this.projectHeaders };

    let finalTotalEfficiencyGain = 0;
    let finalTotalIssueCount = 0;

    apiData.aiUsageTypeAnalytics.forEach((usageTypeData: any) => {
      const row: any = {
        usageType: usageTypeData.aiUsageType,
        totalEfficiencyGain: 0,
        totalIssueCount: 0
      };

      const projectsMap = new Map<string, any>();
      usageTypeData.projectsAiUsageAnalytics.forEach((projectData: any) => {
        projectsMap.set(projectData.projectName, projectData);
      });

      this.selectedProjects.forEach(projectName => {
        const projectData = projectsMap.get(projectName);
        const fieldNamePrefix = this.cleanName(projectName);

        const efficiencyGain = projectData?.efficiencyGain || 0;
        const issueCount = projectData?.issueCount || 0;

        row[`${fieldNamePrefix}_efficiencyGain`] = efficiencyGain;
        row[`${fieldNamePrefix}_issueCount`] = issueCount;

        row.totalEfficiencyGain += efficiencyGain;
        row.totalIssueCount += issueCount;
      });

      this.kpiTableData.push(row);

      finalTotalEfficiencyGain += row.totalEfficiencyGain;
      finalTotalIssueCount += row.totalIssueCount;
    });

    const totalRow: any = {
      usageType: 'Total',
      totalEfficiencyGain: finalTotalEfficiencyGain,
      totalIssueCount: finalTotalIssueCount,
    };

    this.selectedProjects.forEach(projectName => {
      const fieldNamePrefix = this.cleanName(projectName);

      const projectEfficiencyTotal = this.kpiTableData.reduce((sum, row) => sum + (row[`${fieldNamePrefix}_efficiencyGain`] || 0), 0);
      const projectIssuesTotal = this.kpiTableData.reduce((sum, row) => sum + (row[`${fieldNamePrefix}_issueCount`] || 0), 0);

      totalRow[`${fieldNamePrefix}_efficiencyGain`] = projectEfficiencyTotal;
      totalRow[`${fieldNamePrefix}_issueCount`] = projectIssuesTotal;
    });

    this.kpiTableData.push(totalRow);
  }

  handleProjectFilterChange($event: any) {}

  handleSprintFilterChange($event: any) {}

  removeProject(project: any) {}


  cleanName(name: string): string {
    if (!name) {
      return '';
    }

    return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
}
