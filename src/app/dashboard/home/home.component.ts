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
  tableColumnForm: any = [];
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
  expandedRows: { [key: string]: boolean } = {};
  selectedType: string = '';
  filterApplyData: any = {};
  selectedRowToExpand: any = {};
  loader: boolean = true;
  nestedLoader: boolean = false;
  products: any;

  constructor(
    private service: SharedService,
    private httpService: HttpService,
    private helperService: HelperService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit(): void {
    this.products = Array.from({ length: 3 }).map((_, i) => `Item #${i}`);
    this.subscription.push(
      this.service.passDataToDashboard
        .pipe(distinctUntilChanged())
        .subscribe((sharedobject) => {
          this.loader = true;
          this.selectedType = this.service.getSelectedType();
          this.filterApplyData = sharedobject.filterApplyData;
          const filterApplyData = this.payloadPreparation(
            this.filterApplyData,
            this.selectedType,
            'parent',
          );

          this.httpService
            .getExecutiveBoardData(
              filterApplyData,
              this.selectedType !== 'scrum',
            )
            .subscribe((res: any) => {
              if (res.data) {
                this.tableData['data'] = res.data.matrix.rows.map((row) => {
                  return { ...row, ...row?.boardMaturity };
                });

                this.tableData['columns'] = res.data.matrix.columns.filter(
                  (col) => col.field !== 'id',
                );

                const { tableColumnData, tableColumnForm } =
                  this.generateColumnFilterData(
                    this.tableData['data'],
                    this.tableData['columns'],
                  );

                this.tableColumnData = tableColumnData;
                this.tableColumnForm = tableColumnForm;

                this.expandedRows = this.tableData['data']
                  .filter((p) => p.children && p.children.length > 0) // only rows with children
                  .reduce((acc, curr) => {
                    acc[curr.id] = true; // mark as expanded
                    return acc;
                  }, {} as { [key: string]: boolean });

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
                    category: 'Healthy Project',
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
              this.loader = false;
            });

          // this.maturityComponent.receiveSharedData({
          //   masterData: sharedobject.masterData,
          //   filterdata: sharedobject.filterdata,
          //   filterApplyData: sharedobject.filterApplyData,
          //   dashConfigData: sharedobject.dashConfigData,
          // });
        }),
    );
  }

  payloadPreparation(filterApplyData, selectedType, dataFor) {
    const hierarchy = JSON.parse(
      localStorage.getItem('completeHierarchyData') || '{}',
    )[selectedType];

    let targetLevel = filterApplyData.level;
    let targetLabel = filterApplyData.label;

    if (dataFor === 'child' && hierarchy) {
      const child = this.getImmediateChild(hierarchy, filterApplyData.level);
      targetLevel = child?.level ?? targetLevel;
      targetLabel = child?.hierarchyLevelId ?? targetLabel;
    }

    return {
      level: targetLevel,
      label: targetLabel,
      parentId: dataFor === 'child' ? this.selectedRowToExpand.id || '' : '',
      date:
        selectedType === 'scrum'
          ? ''
          : filterApplyData.selectedMap?.date?.[0] || '',
      duration: selectedType === 'scrum' ? '' : filterApplyData.ids?.[0] || '',
    };
  }

  getImmediateChild(hierarchyData, parentLevel) {
    // Find the item with the next level
    const child = hierarchyData.find((item) => item.level === parentLevel + 1);
    return child || null;
  }

  calculateEfficiency() {
    const rowData = this.tableData['data'];
    const sum = rowData.reduce((acc, num) => {
      return acc + parseInt(num.completion, 10);
    }, 0);

    if (rowData.length === 0) {
      return 0 + '%';
    }
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

    // ✅ Handle empty case to avoid divide by zero
    if (rowData.length === 0) {
      return { average: '0%', count: 0 };
    }

    const average = Math.round(sum / rowData.length);

    return { average: average + '%', count: rowData.length };
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

  onRowExpand(event) {
    this.nestedLoader = true;
    this.selectedRowToExpand = event.data;
    const filterApplyData = this.payloadPreparation(
      this.filterApplyData,
      this.selectedType,
      'child',
    );

    this.httpService
      .getExecutiveBoardData(filterApplyData, this.selectedType !== 'scrum')
      .subscribe((res: any) => {
        if (res.data) {
          res.data.matrix.rows = res.data.matrix.rows.map((row) => {
            return { ...row, ...row?.boardMaturity };
          });
          const targettedDetails = this.tableData.data.find(
            (list) => list.id === this.selectedRowToExpand.id,
          );
          if (targettedDetails) {
            targettedDetails['children'] = targettedDetails['children'] || {};
            targettedDetails['children']['data'] = res.data.matrix.rows;
            targettedDetails['children']['columns'] =
              res.data.matrix.columns.filter((col) => col.field !== 'id');
            const { tableColumnData, tableColumnForm } =
              this.generateColumnFilterData(
                targettedDetails['children']['data'],
                targettedDetails['children']['columns'],
              );
            targettedDetails['children']['tableColumnData'] = tableColumnData;
            targettedDetails['children']['tableColumnForm'] = tableColumnForm;
          }
          this.nestedLoader = false;
        }
      });
  }

  generateColumnFilterData(data, columns) {
    if (data.length > 0) {
      const tableColumnData = {};
      const tableColumnForm = {};
      columns.forEach((colName) => {
        const uniqueMap = new Map();
        data.forEach((rowData) => {
          const key = rowData[colName.field];
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
              name: key,
              value: key,
            });
          }
        });
        tableColumnData[colName.field] = Array.from(uniqueMap.values());
        tableColumnForm[colName.field] = [];
      });
      return { tableColumnData, tableColumnForm };
    }
    return;
  }

  ngOnDestroy() {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
  }
}
