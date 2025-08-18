import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { HttpService } from 'src/app/services/http.service';
import { HelperService } from 'src/app/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, throwError } from 'rxjs';
import { catchError, distinctUntilChanged } from 'rxjs/operators';
import { MaturityComponent } from '../maturity/maturity.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  aggregrationDataList: Array<object> = [];
  filteredColumn;
  tableColumnData: any = [];
  tableColumnForm: Array<Object> = [];
  tableData: any = {
    columns: [],
    data: [],
  };

  refreshCounter: number = 0;
  selectedTab = 'Overall';
  queryParamsSubscription!: Subscription;
  subscription = [];
  @ViewChild('maturityComponent')
  maturityComponent: MaturityComponent;

  constructor(
    private service: SharedService,
    private httpService: HttpService,
    private helperService: HelperService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.subscription.push(
      this.service.passDataToDashboard
        .pipe(distinctUntilChanged())
        .subscribe((sharedobject) => {
          console.log(JSON.parse(JSON.stringify(sharedobject.filterApplyData)));
          // const filterData = this.service.getFilterData();
          const selectedType = this.service.getSelectedType();
          // const hierarchyData = JSON.parse(
          //   localStorage.getItem('completeHierarchyData'),
          // )[selectedType];
          const filterApplyData = this.payloadPreparation(
            sharedobject.filterApplyData,
            selectedType,
          );

          // const listOfProjects = this.getProjects(
          //   filterApplyData,
          //   hierarchyData,
          //   filterData,
          //   sharedobject.filterApplyData,
          // );
          // const listOfProjectsNodeIds = listOfProjects
          //   .filter((pro) => !pro.onHold)
          //   .map((pro) => pro.nodeId);
          // filterApplyData.selectedMap.project = listOfProjectsNodeIds;
          // filterApplyData.ids = listOfProjectsNodeIds;
          // console.log(selectedType);
          // console.log(listOfProjects);
          // console.log(filterApplyData);
          // console.log('final payload : ', filterApplyData);
          this.httpService
            .getExecutiveBoardData(filterApplyData, selectedType !== 'scrum')
            .subscribe((res: any) => {
              if (res.success) {
                this.tableData['data'] = res.data.matrix.rows.map((row) => {
                  return { ...row, ...row?.boardMaturity };
                });
                this.tableData['columns'] = res.data.matrix.column;
                this.generateColumnFilterData();

                this.aggregrationDataList = [
                  {
                    category: 'Active Project',
                    value: this.tableData['data'].length,
                    icon: 'visibility_on.svg',
                    average: 'NA',
                  },
                  {
                    category: 'Critical Project',
                    value: this.calculateHealth('critical').count,
                    icon: 'Watch.svg',
                    average: this.calculateHealth('critical').average,
                  },
                  {
                    category: 'Health Project',
                    value: this.calculateHealth('healthy').count,
                    icon: 'Check.svg',
                    average: this.calculateHealth('healthy').average,
                  },
                  {
                    category: 'Avg Efficiency',
                    value: this.tableData['data'].length,
                    icon: 'Warning.svg',
                    average: this.calculateEfficiency(),
                  },
                ];
              }
            });

          this.maturityComponent.receiveSharedData({
            masterData: sharedobject.masterData,
            filterdata: sharedobject.filterdata,
            filterApplyData: sharedobject.filterApplyData,
            dashConfigData: sharedobject.dashConfigData,
          });
        }),
    );
  }

  payloadPreparation(filterApplyData, selectedType, filterType?) {
    return {
      level: filterApplyData.level,
      label: filterApplyData.label,
      parentid: filterType ? filterType : '',
      date: selectedType === 'scrum' ? '' : filterApplyData.selectedMap.date[0],
      duration: selectedType === 'scrum' ? '' : filterApplyData.ids[0],
    };
  }

  calculateEfficiency() {
    const rowData = this.tableData['data'];
    const sum = rowData.reduce((acc, num) => {
      return acc + Number(num.completion);
    }, 0);
    const average = Math.round(sum / rowData.length);
    return average + '%';
  }

  calculateHealth(healthType) {
    const rowData = [
      ...this.tableData['data'].filter(
        (data) => data.health.toLowerCase() === healthType.toLowerCase(),
      ),
    ];
    const sum = rowData.reduce((acc, num) => {
      return acc + Number(num.completion);
    }, 0);
    // console.log(healthType + ' : ', average);
    const average = Math.round(sum / rowData.length);

    return { average: average + '%', count: rowData.length };
  }

  getProjects(
    selectedNodeId: any,
    hierarchyDetails: any[],
    filterData: any[],
    filterApplyData,
  ) {
    // 1) find 'project' level dynamically
    const projectHierarchy = hierarchyDetails.find(
      (h) => h.hierarchyLevelId === 'project',
    );
    if (!projectHierarchy) return [];
    const projectLevel = projectHierarchy.level;
    filterApplyData.level = projectLevel;
    filterApplyData.label = 'project';

    // 2) build parentId -> children map
    const childrenMap: { [parentId: string]: any[] } = {};
    for (const node of filterData) {
      if (!node.parentId) continue;
      (childrenMap[node.parentId] = childrenMap[node.parentId] || []).push(
        node,
      );
    }

    // 3) collect projects by traversing descendants
    const projects: any[] = [];
    this.collectDescendants(
      selectedNodeId.ids[0],
      childrenMap,
      projectLevel,
      projects,
    );
    return projects;
  }

  private collectDescendants(
    nodeId: string,
    childrenMap: { [parentId: string]: any[] },
    projectLevel: number,
    projects: any[],
  ) {
    const children = childrenMap[nodeId] || [];
    for (const child of children) {
      // collect if this node is at project level and labelName is "project"
      if (child.level === projectLevel && child.labelName === 'project') {
        projects.push(child);
      }
      // traverse deeper only while child's level < project level (optimization)
      if (child.level < projectLevel) {
        this.collectDescendants(
          child.nodeId,
          childrenMap,
          projectLevel,
          projects,
        );
      }
      // if child.level >= projectLevel then we don't need to traverse deeper for finding projects under this branch
    }
  }

  getMClass(value: string) {
    const v = (value || '').toLowerCase();
    return {
      m1: 'm1',
      m2: 'm2',
      m3: 'm3',
      m4: 'm4',
      m5: 'm5',
      healthy: 'healthy',
      critical: 'critical',
    }[v];
  }

  onFilterClick(columnName) {
    this.filteredColumn = columnName;
  }

  onFilterBlur(columnName) {
    this.filteredColumn =
      this.filteredColumn === columnName ? '' : this.filteredColumn;
  }

  sortableColumn(columnName, tableDataSet = {}) {
    if (typeof columnName == 'string') {
      return columnName;
    } else {
      return columnName.field;
    }
  }

  generateColumnFilterData() {
    if (this.tableData['data'].length > 0) {
      this.tableData['columns'].forEach((colName) => {
        const uniqueMap = new Map();
        this.tableData['data'].forEach((rowData) => {
          const key = rowData[colName.field];
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
              name: key,
              value: key,
            });
          }
        });

        this.tableColumnData[colName.field] = Array.from(uniqueMap.values());
        this.tableColumnForm[colName.field] = [];
      });
    }
  }

  ngOnDestroy() {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
  }
}
