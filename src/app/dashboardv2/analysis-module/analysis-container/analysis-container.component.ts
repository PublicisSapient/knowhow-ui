import { Component, OnInit } from '@angular/core';
import { PrimaryFilterComponent } from '../../filter-v2/primary-filter/primary-filter.component';
import { ParentFilterComponent } from '../../filter-v2/parent-filter/parent-filter.component';
import { KpiCardV2Component } from '../../kpi-card-v2/kpi-card-v2.component';
import { ToastModule } from 'primeng/toast';
import { NgIf } from '@angular/common';
import { HttpService } from '../../../services/http.service';
import { SharedService } from '../../../services/shared.service';
import { FilterNewComponent } from '../../filter-v2/filter-new.component';
import { AdditionalFilterComponent } from '../../filter-v2/additional-filter/additional-filter.component';

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
    FilterNewComponent,
    AdditionalFilterComponent,
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
  selectedProjects: any;
  subscriptions: any[] = [];
  public selectedFilterLevel = 'Project';

  constructor(
    private httpService: HttpService,
    public service: SharedService,
  ) {}

  ngOnInit() {
    this.projectFilterConfig = {
      name: 'Project',
      labelName: 'Project',
    };

    this.sprintFilterConfig = [
      {
        filterId: 'sprint',
        labelName: 'Sprint',
        inputType: 'singleSelect',
        defaultLevel: { labelName: 'Sprint' },
      },
    ];

    this.sprintData = {
      Sprint: [
        { nodeId: 'sprint1', nodeDisplayName: 'Sprint 1' },
        { nodeId: 'sprint2', nodeDisplayName: 'Sprint 2' },
        //... alte sprinturi
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
    };

    this.kpiTableColumns = [
      { field: 'usageType', header: 'Usage Type' },
      { field: 'buyAndDeliver', header: 'Buy & Deliver' },
      { field: 'asoMobileApp', header: 'ASO Mobile App' },
      { field: 'careerGrowthTool', header: 'Career Growth Tool' },
      { field: 'dotcom', header: 'Dotcom' },
      { field: 'total', header: 'Total' },
    ];

    this.kpiTableData = [
      {
        usageType: 'Content usage Test Practice',
        buyAndDeliver: 89,
        asoMobileApp: 156,
        careerGrowthTool: 67,
        dotcom: 92,
        total: 404,
      },
      {
        usageType: 'Refactoring and Optimization',
        buyAndDeliver: 78,
        asoMobileApp: 45,
        careerGrowthTool: 123,
        dotcom: 34,
        total: 280,
      },
      {
        usageType: 'Refactoring and Documentation',
        buyAndDeliver: 45,
        asoMobileApp: 67,
        careerGrowthTool: 23,
        dotcom: 89,
        total: 224,
      },
      {
        usageType: 'Unit Coverage',
        buyAndDeliver: 34,
        asoMobileApp: 78,
        careerGrowthTool: 56,
        dotcom: 45,
        total: 213,
      },
      {
        usageType: 'Bug Fixes',
        buyAndDeliver: 67,
        asoMobileApp: 23,
        careerGrowthTool: 89,
        dotcom: 34,
        total: 213,
      },
      {
        usageType: 'Generate New Code',
        buyAndDeliver: 23,
        asoMobileApp: 45,
        careerGrowthTool: 34,
        dotcom: 67,
        total: 169,
      },
      {
        usageType: 'Creating New Code',
        buyAndDeliver: 56,
        asoMobileApp: 34,
        careerGrowthTool: 45,
        dotcom: 23,
        total: 158,
      },
      {
        usageType: 'Understanding Code Config',
        buyAndDeliver: 34,
        asoMobileApp: 56,
        careerGrowthTool: 23,
        dotcom: 45,
        total: 158,
      },
      {
        usageType: 'Debugging and Error Handling',
        buyAndDeliver: 45,
        asoMobileApp: 23,
        careerGrowthTool: 56,
        dotcom: 34,
        total: 158,
      },
      {
        usageType: 'Test Coverage',
        buyAndDeliver: 23,
        asoMobileApp: 34,
        careerGrowthTool: 45,
        dotcom: 56,
        total: 158,
      },
      {
        usageType: 'Total',
        buyAndDeliver: 494,
        asoMobileApp: 561,
        careerGrowthTool: 561,
        dotcom: 519,
        total: 2135,
      },
    ];

    // console.log(this.kpiTableColumns);
    // console.log(this.kpiTableData);
    this.getProjectData();
    console.log(this.sprintData);
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

            console.log('Datele au sosit:', this.projectData);

            this.processProjectData(this.projectData);
          }
        }),
    );
  }

  processProjectData(data) {
    // Aici poți face sortări, mapări, sau orice logică complexă
    // de care are nevoie app-parent-filter.
  }

  handleProjectFilterChange($event: any) {}

  handleSprintFilterChange($event: any) {}

  removeProject(project: any) {}
}
