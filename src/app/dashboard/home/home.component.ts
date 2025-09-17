import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { HttpService } from 'src/app/services/http.service';
import { HelperService } from 'src/app/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import { MaturityComponent } from '../maturity/maturity.component';
import { MessageService } from 'primeng/api';

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
  selectedFilters: Array<any> = [];
  filters: Array<any> = [];
  selectedHierarchy: any;
  sharedobject = {};
  completeHierarchyData: any = {};
  sidebarVisible: boolean = false;
  bottomTilesData = signal([]);
  BottomTilesLoader: boolean = false;
  calculatorDataLoader: boolean = true;

  constructor(
    private service: SharedService,
    private httpService: HttpService,
    private helperService: HelperService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.products = Array.from({ length: 4 }).map((_, i) => `Item #${i}`);
    this.subscription.push(
      this.service.passDataToDashboard
        .pipe(distinctUntilChanged())
        .subscribe((sharedobject) => {
          this.tableData = {
            columns: [],
            data: [],
          };
          this.initializeBottomData('ALL');
          this.calculatorDataLoader = false;
          this.aggregrationDataList = [];
          this.loader = true;
          this.BottomTilesLoader = true;
          this.selectedType = this.service.getSelectedType();
          this.sharedobject = sharedobject;
          this.completeHierarchyData = JSON.parse(
            localStorage.getItem('completeHierarchyData') || '{}',
          )[this.selectedType];
          this.filterApplyData = sharedobject.filterApplyData;
          const filterApplyData = this.payloadPreparation(
            this.filterApplyData,
            this.selectedType,
            'parent',
          );

          this.subscription.push(
            this.httpService
              .getExecutiveBoardData(
                filterApplyData,
                this.selectedType !== 'scrum',
              )
              .subscribe({
                next: (executiveBoard) => {
                  /** ---------- Handle executive summery API ---------- */
                  if (executiveBoard?.error) {
                    this.messageService.add({
                      severity: 'error',
                      summary:
                        executiveBoard.message ||
                        'Error in fetching Executive data!',
                    });
                  } else if (executiveBoard?.data) {
                    this.tableData['data'] =
                      executiveBoard.data.matrix.rows.map((row) => ({
                        ...row,
                        ...row?.boardMaturity,
                      }));

                    this.tableData['columns'] =
                      executiveBoard.data.matrix.columns.filter(
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
                      .filter((p) => p.children && p.children.length > 0)
                      .reduce((acc, curr) => {
                        acc[curr.id] = true;
                        return acc;
                      }, {} as { [key: string]: boolean });

                    const hierarchy = this.completeHierarchyData;
                    const label = hierarchy?.find(
                      (hi) => hi.level === filterApplyData.level,
                    ).hierarchyLevelName;

                    this.aggregrationDataList = [
                      {
                        cssClassName: 'users',
                        category: 'Active ' + label + ' (s)',
                        value: this.tableData['data'].length,
                        icon: 'pi-users',
                        average: 'NA',
                      },
                      {
                        cssClassName: 'gauge',
                        category: 'Avg. Efficiency',
                        value: this.tableData['data'].length,
                        icon: 'pi-gauge',
                        average: this.calculateEfficiency(),
                      },
                      {
                        cssClassName: 'exclamation',
                        category: 'Critical ' + label + ' (s)',
                        value: this.calculateHealth('critical').count,
                        icon: 'pi-exclamation-triangle',
                        average: this.calculateHealth('critical').average,
                      },
                      {
                        cssClassName: 'heart-fill',
                        category: 'Healthy ' + label + ' (s)',
                        value: this.calculateHealth('healthy').count,
                        icon: 'pi-heart-fill',
                        average: this.calculateHealth('healthy').average,
                      },
                    ];

                    this.bottomTilesData.update((data) => {
                      const riskData = [...data];
                      riskData[0] = {
                        ...riskData[0],
                        value: this.calculateQuertlyRisk(
                          this.tableData['data'],
                        ),
                      };
                      return riskData;
                    });
                  }
                  this.loader = false;
                  // this.BottomTilesLoader = false;
                },
              }),
          );

          this.fetchPEBaData({
            label: filterApplyData.label,
            level: filterApplyData.level,
            parentId: '',
          });

          this.filters = this.processFilterData(
            this.service.getFilterData(),
            this.filterApplyData.label,
          );
          this.selectedFilters = [this.filters[0]];
          this.getMaturityWheelData(sharedobject);
        }),
    );

    this.subscription.push(
      this.service.pebData$.subscribe((data) => {
        if (data?.['kpiTrends']) this.processPEBData(data);
      }),
    );
  }

  initializeBottomData(typeOfReset) {
    if (typeOfReset === 'ALL') {
      this.bottomTilesData.set([
        {
          cssClassName: '',
          category: 'Top 3 Risks this Quarter',
          value: [],
          icon: '',
        },
        {
          cssClassName: '',
          category: 'Positive Trends',
          value: [],
          icon: 'pi-sort-up-fill',
          color: 'green',
        },
        {
          cssClassName: '',
          category: 'Negative Trends',
          value: [],
          icon: 'pi-sort-down-fill',
          color: 'red',
        },
      ]);
    } else {
      this.bottomTilesData.update((state) => {
        const tempState = [...state];
        tempState[1] = {
          cssClassName: '',
          category: 'Positive Trends',
          value: [],
          icon: 'pi-sort-up-fill',
          color: 'green',
        };
        tempState[2] = {
          cssClassName: '',
          category: 'Negative Trends',
          value: [],
          icon: 'pi-sort-down-fill',
          color: 'red',
        };
        return tempState;
      });
    }
  }
  getMaturityWheelData(sharedobject) {
    this.maturityComponent.receiveSharedData({
      masterData: sharedobject.masterData,
      filterData: sharedobject.filterData,
      filterApplyData: sharedobject.filterApplyData,
      dashConfigData: sharedobject.dashConfigData,
    });
  }

  payloadPreparation(filterApplyData, selectedType, dataFor) {
    const hierarchy = this.completeHierarchyData;

    let targetLevel = filterApplyData.level;
    let targetLabel = filterApplyData.label;
    this.selectedHierarchy = this.getImmediateChild(
      hierarchy,
      filterApplyData.level,
    );

    if (dataFor === 'child' && hierarchy) {
      const child = this.getImmediateChild(
        hierarchy,
        filterApplyData.level + 1,
      );
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
    const child = hierarchyData?.find((item) => item.level === parentLevel);
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

  calculateQuertlyRisk(data) {
    const ascSortedData = [...data].sort((a, b) => {
      const compA = parseInt(a.completion.replace('%', ''), 10);
      const compB = parseInt(b.completion.replace('%', ''), 10);
      return compA - compB;
    });

    const threshodData =
      ascSortedData.length > 4 ? ascSortedData.slice(0, 4) : ascSortedData;

    return threshodData.map((node) => {
      return { property: node.name, value: node.completion };
    });
  }

  calculateTrendData(data, trendType) {
    if (!data) {
      return [];
    }
    const decendingData = [...data].sort((a, b) => {
      if (trendType === 'positive') {
        return b.trendValue - a.trendValue;
      } else {
        return a.trendValue - b.trendValue;
      }
    });
    const threshodData =
      decendingData.length > 4 ? decendingData.slice(0, 4) : decendingData;

    return threshodData.map((node) => {
      return { property: node.kpiName, value: node.trendValue };
    });
  }

  calculateHealth(healthType) {
    const rowData = [
      ...this.tableData['data'].filter((data) => {
        return data.health.toLowerCase() === healthType.toLowerCase();
      }),
    ];
    const sum = rowData.reduce((acc, num) => {
      return acc + parseFloat(num.completion.replace('%', ''));
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
      m0: 'm0',
      m1: 'm1',
      m2: 'm2',
      m3: 'm3',
      m4: 'm4',
      m5: 'm5',
      healthy: 'healthy',
      critical: 'critical',
      unhealthy: 'unhealthy',
      moderate: 'moderate',
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
        if (res?.error) {
          this.messageService.add({
            severity: 'error',
            summary: res.message || 'Looks some problem in fetching the data!',
          });
          this.nestedLoader = false;
        } else {
          if (res?.data) {
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
  }

  processFilterData(data, filterType) {
    if (Array.isArray(data)) {
      return data
        .sort((a, b) => a.nodeDisplayName.localeCompare(b.nodeDisplayName))
        .filter((nodes) => nodes.labelName === filterType);
    }
    return [];
  }

  getImmediateParentDisplayName(child) {
    const completeHiearchyData = this.completeHierarchyData;
    const selectedLevelNode = completeHiearchyData?.filter(
      (x) =>
        x.hierarchyLevelName === this.selectedHierarchy?.hierarchyLevelName,
    );
    const level = selectedLevelNode[0].level;
    if (level > 1) {
      const parentLevel = level - 1;
      const parentLevelNode = completeHiearchyData?.filter(
        (x) => x.level === parentLevel,
      );
      const parentLevelName = parentLevelNode[0].hierarchyLevelName;
      const filterData = {
        [parentLevelName]: this.processFilterData(
          this.service.getFilterData(),
          parentLevelNode[0].hierarchyLevelId,
        ),
      };
      const immediateParent = filterData[parentLevelName].find(
        (x) => x.nodeId === child.parentId,
      );
      return immediateParent?.nodeDisplayName;
    }
    return undefined;
  }

  urlRedirection() {}

  onDropdownChange(event: any) {
    const selectedNodeId = event.value.nodeId;
    if (this.selectedType === 'scrum') {
      this.filterApplyData.ids = [selectedNodeId];
    }
    this.filterApplyData.selectedMap[this.filterApplyData.label] = [
      selectedNodeId,
    ];
    this.getMaturityWheelData(this.sharedobject);
  }

  retryPEBData(): void {
    const filterApplyData = this.payloadPreparation(
      this.filterApplyData,
      this.selectedType,
      'parent',
    );
    this.fetchPEBaData({
      label: filterApplyData.label,
      level: filterApplyData.level,
      parentId: '',
    });
  }

  public fetchPEBaData(filterApplyData: any): void {
    this.BottomTilesLoader = true;

    this.subscription.push(
      this.helperService.fetchPEBaData(filterApplyData).subscribe({
        next: (res) => {
          if (res.success) {
            this.processPEBData(res.data);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Failed to load PEBa data. Please try again.',
            });
            this.BottomTilesLoader = false;
            this.initializeBottomData('ONLYTRENDS');
          }
          this.calculatorDataLoader = false;
        },
        error: (error) => {
          console.error('Failed to load PEBa data:', error);
          this.BottomTilesLoader = false;
          this.calculatorDataLoader = false;
          this.initializeBottomData('ONLYTRENDS');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load PEBa data. Please try again.',
          });
        },
      }),
    );
  }

  processPEBData(data) {
    const kpiTrends = data['kpiTrends'];
    this.bottomTilesData.update((value) => {
      const data = [...value];
      data[1] = {
        ...data[1],
        value: this.calculateTrendData(kpiTrends['positive'], 'positive'),
      };
      data[2] = {
        ...data[2],
        value: this.calculateTrendData(kpiTrends['negative'], 'negative'),
      };
      return data;
    });
    this.BottomTilesLoader = false;
  }

  ngOnDestroy() {
    this.service.setPEBData({});
    this.subscription.forEach((subscription) => subscription.unsubscribe());
  }
}
