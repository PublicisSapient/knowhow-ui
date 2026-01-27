import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';
import { HttpService } from 'src/app/services/http.service';
import { HelperService } from 'src/app/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { MaturityComponent } from '../maturity/maturity.component';
import { MessageService } from 'primeng/api';
import { FeatureFlagsService } from 'src/app/services/feature-toggle.service';

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
  @ViewChild('mainTable') mainTable: any;
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
  nbaRawData: Array<any> = [];
  productivityData: any = {};
  productivityExpandRowDataLoader = false;
  nbaFlag = new BehaviorSubject(false);
  nbaLoader = true;
  hasBaseUrl = false;

  constructor(
    private service: SharedService,
    private httpService: HttpService,
    private helperService: HelperService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private readonly messageService: MessageService,
    private readonly featureFlagService: FeatureFlagsService,
  ) {}

  ngOnInit(): void {
    this.products = Array.from({ length: 4 }).map((_, i) => `Item #${i}`);
    this.getNBAFeatureFlag();
    this.checkConfigurationDetails();
    this.subscription.push(
      this.service.passDataToDashboard
        .pipe(
          distinctUntilChanged(
            (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
          ),
        )
        .subscribe((sharedobject) => {
          this.checkConfigurationDetails();
          this.tableData = {
            columns: [],
            data: [],
          };
          this.initializeBottomData('ALL');
          this.calculatorDataLoader = false;
          this.aggregrationDataList = [];
          this.nbaRawData = [];
          this.nbaLoader = true;
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

          // Clear PEB data cache when dashboard data changes
          this.service.clearPEBDataCache();

          this.subscription.push(
            this.httpService
              .getExecutiveBoardData(
                filterApplyData,
                this.selectedType.toUpperCase(),
              )
              .subscribe({
                next: (executiveBoard: any) => {
                  /** ---------- Handle executive summery API ---------- */
                  this.initializeAggregationDataWithNA();
                  if (executiveBoard?.error) {
                    this.messageService.add({
                      severity: 'error',
                      summary:
                        executiveBoard.message ||
                        'Error in fetching Executive data!',
                    });
                  } else if (executiveBoard?.data) {
                    const transformed = this.transformMaturityResponse(
                      executiveBoard.data,
                    );

                    this.tableData['data'] = transformed.rows.map((row) => {
                      if (
                        !row.boardMaturity ||
                        Object.keys(row.boardMaturity).length === 0
                      ) {
                        row.boardMaturity = {
                          dora: 'M0',
                          value: 'M0',
                          speed: 'M0',
                          quality: 'M0',
                        };
                      }
                      return {
                        ...row,
                        ...row?.boardMaturity,
                        productivity: this.getProductivityForRow(row.name),
                      };
                    });

                    const projectNameMap = new Map(
                      this.service
                        .getFilterData()
                        .map((u: any) => [u.nodeId, u.nodeDisplayName]),
                    );
                    this.tableData.data = this.tableData.data.map(
                      (res: any) => ({
                        ...res,
                        name: projectNameMap.get(res.id) || res.name,
                      }),
                    );

                    const filteredColumns = transformed.columns.filter(
                      (col) => col.field !== 'id',
                    );
                    const nameColIndex = filteredColumns.findIndex(
                      (col) => col.field === 'name',
                    );
                    const insertIndex =
                      nameColIndex >= 0 ? nameColIndex + 2 : 2;
                    this.tableData['columns'] = [
                      ...filteredColumns.slice(0, insertIndex),
                      { field: 'productivity', header: 'Productivity' },
                      ...filteredColumns.slice(insertIndex),
                    ];

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
                        category: 'Active ' + label + '(s)',
                        value: this.tableData['data'].length,
                        icon: 'pi-users',
                        average: 'N/A',
                        valueColor: '#374151',
                        iconType: 'pi',
                      },
                      {
                        cssClassName: 'gauge',
                        category: 'Avg. Efficiency',
                        value: this.tableData['data'].length,
                        icon: 'pi-gauge',
                        average: this.calculateEfficiency(),
                        valueColor: '#374151',
                        iconType: 'pi',
                      },
                      {
                        cssClassName: 'exclamation',
                        category: 'Critical ' + label + '(s)',
                        value: this.calculateHealth('unhealthy').count,
                        icon: 'pi-exclamation-triangle',
                        average: this.calculateHealth('unhealthy').average,
                        valueColor: '#374151',
                        iconType: 'pi',
                      },
                      {
                        cssClassName: 'heart-fill',
                        category: 'Healthy ' + label + '(s)',
                        value: this.calculateHealth('healthy').count,
                        icon: 'pi-heart-fill',
                        average: this.calculateHealth('healthy').average,
                        valueColor: '#374151',
                        iconType: 'pi',
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
          this.getNBAData(filterApplyData.label);
        }),
    );

    this.subscription.push(
      this.service.pebData$.subscribe((data) => {
        if (data?.['summary']?.['trends']) {
          this.processPEBData(data);
        }
      }),
    );
  }

  getNBAFeatureFlag() {
    this.featureFlagService
      .isFeatureEnabled('RECOMMENDATION_ACTION_PLAN')
      .then((res) => this.nbaFlag.next(res));
  }

  initializeBottomData(typeOfReset) {
    if (typeOfReset === 'ALL') {
      this.bottomTilesData.set([
        {
          cssClassName: '',
          category: 'Top 4 Risks this Quarter',
          value: [],
          icon: false,
          color: '#cdba38',
          fontColor: 'black',
        },
        {
          cssClassName: '',
          category: 'Positive Trends',
          value: [],
          icon: true,
          color: '#15ba40',
          fontColor: 'black',
        },
        {
          cssClassName: '',
          category: 'Negative Trends',
          value: [],
          icon: true,
          color: '#eb3d4b',
          fontColor: 'black',
        },
      ]);
    } else {
      this.bottomTilesData.update((state) => {
        const tempState = [...state];
        tempState[1] = {
          cssClassName: '',
          category: 'Positive Trends',
          value: [],
          icon: true,
          color: '#99cda9',
          fontColor: 'black',
        };
        tempState[2] = {
          cssClassName: '',
          category: 'Negative Trends',
          value: [],
          icon: true,
          color: '#ed8888',
          fontColor: 'black',
        };
        return tempState;
      });
    }
  }
  getMaturityWheelData(sharedobject) {
    if (this.maturityComponent) {
      this.maturityComponent.receiveSharedData({
        masterData: sharedobject.masterData,
        filterData: sharedobject.filterData,
        filterApplyData: sharedobject.filterApplyData,
        dashConfigData: sharedobject.dashConfigData,
      });
    }
  }

  payloadPreparation(filterApplyData, selectedType, dataFor) {
    const hierarchy = this.completeHierarchyData;

    let targetLevel = filterApplyData.level;
    let targetLabel = this.getImmediateChild(
      hierarchy,
      filterApplyData.level,
    ).hierarchyLevelName;
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
      targetLabel = child?.hierarchyLevelName ?? targetLabel;
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
      const compValue = num.completion?.replace('%', '') || '0';
      const parsed = parseFloat(compValue);
      if (!isNaN(parsed)) {
        return acc + parsed;
      }
      return acc;
    }, 0);

    if (rowData.length === 0) {
      return 0 + '%';
    }
    const average = Math.round(sum / rowData.length);
    return average + '%';
  }

  calculateQuertlyRisk(data) {
    const ascSortedData = [...data].sort((a, b) => {
      const compA = parseFloat(a.completion?.replace('%', '') || '0') || 0;
      const compB = parseFloat(b.completion?.replace('%', '') || '0') || 0;
      return compA - compB;
    });

    const threshodData =
      ascSortedData.length > 4 ? ascSortedData.slice(0, 4) : ascSortedData;

    return threshodData.map((node) => {
      return { property: node.name, value: node.completion || 'N/A' };
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
      return {
        property: node.kpiName,
        value: parseFloat(node.trendValue).toFixed(1),
        desiredTrend: node.desiredTrend,
      };
    });
  }

  calculateHealth(healthType) {
    const rowData = [
      ...this.tableData['data'].filter((data) => {
        return data.health?.toLowerCase() === healthType.toLowerCase();
      }),
    ];

    if (rowData.length === 0) {
      return { average: '0%', count: 0 };
    }

    const sum = rowData.reduce((acc, num) => {
      const compValue = num.completion?.replace('%', '') || '0';
      const parsed = parseFloat(compValue);
      return acc + (isNaN(parsed) ? 0 : parsed);
    }, 0);

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
    this.productivityExpandRowDataLoader = true;
    this.selectedRowToExpand = event.data;

    // Store current page before data update
    const currentPage = this.mainTable?.first || 0;

    const filterApplyData = this.payloadPreparation(
      this.filterApplyData,
      this.selectedType,
      'child',
    );

    this.httpService
      .getExecutiveBoardData(filterApplyData, this.selectedType.toUpperCase())
      .subscribe((res: any) => {
        if (res?.error) {
          this.messageService.add({
            severity: 'error',
            summary: res.message || 'Looks some problem in fetching the data!',
          });
          this.nestedLoader = false;
          this.productivityExpandRowDataLoader = false;
        } else {
          if (res?.data) {
            const transformed = this.transformMaturityResponse(res.data);

            let childRows = transformed.rows.map((row) => {
              return { ...row, ...row?.boardMaturity, productivity: 'N/A' };
            });
            const projectNameMap = new Map(
              this.service
                .getFilterData()
                .map((u: any) => [u.nodeId, u.nodeDisplayName]),
            );
            childRows = childRows.map((row: any) => ({
              ...row,
              name: projectNameMap.get(row.id) || row.name,
            }));
            const targettedDetails = this.tableData.data.find(
              (list) => list.id === this.selectedRowToExpand.id,
            );
            if (targettedDetails) {
              targettedDetails['children'] = targettedDetails['children'] || {};
              targettedDetails['children']['data'] = childRows;

              const childFilteredColumns = transformed.columns.filter(
                (col) => col.field !== 'id',
              );

              const nameColIndex = childFilteredColumns.findIndex(
                (col) => col.field === 'name',
              );

              const insertIndex = nameColIndex >= 0 ? nameColIndex + 2 : 2;
              targettedDetails['children']['columns'] = [
                ...childFilteredColumns.slice(0, insertIndex),
                { field: 'productivity', header: 'Productivity' },
                ...childFilteredColumns.slice(insertIndex),
              ];

              const { tableColumnData, tableColumnForm } =
                this.generateColumnFilterData(
                  targettedDetails['children']['data'],
                  targettedDetails['children']['columns'],
                );

              targettedDetails['children']['tableColumnData'] = tableColumnData;
              targettedDetails['children']['tableColumnForm'] = tableColumnForm;

              setTimeout(() => {
                if (this.mainTable && this.mainTable.first !== currentPage) {
                  this.mainTable.first = currentPage;
                }
              });

              // Fetch PEB data for nested rows
              this.fetchNestedPEBData(filterApplyData, targettedDetails);
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
    const hierarchyItem = this.completeHierarchyData?.find(
      (hi) => hi.level === filterApplyData.level,
    );

    if (!hierarchyItem) {
      this.BottomTilesLoader = false;
      this.calculatorDataLoader = false;
      return;
    }

    const label = hierarchyItem.hierarchyLevelName;
    const labelKey = label.toLowerCase();

    // Check cache first
    const cachedData = this.service.getPEBDataCache(labelKey);
    if (cachedData) {
      this.processPEBData(cachedData);
      this.calculatorDataLoader = false;
      return;
    }

    this.subscription.push(
      this.helperService.fetchPEBaData(labelKey).subscribe({
        next: (res) => {
          if (res.success) {
            // Cache the data
            this.service.setPEBDataCache(labelKey, res.data);
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
    // Store productivity data for table integration
    if (data?.summary?.categoryScores?.productivity !== undefined) {
      this.productivityData[data.summary.levelName] =
        data.summary.categoryScores.productivity;
    }
    if (data.details) {
      data.details.forEach((detail) => {
        this.productivityData[detail.organizationEntityName] =
          detail.categoryScores.productivity;
      });
    }

    // Update table data with productivity values
    if (this.tableData.data && this.tableData.data.length > 0) {
      this.tableData.data = this.tableData.data.map((row) => ({
        ...row,
        productivity: this.getProductivityForRow(row.name),
      }));

      // Update nested table data if exists
      this.tableData.data.forEach((row) => {
        if (row.children && row.children.data) {
          row.children.data = row.children.data.map((childRow) => ({
            ...childRow,
            productivity: this.getProductivityForRow(childRow.name),
          }));
        }
      });
    }

    const kpiTrends = data['summary']['trends'];
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

  getProductivityForRow(rowName: string): string {
    const productivity = this.productivityData[rowName];
    return productivity !== undefined && this.selectedType === 'scrum'
      ? `${productivity.toFixed(2)}%`
      : 'N/A';
  }

  fetchNestedPEBData(filterApplyData: any, targettedDetails: any): void {
    const hierarchyItem = this.completeHierarchyData?.find(
      (hi) => hi.level === filterApplyData.level,
    );

    if (!hierarchyItem) {
      this.productivityExpandRowDataLoader = false;
      return;
    }

    const label = hierarchyItem.hierarchyLevelName;
    const labelKey = label.toLowerCase();

    // Check cache first
    const cachedData = this.service.getPEBDataCache(labelKey);
    if (cachedData && cachedData.details) {
      // Update productivity data for nested rows from cache
      cachedData.details.forEach((detail) => {
        this.productivityData[detail.organizationEntityName] =
          detail.categoryScores.productivity;
      });

      // Update nested table data with productivity values
      targettedDetails['children']['data'] = targettedDetails['children'][
        'data'
      ].map((row) => ({
        ...row,
        productivity: this.getProductivityForRow(row.name),
      }));
      this.productivityExpandRowDataLoader = false;
      return;
    }

    this.subscription.push(
      this.helperService.fetchPEBaData(labelKey).subscribe({
        next: (res) => {
          if (res.success && res.data.details) {
            // Cache the data
            this.service.setPEBDataCache(labelKey, res.data);

            // Update productivity data for nested rows
            res.data.details.forEach((detail) => {
              this.productivityData[detail.organizationEntityName] =
                detail.categoryScores.productivity;
            });

            // Update nested table data with productivity values
            targettedDetails['children']['data'] = targettedDetails['children'][
              'data'
            ].map((row) => ({
              ...row,
              productivity: this.getProductivityForRow(row.name),
            }));
            this.productivityExpandRowDataLoader = false;
          }
        },
        error: (error) => {
          console.error('Failed to load nested PEBa data:', error);
        },
      }),
    );
  }

  getNBAData(label) {
    this.httpService.getHomeNBAData(label).subscribe({
      next: (res) => {
        if (res?.success) {
          this.nbaRawData = res?.data?.details || [];
          this.nbaLoader = false;
        } else {
          this.nbaRawData = [];
          this.nbaLoader = false;
          console.error('NBA data having some problem.');
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to load NBA data. Please try again.',
          });
        }
      },
      error: (error) => {
        this.nbaRawData = [];
        this.nbaLoader = false;
        console.error('Failed to load NBA data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to load NBA data. Please try again.',
        });
      },
    });
  }

  initializeAggregationDataWithNA() {
    const hierarchy = this.completeHierarchyData;
    const label =
      hierarchy?.find(
        (hi) =>
          hi.level ===
          this.payloadPreparation(
            this.filterApplyData,
            this.selectedType,
            'parent',
          ).level,
      )?.hierarchyLevelName || 'Entity';

    this.aggregrationDataList = [
      {
        cssClassName: 'users',
        category: 'Active ' + label + '(s)',
        value: 'N/A',
        icon: 'pi-users',
        average: 'N/A',
        valueColor: '#374151',
        iconType: 'pi',
      },
      {
        cssClassName: 'gauge',
        category: 'Avg. Efficiency',
        value: 'N/A',
        icon: 'pi-gauge',
        average: 'N/A',
        valueColor: '#374151',
        iconType: 'pi',
      },
      {
        cssClassName: 'exclamation',
        category: 'Critical ' + label + '(s)',
        value: 'N/A',
        icon: 'pi-exclamation-triangle',
        average: 'N/A',
        valueColor: '#374151',
        iconType: 'pi',
      },
      {
        cssClassName: 'heart-fill',
        category: 'Healthy ' + label + '(s)',
        value: 'N/A',
        icon: 'pi-heart-fill',
        average: 'N/A',
        valueColor: '#374151',
        iconType: 'pi',
      },
    ];
  }

  checkConfigurationDetails() {
    this.hasBaseUrl = this.service.checkConfigurationDetails();
  }

  transformMaturityResponse(data: any): { rows: any[]; columns: any[] } {
    const details = data?.details || [];

    const extractMaturityLevel = (level: string): string => {
      if (!level) return 'M0';
      const match = level.match(/^(M\d)/);
      return match ? match[1] : level;
    };

    const rows = details.map((detail: any) => {
      const boardMaturity: any = {};
      (detail.maturityScores || []).forEach((score: any) => {
        if (score.kpiCategory) {
          boardMaturity[score.kpiCategory] = extractMaturityLevel(score.level);
        }
      });

      let completionValue = 'N/A';
      if (detail.completionPercentage != null) {
        completionValue = `${Math.round(detail.completionPercentage)}%`;
      }

      return {
        id: detail.hierarchyEntityNodeId || '',
        name: detail.organizationEntityName || '',
        health: detail.health || 'UNKNOWN',
        completion: completionValue,
        boardMaturity,
      };
    });

    const categorySet = new Set<string>();
    details.forEach((detail: any) => {
      (detail.maturityScores || []).forEach((score: any) => {
        if (score.kpiCategory) {
          categorySet.add(score.kpiCategory);
        }
      });
    });

    const categoryHeaderMap: { [key: string]: string } = {
      dora: 'DORA',
      value: 'Value',
      speed: 'Speed',
      quality: 'Quality',
    };

    const categoryColumns = Array.from(categorySet).map((cat) => ({
      field: cat,
      header:
        categoryHeaderMap[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
    }));

    const columns = [
      {
        field: 'name',
        header: data?.summary?.levelName
          ? data.summary.levelName.charAt(0).toUpperCase() +
            data.summary.levelName.slice(1) +
            ' Name'
          : 'Name',
      },
      { field: 'health', header: 'Overall Health' },
      { field: 'completion', header: 'Efficiency(%)' },
      ...categoryColumns,
    ];

    return { rows, columns };
  }

  ngOnDestroy() {
    this.service.setPEBData({});
    this.subscription.forEach((subscription) => subscription.unsubscribe());
    this.subscription = [];
  }
}
