/*******************************************************************************
 * Copyright 2014 CapitalOne, LLC.
 * Further development Copyright 2022 Sapient Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

/** Importing Services **/
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  Renderer2,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { HttpService } from '../../services/http.service';
import { SharedService } from '../../services/shared.service';
import { HelperService } from '../../services/helper.service';
import { faList, faChartPie } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  distinctUntilChanged,
  mergeMap,
  takeUntil,
} from 'rxjs/operators';
import { TemplatePortal } from '@angular/cdk/portal';
import { ExportExcelComponent } from 'src/app/component/export-excel/export-excel.component';
import { ExcelService } from 'src/app/services/excel.service';
import { Subject, throwError, Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { MetricItem } from 'src/app/dashboard/list-block/list-block.component';
import { mockConfigGlobalData } from './executive-mock-data';
import { error } from 'console';
import { FeatureFlagsService } from 'src/app/services/feature-toggle.service';

@Component({
  selector: 'app-executive-v2',
  templateUrl: './executive-v2.component.html',
  styleUrls: ['./executive-v2.component.css'],
})
export class ExecutiveV2Component implements OnInit, OnDestroy {
  @ViewChild('exportExcel') exportExcelComponent: ExportExcelComponent;
  filterData = [];
  completeFilterData = {};
  sonarKpiData = {};
  jenkinsKpiData = {};
  zypherKpiData = {};
  jiraKpiData = {};
  bitBucketKpiData = {};
  filterApplyData;
  kpiListSonar;
  kpiJenkins;
  kpiZypher;
  kpiJira;
  kpiBitBucket;
  loaderJenkins = false;
  faList = faList;
  faChartPie = faChartPie;
  subscriptions: any[] = [];
  noOfFilterSelected = 0;
  jiraKpiRequest;
  sonarKpiRequest;
  zypherKpiRequest;
  jenkinsKpiRequest;
  bitBucketKpiRequest;
  maturityColorCycleTime = ['#f5f5f5', '#f5f5f5', '#f5f5f5'];
  tooltip;
  selectedtype = 'scrum';
  configGlobalData;
  selectedPriorityFilter = {};
  selectedSonarFilter;
  selectedTestExecutionFilterData;
  sonarFilterData = [];
  testExecutionFilterData = [];
  selectedJobFilter = 'Select';
  selectedBranchFilter = 'Select';
  processedKPI11Value = {};
  serviceObject = {};
  isChartView = true;
  allKpiArray: any = [];
  colorObj = {};
  chartColorList = {};
  kpiSelectedFilterObj = {};
  kpiChartData = {};
  kpiThresholdObj = {};
  noKpis = false;
  noFilterApplyData = false;
  enableByUser = false;
  updatedConfigGlobalData;
  kpiConfigData = {};
  kpiLoader = new Set();
  kpiStatusCodeArr = {};
  noTabAccess = false;
  trendBoxColorObj: any;
  iSAdditionalFilterSelected = false;
  kpiDropdowns = {};
  showKpiTrendIndicator = {};
  hierarchyLevel;
  showChart = 'chart';
  displayModal = false;
  modalDetails = {
    header: '',
    tableHeadings: [],
    tableValues: [],
  };
  kpiExcelData;
  isGlobalDownload = false;
  kpiTrendsObj = {};
  selectedTab = '';
  showCommentIcon = false;
  noProjects = {};
  sprintsOverlayVisible = false;
  kpiCommentsCountObj: object = {};
  kpiTableHeadingArr: Array<object> = [];
  kpiTableDataObj: object = {};
  noOfDataPoints: number;
  maturityTableKpiList = [];
  loading = false;
  tabsArr = new Set();
  selectedKPITab: string;
  additionalFiltersArr = {};
  isRecommendationsEnabled = false;
  kpiList: Array<string> = [];
  releaseEndDate;
  timeRemaining = 0;
  immediateLoader = true;
  projectCount = 0;
  globalConfig: any;
  kpiTrendObject = {};
  durationFilter = 'Past 6 Months';
  durationFilterKpi202 = 'Past 6 Months';
  kpi202ViewOptions = ['By Workflow Group', 'By Status'];
  kpi202SelectedView = 'By Workflow Group';
  kpi202Switching = false;
  selectedTrend: any = [];
  iterationKPIData = {};
  dailyStandupKPIDetails = {};
  refreshCounter = 0;
  hieararchy: any;
  queryParamsSubscription!: Subscription;
  showSprintGoalsPanel = false;
  sprintGoalData: any = [];
  nonUniqueNames: boolean;
  defectsBreachedSLAs;
  defectsBreachedSLAsAllValues;
  kpi202WorkflowOrder: string[] = [];
  private kpi202WorkflowOrderFetched = false;

  private destroy$ = new Subject<void>();
  @ViewChild('recommendationsComponent', { read: ElementRef })
  recommendationsComponent: ElementRef;
  floatingRecommendation: boolean = false;
  hasBaseUrl = false;

  monthlyMetrics: MetricItem[] = [
    { label: 'Total PRs', value: 35, trend: 'neutral' },
    { label: 'Avg Review Time', value: '1.8 days', trend: 'neutral' },
    { label: 'Lines of Code', value: '12,450', trend: 'neutral' },
  ];
  qualityIndicators: MetricItem[] = [
    { label: 'Test Coverage', value: '94%', trend: 'positive' },
    { label: 'Code Duplication', value: '3%', trend: 'positive' },
    { label: 'Technical Debt', value: 'Medium', trend: 'negative' },
  ];
  goalsTargets: MetricItem[] = [
    { label: 'Sprint Velocity', value: 'On Track', trend: 'positive' },
    { label: 'Feature Completion', value: '89%', trend: 'positive' },
    { label: 'Bug Resolution', value: '85%', trend: 'negative' },
  ];

  mockUpdatedConfigGlobalData: any[];
  performanceSummaryCall: Subscription;
  currentBranch: any;
  allPerformanceSummaryData: any;
  filteredBranchData: any;
  selectedDateFilterValue: string;
  perfSummaryLoader: boolean = true;
  @ViewChild('recommendationsPortal') recommendationsPortal: TemplateRef<any>;
  kpiRecommData = {};

  isAskMeEnabled = false;

  constructor(
    public service: SharedService,
    private httpService: HttpService,
    public helperService: HelperService,
    private route: ActivatedRoute,
    private excelService: ExcelService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location,
    private renderer2: Renderer2,
    private viewContainerRef: ViewContainerRef,
    private readonly featureFlagService: FeatureFlagsService,
  ) {}

  ngAfterViewInit() {
    this.cdr.detectChanges();

    // Watch for changes and update portal
    this.service.passDataToDashboard.subscribe(() => {
      setTimeout(() => this.updateRecommendationsPortal(), 0);
    });
  }

  private updateRecommendationsPortal() {
    if (this.recommendationsPortal && this.shouldShowRecommendations()) {
      const portal = new TemplatePortal(
        this.recommendationsPortal,
        this.viewContainerRef,
      );
      this.service.setRecommendationsPortal(portal);
    } else {
      this.service.setRecommendationsPortal(null);
    }
  }

  shouldShowRecommendations() {
    return (
      this.floatingRecommendation &&
      this.isRecommendationsEnabled &&
      this.selectedtype?.toLowerCase() == 'scrum' &&
      this.projectCount <= 2 &&
      this.hasBaseUrl
    );
  }

  checkConfigurationDetails() {
    this.hasBaseUrl = this.service.checkConfigurationDetails();
  }

  arrayDeepCompare(a1, a2) {
    for (let idx = 0; idx < a1.length; idx++) {
      if (!this.helperService.deepEqual(a1[idx], a2[idx])) {
        return false;
      }
    }
    return true;
  }

  resetToDefaults() {
    this.noFilterApplyData = false;
    this.kpiLoader = new Set();
    this.processedKPI11Value = {};
    this.selectedBranchFilter = 'Select';
    this.serviceObject = {};
    this.kpi202WorkflowOrderFetched = false;
    this.kpi202WorkflowOrder = [];
  }

  setGlobalConfigData(globalConfig) {
    this.configGlobalData = globalConfig[
      this.selectedtype?.toLowerCase()
    ]?.filter(
      (item) =>
        item.boardSlug?.toLowerCase() === this.selectedTab.toLowerCase() ||
        item.boardName.toLowerCase() ===
          this.selectedTab.toLowerCase().split('-').join(' '),
    )[0]?.kpis;
    if (!this.configGlobalData) {
      this.configGlobalData = globalConfig['others'].filter(
        (item) =>
          item.boardSlug?.toLowerCase() === this.selectedTab.toLowerCase() ||
          item.boardName.toLowerCase() ===
            this.selectedTab.toLowerCase().split('-').join(' '),
      )[0]?.kpis;
    }
    this.updatedConfigGlobalData = this.configGlobalData?.filter(
      (item) => item.shown,
    );
  }

  processKpiConfigData() {
    const disabledKpis = this.configGlobalData?.filter(
      (item) => item.shown && !item.isEnabled,
    );
    // user can enable kpis from show/hide filter, added below flag to show different message to the user
    this.enableByUser = disabledKpis?.length ? true : false;
    // noKpis - if true, all kpis are not shown to the user (not showing kpis to the user)
    this.updatedConfigGlobalData = this.configGlobalData?.filter(
      (item) => item.shown,
    );
    const visibleKpis = this.configGlobalData?.filter((item) => item.isEnabled);
    this.kpiList = this.configGlobalData?.map((kpi) => kpi.kpiId);
    if (
      this.updatedConfigGlobalData?.length === 0 ||
      visibleKpis?.length === 0
    ) {
      this.noKpis = true;
      if (this.updatedConfigGlobalData?.length && visibleKpis?.length === 0) {
        this.enableByUser = true;
      } else {
        this.enableByUser = false;
      }
    } else {
      this.noKpis = false;
      this.enableByUser = false;
    }

    this.maturityTableKpiList = [];
    this.configGlobalData?.forEach((element) => {
      if (element.shown && element.isEnabled) {
        this.kpiConfigData[element.kpiId] = true;
        if (!this.kpiTrendsObj.hasOwnProperty(element.kpiId)) {
          if (this.selectedTab !== 'iteration') {
            this.createTrendsData(element.kpiId);
          }
          this.handleMaturityTableLoader();
        }
      } else {
        this.kpiConfigData[element.kpiId] = false;
      }
    });
  }

  private setupSearchQuerySubscription(): void {
    this.service.searchQuery$
      .pipe(takeUntil(this.destroy$))
      .subscribe((searchQuery) => {
        if (searchQuery) {
          setTimeout(
            () => this.handlePageScrollOnSearch(searchQuery.value),
            1500,
          );
        }
      });
  }

  private setupScrumKanbanSwitchSubscription(): void {
    this.subscriptions.push(
      this.service.onScrumKanbanSwitch.subscribe((data) => {
        this.resetToDefaults();
        this.selectedtype = data.selectedType;
        this.kpiTrendObject = {};
        this.noProjects = this.service.noProjectsObj;
      }),
    );
  }

  ngOnInit() {
    // const selectedTab = window.location.hash.substring(1);
    // this.selectedTab = selectedTab?.split('/')[2] ? selectedTab?.split('/')[2] : 'my-knowhow';
    this.featureFlagService.isFeatureEnabled('ASK_ME').then((res) => {
      this.isAskMeEnabled = res;
    });

    this.initializeUserDetails();
    this.checkConfigurationDetails();
    this.setupScrumKanbanSwitchSubscription();

    this.subscriptions.push(
      this.service.onTabSwitch.subscribe((data) => {
        this.resetToDefaults();
        this.selectedTab = data.selectedBoard;
        this.noProjects = this.service.noProjectsObj;
      }),
    );
    this.subscriptions.push(
      this.service.isSprintGoal.subscribe((flag) => {
        this.showSprintGoalsPanel = flag;
        this.getSprintGoalData();
      }),
    );

    this.subscriptions.push(
      this.service.globalDashConfigData.subscribe((globalConfig) => {
        this.globalConfig = JSON.parse(JSON.stringify(globalConfig));
        this.setGlobalConfigData(globalConfig);
        const enabledKPIs = globalConfig['enabledKPIs'] || [];
        setTimeout(() => {
          this.processKpiConfigData();
          this.setUpTabs();
          enabledKPIs.forEach((element) => {
            this.reloadKPI(element);
          });
        }, 500);
      }),
    );

    this.subscriptions.push(
      this.service.noSprintsObs.subscribe((res) => {
        this.noFilterApplyData = res;
      }),
    );

    this.subscriptions.push(
      this.service.noProjectsObjObs.subscribe((res) => {
        this.noProjects = res;
      }),
    );

    this.subscriptions.push(
      this.service.mapColorToProject
        .pipe(
          mergeMap((x) => {
            this.checkConfigurationDetails();
            this.maturityTableKpiList = [];
            this.colorObj = x;
            this.trendBoxColorObj = { ...x };
            this.kpiTableDataObj = {};
            this.sprintGoalData = [];
            for (const key in this.trendBoxColorObj) {
              const idx = key.lastIndexOf('_');
              const nodeName = key.slice(0, idx);
              this.trendBoxColorObj[nodeName] = this.trendBoxColorObj[key];
              this.kpiTableDataObj[key] = [];
            }
            this.projectCount = Object.keys(this.trendBoxColorObj)?.length;
            if (
              !this.kpiChartData ||
              Object.keys(this.kpiChartData)?.length <= 0
            ) {
              return this.service.passDataToDashboard;
            }
            for (const key in this.kpiChartData) {
              this.handleMaturityTableLoader();
            }
            return this.service.passDataToDashboard;
          }),
          distinctUntilChanged(),
        )
        .subscribe((sharedobject: any) => {
          // used to get all filter data when user click on apply button in filter
          this.maturityTableKpiList = [];
          if (!sharedobject?.filterData?.length) {
            this.noTabAccess = true;
            return;
          }
          this.serviceObject = JSON.parse(JSON.stringify(sharedobject));
          this.iSAdditionalFilterSelected = sharedobject?.isAdditionalFilters;
          this.receiveSharedData(sharedobject);
          this.getSprintGoalData();
          this.noTabAccess = false;
          this.handleMaturityTableLoader();
        }),
    );

    /**observable to get the type of view */
    this.subscriptions.push(
      this.service.showTableViewObs.subscribe((view) => {
        this.showChart = view;
      }),
    );

    this.selectedTrend = JSON.parse(
      JSON.stringify(this.service.getSelectedTrends()),
    );
    localStorage.setItem('selectedTrend', JSON.stringify(this.selectedTrend));

    this.subscriptions.push(
      this.service.selectedTrendsEventSubject.subscribe((trend) => {
        const selectedTrendFromLS =
          localStorage.getItem('selectedTrend') &&
          JSON.parse(localStorage.getItem('selectedTrend'));
        if (
          selectedTrendFromLS?.length > 0 &&
          (trend.length !== selectedTrendFromLS?.length ||
            !this.arrayDeepCompare(trend, selectedTrendFromLS))
        ) {
          this.selectedTrend = trend;
          localStorage.setItem(
            'selectedTrend',
            JSON.stringify(this.selectedTrend),
          );
          this.kpiSelectedFilterObj = {};
          this.service.setKpiSubFilterObj(null);
        } else {
          this.service.setKpiSubFilterObj(this.service.getKpiSubFilterObj());
          localStorage.setItem('selectedTrend', JSON.stringify(trend));
        }
      }),
    );
    /** Get recommendations flag */
    this.subscriptions.push(
      this.service.isRecommendationsEnabledObs.subscribe((item) => {
        this.isRecommendationsEnabled = item;
      }),
    );

    this.service.getEmptyData().subscribe((val) => {
      if (val) {
        this.noTabAccess = true;
      } else {
        this.noTabAccess = false;
      }
    });

    this.subscriptions.push(
      this.service.triggerAdditionalFilters.subscribe((data) => {
        Object.keys(data)?.length &&
          this.updatedConfigGlobalData.forEach((kpi) => {
            Promise.resolve().then(() => {
              this.handleSelectedOption(data, kpi);
            });
          });
      }),
    );

    this.queryParamsSubscription = this.route.queryParams
      // .pipe(first())
      .subscribe((params) => {
        if (this.refreshCounter) {
          return;
        }
        let stateFiltersParam = params['stateFilters'];
        const kpiFiltersParam = params['kpiFilters'];
        const tabParam = params['selectedTab'];
        if (!tabParam) {
          if (!this.service.getSelectedTab()) {
            let selectedTab = decodeURIComponent(this.location.path());
            selectedTab = selectedTab?.split('/')[2]
              ? selectedTab?.split('/')[2]
              : 'iteration';
            selectedTab = selectedTab?.split(' ').join('-').toLowerCase();
            this.selectedTab = selectedTab.split('?statefilters=')[0];
            this.service.setSelectedBoard(this.selectedTab);
          } else {
            this.selectedTab = this.service.getSelectedTab();
            this.service.setSelectedBoard(this.selectedTab);
          }
        } else {
          this.selectedTab = tabParam;
          this.service.setSelectedBoard(this.selectedTab);
        }

        if (this.selectedTab === 'kpi-maturity') {
          setTimeout(() => {
            this.router.navigate([`dashboard/${this.selectedTab}`], {
              queryParams: {
                stateFilters: stateFiltersParam,
                kpiFilters: kpiFiltersParam,
                selectedTab: this.selectedTab,
              }, // Pass the object here
            });
          });
        }
        if (this.selectedTab === 'home') {
          setTimeout(() => {
            this.router.navigate([`dashboard/${this.selectedTab}`], {
              queryParams: {
                stateFilters: stateFiltersParam,
                kpiFilters: kpiFiltersParam,
                selectedTab: this.selectedTab,
              }, // Pass the object here
            });
          });
        }
        if (stateFiltersParam?.length) {
          if (stateFiltersParam?.length <= 8 && kpiFiltersParam?.length <= 8) {
            this.httpService
              .handleRestoreUrl(stateFiltersParam, kpiFiltersParam)
              .pipe(
                catchError((error) => {
                  this.router.navigate(['/dashboard/Error']); // Redirect to the error page
                  setTimeout(() => {
                    this.service.raiseError({
                      status: 900,
                      message: error.message || 'Invalid URL.',
                    });
                  });

                  return throwError(error); // Re-throw the error so it can be caught by a global error handler if needed
                }),
              )
              .subscribe((response: any) => {
                if (response.success) {
                  const longKPIFiltersString =
                    response.data['longKPIFiltersString'];
                  const longStateFiltersString =
                    response.data['longStateFiltersString'];
                  stateFiltersParam = atob(longStateFiltersString);

                  if (longKPIFiltersString) {
                    const kpiFilterParamDecoded = atob(longKPIFiltersString);

                    const kpiFilterValFromUrl =
                      kpiFilterParamDecoded && JSON.parse(kpiFilterParamDecoded)
                        ? JSON.parse(kpiFilterParamDecoded)
                        : this.service.getKpiSubFilterObj();
                    this.service.setKpiSubFilterObj(kpiFilterValFromUrl);
                  }

                  this.urlRedirection(stateFiltersParam);
                  this.refreshCounter++;
                }
              });
          } else {
            try {
              stateFiltersParam = atob(stateFiltersParam);
              if (kpiFiltersParam) {
                const kpiFilterParamDecoded = atob(kpiFiltersParam);
                const kpiFilterValFromUrl =
                  kpiFilterParamDecoded && JSON.parse(kpiFilterParamDecoded)
                    ? JSON.parse(kpiFilterParamDecoded)
                    : this.service.getKpiSubFilterObj();
                this.service.setKpiSubFilterObj(kpiFilterValFromUrl);
              }
              // this.service.setBackupOfFilterSelectionState(JSON.parse(stateFiltersParam));
              this.urlRedirection(stateFiltersParam);
              this.refreshCounter++;
            } catch (error) {
              this.router.navigate(['/dashboard/Error']); // Redirect to the error page
              setTimeout(() => {
                this.service.raiseError({
                  status: 900,
                  message: 'Invalid URL.',
                });
              }, 100);
            }
          }
        }
      });
  }

  urlRedirection(decodedStateFilters) {
    const stateFiltersObjLocal = JSON.parse(decodedStateFilters);
    let currentUserProjectAccess = JSON.parse(
      localStorage.getItem('currentUserDetails'),
    )?.projectsAccess?.length
      ? JSON.parse(localStorage.getItem('currentUserDetails'))?.projectsAccess
      : [];
    currentUserProjectAccess = currentUserProjectAccess.flatMap(
      (row) => row.projects,
    );
    const ifSuperAdmin = JSON.parse(
      localStorage.getItem('currentUserDetails'),
    )?.authorities?.includes('ROLE_SUPERADMIN');
    let stateFilterObj = [];
    let projectLevelSelected = false;
    if (
      typeof stateFiltersObjLocal['parent_level'] === 'object' &&
      stateFiltersObjLocal['parent_level'] &&
      Object.keys(stateFiltersObjLocal['parent_level']).length > 0
    ) {
      stateFilterObj = [stateFiltersObjLocal['parent_level']];
    } else {
      stateFilterObj = stateFiltersObjLocal['primary_level'];
    }

    projectLevelSelected =
      stateFilterObj?.length &&
      stateFilterObj[0]?.labelName?.toLowerCase() === 'project';

    // Check if user has access to all project in stateFiltersObjLocal['primary_level']
    const hasAllProjectAccess = stateFilterObj?.every((filter) =>
      currentUserProjectAccess?.some(
        (project) => project.projectId === filter.basicProjectConfigId,
      ),
    );

    // Superadmin have all project access hence no need to check project for superadmin
    const hasAccessToAll = ifSuperAdmin || hasAllProjectAccess;

    if (projectLevelSelected) {
      if (hasAccessToAll) {
        this.service.setBackupOfFilterSelectionState(stateFiltersObjLocal);
      } else {
        this.service.setBackupOfFilterSelectionState(null);
        this.queryParamsSubscription.unsubscribe();
        this.router.navigate(['/dashboard/Error']);
        setTimeout(() => {
          this.service.raiseError({
            status: 901,
            message: 'No project access.',
          });
        }, 100);
      }
    }
  }

  // unsubscribing all Kpi Request
  ngOnDestroy() {
    this.refreshCounter = 0;
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
  Used to receive all filter data from filter component when user
  click apply and call kpi
   **/
  receiveSharedData($event) {
    this.sprintsOverlayVisible =
      this.service.getSelectedLevel()['hierarchyLevelId'] === 'project'
        ? true
        : false;
    this.selectedtype = $event.selectedType;
    if (localStorage?.getItem('completeHierarchyData')) {
      const hierarchyData = JSON.parse(
        localStorage.getItem('completeHierarchyData'),
      );
      if (
        Object.keys(hierarchyData).length > 0 &&
        hierarchyData[this.selectedtype?.toLowerCase()]
      ) {
        this.hierarchyLevel = hierarchyData[this.selectedtype?.toLowerCase()];
      }
    }
    if (
      $event.dashConfigData &&
      Object.keys($event.dashConfigData).length > 0
    ) {
      this.filterData = $event.filterData;
      this.completeFilterData = $event.completeFilterData;
      this.filterApplyData = $event.filterApplyData;
      this.globalConfig = $event.dashConfigData;
      this.configGlobalData = $event.dashConfigData[
        this.selectedtype?.toLowerCase()
      ]?.filter(
        (item) =>
          item.boardName.toLowerCase() === $event?.selectedTab?.toLowerCase() ||
          item.boardName.toLowerCase() ===
            $event?.selectedTab?.toLowerCase().split('-').join(' '),
      )[0]?.kpis;
      if (this.selectedTab === 'release') {
        const selectedRelease = this.filterData?.filter(
          (x) =>
            x.nodeId === this.filterApplyData?.selectedMap?.release?.[0] &&
            x.labelName?.toLowerCase() === 'release',
        )[0];
        const endDate =
          selectedRelease !== undefined
            ? selectedRelease?.releaseEndDate
            : undefined;
        this.releaseEndDate = new Date(endDate).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        this.timeRemaining = this.calcBusinessDays(today, endDate);
        this.service.iterationConfigData.next({ daysLeft: this.timeRemaining });
        this.hieararchy = this.filterApplyData['hieararchy'];
      } else if (this.selectedTab === 'iteration') {
        const selectedSprint = this.filterData?.filter(
          (x) => x.nodeId == this.filterApplyData?.selectedMap['sprint'][0],
        )[0];
        if (selectedSprint) {
          const today = this.stripTime(new Date());
          const endDate = this.stripTime(
            new Date(selectedSprint?.sprintEndDate),
          );
          this.timeRemaining = this.calcBusinessDays(today, endDate);
          this.service.iterationConfigData.next({
            daysLeft: this.timeRemaining,
          });
          this.iterationKPIData = {};
          this.hieararchy = this.filterApplyData['hieararchy'];
        }
      } else if (
        this.selectedTab === 'backlog' ||
        this.selectedTab === 'developer'
      ) {
        this.hieararchy = this.filterApplyData['hieararchy'];
      }
      if (!this.configGlobalData?.length && $event.dashConfigData) {
        this.configGlobalData = $event.dashConfigData[
          this.selectedtype?.toLowerCase()
        ]?.filter(
          (item) =>
            item.boardSlug.toLowerCase() ===
              $event?.selectedTab?.toLowerCase() ||
            item.boardName.toLowerCase() ===
              $event?.selectedTab?.toLowerCase().split('-').join(' '),
        )[0]?.kpis;
        if (!this.configGlobalData) {
          this.configGlobalData = $event.dashConfigData['others']?.filter(
            (item) =>
              item.boardSlug.toLowerCase() ===
                $event?.selectedTab?.toLowerCase() ||
              item.boardName.toLowerCase() ===
                $event?.selectedTab?.toLowerCase().split('-').join(' '),
          )[0]?.kpis;
        }
      }

      this.updatedConfigGlobalData = this.configGlobalData?.filter(
        (item) => item.shown,
      );

      this.mockUpdatedConfigGlobalData = mockConfigGlobalData;

      this.tooltip = $event.configDetails;
      this.additionalFiltersArr = {};
      this.noOfDataPoints =
        this.selectedTab.toLowerCase() !== 'developer' &&
        this.coundMaxNoOfSprintSelectedForProject($event);
      this.nonUniqueNames = false;
      this.allKpiArray = [];
      this.kpiChartData = {};
      this.chartColorList = {};
      this.kpiDropdowns = {};
      this.kpiTrendsObj = {};
      this.kpiTableDataObj = {};
      this.kpiLoader = new Set();
      this.kpiStatusCodeArr = {};
      this.immediateLoader = true;
      this.sprintGoalData = [];
      this.kpiRecommData = {};
      // Reset workflow order fetch flag and restore cached order for the new project
      this.kpi202WorkflowOrderFetched = false;
      const incomingProjectId =
        $event.filterApplyData?.selectedMap?.project?.[0] ||
        this.service.getSelectedTrends()?.[0]?.basicProjectConfigId;
      if (incomingProjectId) {
        const cacheKey = `kpi202_workflow_order_${incomingProjectId}`;
        const cached = localStorage.getItem(cacheKey);
        this.kpi202WorkflowOrder = cached ? JSON.parse(cached) : [];
      } else {
        this.kpi202WorkflowOrder = [];
      }
      for (const key in this.colorObj) {
        const idx = key.lastIndexOf('_');
        this.kpiTableDataObj[key] = [];
      }

      const isDeveloper =
        this.selectedTab?.toLowerCase() === 'developer' ||
        this.router.url.toLowerCase().includes('developer');
      if (!isDeveloper) {
        this.service.setAddtionalFilterBackup({});
      }
      if (this.configGlobalData?.length) {
        // set up dynamic tabs
        this.setUpTabs();
      }

      if (
        !$event.filterApplyData['ids'] ||
        !$event.filterApplyData['ids']?.length ||
        !$event.filterApplyData['ids'][0]
      ) {
        this.noFilterApplyData = true;
      } else {
        this.noFilterApplyData = false;
        this.filterData = $event.filterData;
        this.filterApplyData = $event.filterApplyData;
        this.noOfFilterSelected = Object.keys(this.filterApplyData).length;

        this.selectedJobFilter = 'Select';
        this.loading = $event.loading;
        if (this.filterData?.length && $event.makeAPICall) {
          this.noTabAccess = false;
          // call kpi request according to tab selected
          if (this.configGlobalData?.length > 0) {
            this.processKpiConfigData();
            const kpiIdsForCurrentBoard = this.configGlobalData?.map(
              (kpiDetails) => kpiDetails.kpiId,
            );

            if (this.service.getSelectedType().toLowerCase() === 'kanban') {
              this.groupJiraKanbanKpi(kpiIdsForCurrentBoard);
              this.groupSonarKanbanKpi(kpiIdsForCurrentBoard);
              this.groupJenkinsKanbanKpi(kpiIdsForCurrentBoard);
              this.groupZypherKanbanKpi(kpiIdsForCurrentBoard);
              this.groupBitBucketKanbanKpi(kpiIdsForCurrentBoard);
            } else {
              this.groupJiraKpi(kpiIdsForCurrentBoard);
              this.groupSonarKpi(kpiIdsForCurrentBoard);
              this.groupJenkinsKpi(kpiIdsForCurrentBoard);
              this.groupZypherKpi(kpiIdsForCurrentBoard);
              this.groupBitBucketKpi(kpiIdsForCurrentBoard);
            }
            this.immediateLoader = false;
            this.createKpiTableHeads(this.selectedtype?.toLowerCase());

            const projectLevel = this.filterData.filter(
              (x) => x.labelName == 'project',
            )[0]?.level;
            if (projectLevel) {
              if (this.filterApplyData.level == projectLevel) {
                this.getKpiCommentsCount();
              }
            }
          }
        } else {
          this.noTabAccess = true;
        }
        if (
          this.hierarchyLevel &&
          this.hierarchyLevel[+this.filterApplyData.level - 1]
            ?.hierarchyLevelId === 'project'
        ) {
          this.showCommentIcon = true;
        } else {
          this.showCommentIcon = false;
        }
      }
    }
  }

  setUpTabs() {
    const tabsArray = new Set(
      this.configGlobalData?.map(
        (element) =>
          element.shown &&
          element.isEnabled &&
          element?.kpiDetail?.kpiSubCategory,
      ),
    );
    // if (this.selectedTab === 'release') {
    //   const tempArray = [...this.service.getDashConfigData()['scrum'], ...this.service.getDashConfigData()['others']];
    //   const tabTempSet = tempArray.filter(element => tabsArray.has(element.boardName));
    //   this.tabsArr = new Set(tabTempSet.map(element => element.boardName));
    // } else {
    this.tabsArr = new Set([...tabsArray].filter(Boolean));
    // }
    const it = this.tabsArr.values();
    //get first entry:
    const first = it.next();
    //get value out of the iterator entry:
    const value = first.value;
    this.selectedKPITab = value;
  }

  selectKPITab(tab) {
    this.selectedKPITab = tab;
  }

  // download excel functionality
  downloadExcel(kpiId, kpiName, isKanban, additionalFilterSupport, charType) {
    this.exportExcelComponent.downloadExcel(
      kpiId,
      kpiName,
      isKanban,
      additionalFilterSupport,
      this.filterApplyData,
      this.filterData,
      this.iSAdditionalFilterSelected,
      charType,
    );
  }

  // Used for grouping all Sonar kpi from master data and calling Sonar kpi.
  groupSonarKpi(kpiIdsForCurrentBoard) {
    this.kpiListSonar = this.helperService.groupKpiFromMaster(
      'Sonar',
      false,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiListSonar?.kpiList?.length > 0) {
      const kpiArr = this.kpiListSonar.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postSonarKpi(this.kpiListSonar, 'sonar');
    }
  }

  // Used for grouping all Jenkins kpi from master data and calling jenkins kpi.
  groupJenkinsKpi(kpiIdsForCurrentBoard) {
    this.kpiJenkins = this.helperService.groupKpiFromMaster(
      'Jenkins',
      false,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiJenkins?.kpiList?.length > 0) {
      const kpiArr = this.kpiJenkins.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postJenkinsKpi(this.kpiJenkins, 'jenkins');
    }
  }

  // Used for grouping all Sonar kpi from master data and calling Sonar kpi.
  groupZypherKpi(kpiIdsForCurrentBoard) {
    // creating a set of unique group Ids
    const groupIdSet = new Set();
    this.updatedConfigGlobalData?.forEach((obj) => {
      if (!obj['kpiDetail'].kanban && obj['kpiDetail'].kpiSource === 'Zypher') {
        groupIdSet.add(obj['kpiDetail'].groupId);
      }
    });
    // sending requests after grouping the the KPIs according to group Id
    groupIdSet.forEach((groupId) => {
      if (groupId) {
        this.kpiZypher = this.helperService.groupKpiFromMaster(
          'Zypher',
          false,
          this.updatedConfigGlobalData,
          this.filterApplyData,
          this.filterData,
          kpiIdsForCurrentBoard,
          groupId,
          '',
        );
        if (this.kpiZypher?.kpiList?.length > 0) {
          const kpiArr = this.kpiZypher.kpiList.map(
            (kpi: { kpiId: any }) => kpi.kpiId,
          );
          kpiArr.forEach((element) => this.kpiLoader.add(element));
          this.postZypherKpi(this.kpiZypher, 'zypher');
        }
      }
    });
  }

  // Used for grouping all Jira kpi from master data and calling Jira kpi.(only for scrum).
  groupJiraKpi(kpiIdsForCurrentBoard) {
    this.jiraKpiData = {};
    // creating a set of unique group Ids
    const groupIdSet = new Set();
    this.updatedConfigGlobalData?.forEach((obj) => {
      if (!obj['kpiDetail'].kanban && obj['kpiDetail'].kpiSource === 'Jira') {
        groupIdSet.add(obj['kpiDetail'].groupId);
      }
    });

    if (this.selectedTab === 'iteration') {
      // check for Capacity KPI and sort
      this.updatedConfigGlobalData = this.updatedConfigGlobalData.sort(
        (a, b) => a.kpiDetail.defaultOrder - b.kpiDetail.defaultOrder,
      );
    }

    // sending requests after grouping the the KPIs according to group Id
    groupIdSet.forEach((groupId) => {
      if (groupId) {
        this.kpiJira = this.helperService.groupKpiFromMaster(
          'Jira',
          false,
          this.updatedConfigGlobalData,
          this.filterApplyData,
          this.filterData,
          kpiIdsForCurrentBoard,
          groupId,
          '',
        );
        if (this.kpiJira?.kpiList?.length > 0) {
          const kpiArr = this.kpiJira.kpiList.map(
            (kpi: { kpiId: any }) => kpi.kpiId,
          );
          kpiArr.forEach((element) => this.kpiLoader.add(element));
          this.postJiraKpi(this.kpiJira, 'jira', true);
        }
      }
    });
  }

  // Used for grouping all jira kpi of kanban from master data and calling jira kpi of kanban.
  groupJiraKanbanKpi(kpiIdsForCurrentBoard) {
    this.jiraKpiData = {};
    // creating a set of unique group Ids
    const groupIdSet = new Set();
    this.updatedConfigGlobalData?.forEach((obj) => {
      if (obj['kpiDetail'].kanban && obj['kpiDetail'].kpiSource === 'Jira') {
        groupIdSet.add(obj['kpiDetail'].groupId);
      }
    });

    // sending requests after grouping the the KPIs according to group Id
    groupIdSet.forEach((groupId) => {
      if (groupId) {
        this.kpiJira = this.helperService.groupKpiFromMaster(
          'Jira',
          true,
          this.updatedConfigGlobalData,
          this.filterApplyData,
          this.filterData,
          kpiIdsForCurrentBoard,
          groupId,
          '',
        );
        if (this.kpiJira?.kpiList?.length > 0) {
          const kpiArr = this.kpiJira.kpiList.map(
            (kpi: { kpiId: any }) => kpi.kpiId,
          );
          kpiArr.forEach((element) => this.kpiLoader.add(element));
          this.postJiraKanbanKpi(this.kpiJira, 'jira');
        }
      }
    });
  }
  // Used for grouping all Sonar kpi of kanban from master data and calling Sonar kpi.
  groupSonarKanbanKpi(kpiIdsForCurrentBoard) {
    this.kpiListSonar = this.helperService.groupKpiFromMaster(
      'Sonar',
      true,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiListSonar?.kpiList?.length > 0) {
      const kpiArr = this.kpiListSonar.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postSonarKanbanKpi(this.kpiListSonar, 'sonar');
    }
  }

  // Used for grouping all Jenkins kpi of kanban from master data and calling jenkins kpi.
  groupJenkinsKanbanKpi(kpiIdsForCurrentBoard) {
    this.kpiJenkins = this.helperService.groupKpiFromMaster(
      'Jenkins',
      true,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiJenkins?.kpiList?.length > 0) {
      const kpiArr = this.kpiJenkins.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postJenkinsKanbanKpi(this.kpiJenkins, 'jenkins');
    }
  }

  // Used for grouping all Zypher kpi of kanban from master data and calling Zypher kpi.
  groupZypherKanbanKpi(kpiIdsForCurrentBoard) {
    this.kpiZypher = this.helperService.groupKpiFromMaster(
      'Zypher',
      true,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiZypher?.kpiList?.length > 0) {
      const kpiArr = this.kpiZypher.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postZypherKanbanKpi(this.kpiZypher, 'zypher');
    }
  }

  // Used for grouping all BitBucket kpi of kanban from master data and calling BitBucket kpi.
  groupBitBucketKanbanKpi(kpiIdsForCurrentBoard) {
    this.kpiBitBucket = this.helperService.groupKpiFromMaster(
      'BitBucket',
      true,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiBitBucket?.kpiList?.length > 0) {
      const kpiArr = this.kpiBitBucket.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postBitBucketKanbanKpi(this.kpiBitBucket, 'bitbucket');
      this.perfSummaryLoader = true;
      this.performanceSummary(this.kpiBitBucket);
    }
  }

  // Used for grouping all BitBucket kpi of scrum from master data and calling BitBucket kpi.
  groupBitBucketKpi(kpiIdsForCurrentBoard) {
    this.kpiBitBucket = this.helperService.groupKpiFromMaster(
      'BitBucket',
      false,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      kpiIdsForCurrentBoard,
      '',
      '',
    );
    if (this.kpiBitBucket?.kpiList?.length > 0) {
      const kpiArr = this.kpiBitBucket.kpiList.map(
        (kpi: { kpiId: any }) => kpi.kpiId,
      );
      kpiArr.forEach((element) => this.kpiLoader.add(element));
      this.postBitBucketKpi(this.kpiBitBucket, 'bitbucket');
      this.perfSummaryLoader = true;
      this.performanceSummary(this.kpiBitBucket);
    }
  }

  handleKPIError(data) {
    data.kpiList.forEach((element) => {
      this.kpiLoader.delete(element.kpiId);
      this.kpiStatusCodeArr[element.kpiId] = '500';
    });
  }

  // calls after receiving response from sonar
  afterSonarKpiResponseReceived(getData, postData) {
    this.sonarFilterData.length = 0;
    if (getData !== null && getData[0] !== 'error' && !getData['error']) {
      // creating array into object where key is kpi id
      this.sonarKpiData = this.helperService.createKpiWiseId(getData);
      this.fillKPIResponseCode(this.sonarKpiData);
      // creating Sonar filter and finding unique keys from all the sonar kpis
      this.sonarFilterData = this.helperService.createSonarFilter(
        this.sonarKpiData,
        this.selectedtype,
      );
      /** writing hack for unit test coverage kpi */
      this.formatKPI17Data();
      this.createAllKpiArray(this.sonarKpiData);
      this.removeLoaderFromKPIs(this.sonarKpiData);
    } else {
      this.sonarKpiData = getData;
      this.handleKPIError(postData);
    }
  }

  formatKPI17Data() {
    if (this.sonarKpiData['kpi17']?.trendValueList?.length > 0) {
      const overallObj = {
        filter: 'Overall',
        value: [],
      };
      for (
        let i = 0;
        i < this.sonarKpiData['kpi17']?.trendValueList?.length;
        i++
      ) {
        for (
          let j = 0;
          j < this.sonarKpiData['kpi17']?.trendValueList[i]?.value?.length;
          j++
        ) {
          if (
            this.sonarKpiData['kpi17']?.trendValueList[i]?.filter ===
            'Average Coverage'
          ) {
            const obj = {
              filter: this.sonarKpiData['kpi17']?.trendValueList[i]?.filter,
              ...this.sonarKpiData['kpi17']?.trendValueList[i]?.value[j],
            };
            overallObj['value'].push(obj);
          }
        }
      }
      this.sonarKpiData['kpi17']?.trendValueList.push(overallObj);
    }
  }

  // calls after receiving response from zypher
  afterZypherKpiResponseReceived(getData, postData) {
    this.testExecutionFilterData.length = 0;
    this.selectedTestExecutionFilterData = {};
    if (getData !== null && getData[0] !== 'error' && !getData['error']) {
      // creating array into object where key is kpi id
      this.zypherKpiData = this.helperService.createKpiWiseId(getData);
      this.fillKPIResponseCode(this.zypherKpiData);
      let calculatedObj;
      if (this.selectedtype !== 'kanban') {
        calculatedObj = this.helperService.calculateTestExecutionData(
          'kpi70',
          false,
          this.zypherKpiData,
        );
      } else {
        calculatedObj = this.helperService.calculateTestExecutionData(
          'kpi71',
          false,
          this.zypherKpiData,
        );
      }
      this.selectedTestExecutionFilterData =
        calculatedObj['selectedTestExecutionFilterData'];
      this.testExecutionFilterData = calculatedObj['testExecutionFilterData'];

      this.createAllKpiArray(this.zypherKpiData);
      this.removeLoaderFromKPIs(this.zypherKpiData);
    } else {
      this.zypherKpiData = getData;
      this.handleKPIError(postData);
    }
  }

  // calling post request of sonar of scrum and storing in sonarKpiData id wise
  postSonarKpi(postData, source): void {
    this.service.setKPIPostSonarData(postData);
    if (this.sonarKpiRequest && this.sonarKpiRequest !== '') {
      this.sonarKpiRequest.unsubscribe();
    }
    this.sonarKpiRequest = this.httpService.postKpi(postData, source).subscribe(
      (getData) => {
        this.setupSearchQuerySubscription();
        this.afterSonarKpiResponseReceived(getData, postData);
      },
      (error) => {
        // Handle error
        this.handleKPIError(postData);
      },
    );
  }
  // calling post request of sonar of Kanban and storing in sonarKpiData id wise
  postSonarKanbanKpi(postData, source): void {
    if (this.sonarKpiRequest && this.sonarKpiRequest !== '') {
      this.sonarKpiRequest.unsubscribe();
    }
    this.sonarKpiRequest = this.httpService
      .postKpiKanban(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          this.afterSonarKpiResponseReceived(getData, postData);
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  // calling post request of Jenkins of scrum and storing in jenkinsKpiData id wise
  postJenkinsKpi(postData, source): void {
    this.service.setKPIPostJenkinsData(postData);
    this.loaderJenkins = true;
    if (this.jenkinsKpiRequest && this.jenkinsKpiRequest !== '') {
      this.jenkinsKpiRequest.unsubscribe();
    }
    this.jenkinsKpiRequest = this.httpService
      .postKpi(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          this.loaderJenkins = false;
          if (getData !== null) {
            this.jenkinsKpiData = getData;
            this.createAllKpiArray(this.jenkinsKpiData);
            this.removeLoaderFromKPIs(this.jenkinsKpiData);

            for (const obj in getData) {
              getData[getData[obj].kpiId] = getData[obj];
            }
            this.fillKPIResponseCode(getData);
          } else {
            this.handleKPIError(postData);
          }
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  // Keep 'Select' on top
  originalOrder = (a, b): number => (a.key === 'Select' ? -1 : a.key);

  // calling post request of Jenkins of Kanban and storing in jenkinsKpiData id wise
  postJenkinsKanbanKpi(postData, source): void {
    this.loaderJenkins = true;
    if (this.jenkinsKpiRequest && this.jenkinsKpiRequest !== '') {
      this.jenkinsKpiRequest.unsubscribe();
    }
    this.jenkinsKpiRequest = this.httpService
      .postKpiKanban(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          this.loaderJenkins = false;
          // move Overall to top of trendValueList
          if (getData !== null) {
            // && getData[0] !== 'error') {
            this.jenkinsKpiData = getData;
            this.createAllKpiArray(this.jenkinsKpiData);
            this.removeLoaderFromKPIs(this.jenkinsKpiData);

            for (const obj in getData) {
              getData[getData[obj].kpiId] = getData[obj];
            }
            this.fillKPIResponseCode(getData);
          } else {
            this.handleKPIError(postData);
          }
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  // calling post request of Zypher(scrum)
  postZypherKpi(postData, source): void {
    if (postData?.kpiList?.length) {
      this.service.setKPIPostZypherData(postData);
    }
    this.zypherKpiRequest = this.httpService
      .postKpi(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          this.afterZypherKpiResponseReceived(getData, postData);
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }
  // calling post request of Zypher(kanban)
  postZypherKanbanKpi(postData, source): void {
    if (this.zypherKpiRequest && this.zypherKpiRequest !== '') {
      this.zypherKpiRequest.unsubscribe();
      postData?.kpiList?.forEach((element) => {
        this.kpiLoader.delete(element.kpiId);
      });
    }
    if (postData?.kpiList?.length) {
      this.service.setKPIPostZypherData(postData);
    }
    this.zypherKpiRequest = this.httpService
      .postKpiKanban(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          this.afterZypherKpiResponseReceived(getData, postData);
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  // post request of Jira(scrum)
  postJiraKpi(postData, source, bool): void {
    if (bool) {
      this.service.setKPIPostData(postData);
    }
    if (
      this.selectedTab !== 'release' &&
      this.selectedTab !== 'backlog' &&
      this.selectedTab !== 'iteration'
    ) {
      const kpi171 = postData.kpiList.find((kpi) => kpi.kpiId === 'kpi171');
      if (kpi171) {
        kpi171['filterDuration'] = this.appendFilterDuratioKpi171();
      }
      const kpi202 = postData.kpiList.find((kpi) => kpi.kpiId === 'kpi202');
      if (kpi202) {
        kpi202['filterDuration'] = this.appendFilterDurationKpi202();
      }

      this.jiraKpiRequest = this.httpService
        .postKpi(postData, source)
        .subscribe(
          (getData) => {
            this.setupSearchQuerySubscription();
            if (
              getData !== null &&
              getData[0] !== 'error' &&
              !getData['error']
            ) {
              //Extracting sprint goal data
              const kpi187Data = getData.find(
                (data) => data.kpiId === 'kpi189',
              );
              if (
                kpi187Data &&
                kpi187Data.hasOwnProperty('trendValueList') &&
                kpi187Data['trendValueList'].length
              ) {
                this.sprintGoalData = JSON.parse(
                  JSON.stringify(kpi187Data['trendValueList']),
                );
              }

              const releaseFrequencyInd = getData.findIndex(
                (de) => de.kpiId === 'kpi73',
              );
              if (releaseFrequencyInd !== -1) {
                getData[releaseFrequencyInd].trendValueList?.map(
                  (trendData) => {
                    const valueLength = trendData.value.length;
                    if (
                      valueLength > this.tooltip.sprintCountForKpiCalculation
                    ) {
                      trendData.value = trendData.value.splice(
                        -this.tooltip.sprintCountForKpiCalculation,
                      );
                    }
                  },
                );
              }
              // creating array into object where key is kpi id
              const localVariable = this.helperService.createKpiWiseId(getData);

              this.fillKPIResponseCode(localVariable);
              if (
                localVariable &&
                localVariable['kpi3'] &&
                localVariable['kpi3'].maturityValue
              ) {
                this.colorAccToMaturity(localVariable['kpi3'].maturityValue);
              }

              this.jiraKpiData = Object.assign(
                {},
                this.jiraKpiData,
                localVariable,
              );
              this.createAllKpiArray(localVariable);
              this.removeLoaderFromKPIs(localVariable);
            } else {
              this.jiraKpiData = getData;
              this.handleKPIError(postData);
            }
          },
          (error) => {
            // Handle error
            this.handleKPIError(postData);
          },
        );
      return;
    } else if (this.selectedTab === 'release') {
      this.postJiraKPIForRelease(postData, source);
    } else if (this.selectedTab === 'backlog') {
      this.postJiraKPIForBacklog(postData, source);
    } else if (this.selectedTab === 'iteration') {
      this.postJiraKPIForIteration(postData, source);
    }
  }

  // post request of Jira(scrum) hygiene
  /**
   * Posts KPI data for the current iteration to the Jira service and processes the response.
   * Updates local KPI data and handles errors appropriately.
   *
   * @param postData - The data to be posted to the Jira service.
   * @param source - The source identifier for the KPI data.
   * @returns void
   * @throws Handles errors internally and calls handleKPIError on failure.
   */
  postJiraKPIForIteration(postData, source): void {
    this.httpService.postKpiNonTrend(postData, source).subscribe(
      (getData) => {
        this.setupSearchQuerySubscription();
        if (getData !== null && getData[0] !== 'error' && !getData['error']) {
          // creating array into object where key is kpi id
          const localVariable = this.helperService.createKpiWiseId(getData);

          this.iterationKPIData = Object.assign(
            {},
            this.iterationKPIData,
            localVariable,
          );
          this.removeLoaderFromKPIs(localVariable);

          if (localVariable && localVariable['kpi121']) {
            const iterationConfigData = {
              daysLeft: this.timeRemaining,
              capacity: {
                value: {
                  value: localVariable['kpi121'].trendValueList?.value
                    ? localVariable['kpi121'].trendValueList?.value
                    : 0,
                },
              },
            };
            this.service.iterationConfigData.next(iterationConfigData);
          }
          if (this.iterationKPIData && this.iterationKPIData['kpi154']) {
            this.dailyStandupKPIDetails = this.updatedConfigGlobalData.filter(
              (kpi) => kpi.kpiId !== 'kpi154',
            )[0].kpiDetail;
          }
        } else {
          this.handleKPIError(postData);
        }
      },
      (error) => {
        // Handle error
        this.handleKPIError(postData);
      },
    );
  }

  postJiraKPIForBacklog(postData, source) {
    this.jiraKpiRequest = this.httpService
      .postKpiNonTrend(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          if (getData !== null && getData[0] !== 'error' && !getData['error']) {
            // creating array into object where key is kpi id
            const localVariable = this.helperService.createKpiWiseId(getData);
            this.fillKPIResponseCode(localVariable);

            this.updateXAxisTicks(localVariable);

            this.jiraKpiData = Object.assign(
              {},
              this.jiraKpiData,
              localVariable,
            );
            this.createAllKpiArrayForBacklog(this.jiraKpiData);
            this.removeLoaderFromKPIs(localVariable);
          } else {
            this.handleKPIError(postData);
          }
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  updateXAxisTicks(localVariable) {
    for (const kpi in localVariable) {
      const localVarKpi =
        localVariable[kpi].trendValueList && localVariable[kpi].xAxisValues;
      if (localVarKpi) {
        localVariable[kpi].trendValueList.forEach((trendElem) => {
          trendElem.value.forEach((valElem) => {
            if (
              valElem.value.length === 5 &&
              localVariable[kpi].xAxisValues.length === 5
            ) {
              valElem.value.forEach((element, index) => {
                element['xAxisTick'] = localVariable[kpi].xAxisValues[index];
              });
            }
          });
        });
      }
    }
  }

  postJiraKPIForRelease(postData, source) {
    /** Temporary Fix,  sending all KPI in kpiList when refreshing kpi after field mapping change*/
    /** Todo : Need to rework when BE cache issue will be fixed */
    this.updatedConfigGlobalData.forEach((kpi) => {
      if (!postData.kpiList.map((obj) => obj?.kpiId).includes(kpi.kpiId)) {
        postData.kpiList.push(kpi);
      }
    });
    this.jiraKpiRequest = this.httpService
      .postKpiNonTrend(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          if (getData !== null && getData[0] !== 'error' && !getData['error']) {
            /** creating array into object where key is kpi id */
            const localVariable = this.helperService.createKpiWiseId(getData);
            this.fillKPIResponseCode(localVariable);
            this.removeLoaderFromKPIs(localVariable);
            this.jiraKpiData = Object.assign(
              {},
              this.jiraKpiData,
              localVariable,
            );
            this.createAllKpiArray(localVariable);
          } else {
            this.handleKPIError(postData);
          }
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  // post request of BitBucket(scrum)
  postBitBucketKpi(postData, source): void {
    if (this.bitBucketKpiRequest && this.bitBucketKpiRequest !== '') {
      this.bitBucketKpiRequest.unsubscribe();
    }
    this.bitBucketKpiRequest = this.httpService
      .postKpi(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          if (getData !== null && getData[0] !== 'error' && !getData['error']) {
            // creating array into object where key is kpi id
            this.bitBucketKpiData = this.helperService.createKpiWiseId(getData);
            this.fillKPIResponseCode(this.bitBucketKpiData);
            this.createAllKpiArray(this.bitBucketKpiData);
            this.removeLoaderFromKPIs(this.bitBucketKpiData);
          } else {
            this.handleKPIError(postData);
          }
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );
  }

  // post request of BitBucket(scrum)
  postBitBucketKanbanKpi(postData, source): void {
    if (this.bitBucketKpiRequest && this.bitBucketKpiRequest !== '') {
      this.bitBucketKpiRequest.unsubscribe();
    }
    this.bitBucketKpiRequest = this.httpService
      .postKpiKanban(postData, source)
      .subscribe(
        (getData) => {
          this.setupSearchQuerySubscription();
          if (getData !== null && getData[0] !== 'error' && !getData['error']) {
            // creating array into object where key is kpi id
            this.bitBucketKpiData = this.helperService.createKpiWiseId(getData);
            this.fillKPIResponseCode(this.bitBucketKpiData);
            this.createAllKpiArray(this.bitBucketKpiData);
            this.removeLoaderFromKPIs(this.bitBucketKpiData);
          } else {
            this.handleKPIError(postData);
          }
        },
        (error) => {
          // Handle error
          this.handleKPIError(postData);
        },
      );

    this.setupSearchQuerySubscription();
  }

  // post request of Jira(Kanban)
  postJiraKanbanKpi(postData, source): void {
    this.httpService.postKpiKanban(postData, source).subscribe(
      (getData) => {
        this.setupSearchQuerySubscription();
        if (getData !== null && getData[0] !== 'error' && !getData['error']) {
          // creating array into object where key is kpi id
          const localVariable = this.helperService.createKpiWiseId(getData);
          this.fillKPIResponseCode(localVariable);
          const kpi997 = localVariable['kpi997'];
          if (
            kpi997 &&
            kpi997.trendValueList &&
            kpi997.xAxisValues &&
            kpi997.xAxisValues.length === 5
          ) {
            kpi997.trendValueList.forEach((trendElem) => {
              trendElem.value
                .filter((valElem) => valElem.value.length === 5)
                .forEach((valElem, index) => {
                  valElem.value['xAxisTick'] = kpi997.xAxisValues[index];
                });
            });
          }

          this.jiraKpiData = Object.assign({}, this.jiraKpiData, localVariable);
          this.createAllKpiArray(localVariable);
          this.removeLoaderFromKPIs(localVariable);
        } else {
          this.handleKPIError(postData);
        }
      },
      (error) => {
        // Handle error
        this.handleKPIError(postData);
      },
    );
  }

  removeLoaderFromKPIs(data) {
    if (Array.isArray(data)) {
      const kpis = data.map((kpi) => kpi.kpiId);
      kpis.forEach((kpi) => this.kpiLoader.delete(kpi));
    } else {
      for (const kpi in data) {
        this.kpiLoader.delete(kpi);
      }
    }
  }

  // returns colors according to maturity for all
  returnColorAccToMaturity(maturity) {
    return this.helperService.colorAccToMaturity(maturity);
  }
  // return colors according to maturity only for CycleTime
  colorAccToMaturity(maturityValue) {
    const maturityArray = maturityValue.toString().split('-');
    for (let index = 0; index <= 2; index++) {
      const maturity = maturityArray[index];
      this.maturityColorCycleTime[index] =
        this.helperService.colorAccToMaturity(maturity);
    }
  }

  changeView(text) {
    if (text == 'list') {
      this.isChartView = false;
    } else {
      this.isChartView = true;
    }
  }

  sortAlphabetically(objArray) {
    if (objArray && objArray?.length > 1) {
      objArray?.sort((a, b) => a.data?.localeCompare(b.data));
    }
    return objArray;
  }

  getChartData(kpiId, idx, aggregationType, kpiFilterChange = false) {
    const trendValueList = this.allKpiArray[idx]?.trendValueList
      ? JSON.parse(JSON.stringify(this.allKpiArray[idx]?.trendValueList))
      : {};
    this.kpiThresholdObj[kpiId] = this.allKpiArray[idx]?.thresholdValue
      ? this.allKpiArray[idx]?.thresholdValue
      : null;

    // this block populates additional filters on developer dashboard because on developer dashboard, the
    // additional filters depend on KPI response
    const developerBoardKpis = this.globalConfig[
      this.selectedtype?.toLowerCase()
    ]
      ?.filter(
        (item) =>
          item.boardSlug?.toLowerCase() === 'developer' ||
          item.boardName.toLowerCase() === 'developer',
      )[0]
      ?.kpis?.map((x) => x.kpiId);
    if (
      this.selectedTab &&
      this.selectedTab.toLowerCase() === 'developer' &&
      developerBoardKpis?.includes(kpiId)
    ) {
      if (!trendValueList?.length) {
        this.additionalFiltersArr = {};
        this.service.setAdditionalFilters(this.additionalFiltersArr);
      } else if (trendValueList?.length) {
        const filterPropArr = Object.keys(trendValueList[0]).filter((prop) =>
          prop.includes('filter'),
        );
        filterPropArr.forEach((filterProp) => {
          if (!this.additionalFiltersArr[filterProp]?.size) {
            this.additionalFiltersArr[filterProp] = new Set();
          }
          trendValueList
            .map((x) => x[filterProp])
            .forEach((f) => this.additionalFiltersArr[filterProp].add(f));
          this.additionalFiltersArr[filterProp] = Array.from(
            this.additionalFiltersArr[filterProp],
          ).map((item: string) => item);
        });

        if (!kpiFilterChange) {
          Object.keys(this.additionalFiltersArr).forEach((filterProp) => {
            this.additionalFiltersArr[filterProp] = this.additionalFiltersArr[
              filterProp
            ].map((f) => ({
              nodeId: f,
              nodeName: f,
              nodeDisplayName: f,
              labelName:
                filterProp === 'filter1'
                  ? 'branch'
                  : filterProp === 'filter'
                  ? 'branch'
                  : 'developer',
            }));
          });
          this.service.setAdditionalFilters(this.additionalFiltersArr);
        }
      }
    }

    if (trendValueList?.length > 0) {
      const filterPropArr = Object.keys(trendValueList[0])?.filter((prop) =>
        prop.includes('filter'),
      );

      // get backup KPI filters
      this.getBackupKPIFilters(kpiId, filterPropArr);

      if (filterPropArr?.length) {
        if (filterPropArr.includes('filter')) {
          if (
            this.kpiSelectedFilterObj[kpiId] &&
            Object.keys(this.kpiSelectedFilterObj[kpiId])?.length > 1
          ) {
            if (kpiId === 'kpi17') {
              this.kpiChartData[kpiId] = [];
              for (
                let i = 0;
                i < this.kpiSelectedFilterObj[kpiId]?.length;
                i++
              ) {
                const trendList = trendValueList?.filter(
                  (x) => x['filter'] == this.kpiSelectedFilterObj[kpiId][i],
                )[0];
                trendList?.value.forEach((x) => {
                  const obj = {
                    data: this.kpiSelectedFilterObj[kpiId][i],
                    value: x.value,
                  };
                  this.kpiChartData[kpiId].push(obj);
                });
              }
            } else {
              const tempArr = {};
              if (Array.isArray(this.kpiSelectedFilterObj[kpiId])) {
                for (
                  let i = 0;
                  i < this.kpiSelectedFilterObj[kpiId]?.length;
                  i++
                ) {
                  tempArr[this.kpiSelectedFilterObj[kpiId][i]] =
                    trendValueList?.filter(
                      (x) => x['filter'] == this.kpiSelectedFilterObj[kpiId][i],
                    )[0]?.value;
                }
              } else {
                tempArr[this.kpiSelectedFilterObj[kpiId]] =
                  trendValueList?.filter(
                    (x) => x['filter'] == this.kpiSelectedFilterObj[kpiId],
                  )[0]?.value;
              }
              this.kpiChartData[kpiId] =
                this.helperService.applyAggregationLogic(
                  tempArr,
                  aggregationType,
                  this.tooltip.percentile,
                );
            }
          } else {
            if (
              this.kpiSelectedFilterObj[kpiId] &&
              Object.keys(this.kpiSelectedFilterObj[kpiId])?.length > 0
            ) {
              Object.keys(this.kpiSelectedFilterObj[kpiId]).forEach((key) => {
                const selectedVal = this.kpiSelectedFilterObj[kpiId][key];
                if (Array.isArray(selectedVal) && selectedVal.length > 1) {
                  const tempArr = {};
                  selectedVal.forEach((val) => {
                    const matched = trendValueList?.filter(
                      (x) => x['filter'] === val,
                    )[0];
                    if (matched) {
                      tempArr[val] = matched.value;
                    }
                  });
                  this.kpiChartData[kpiId] =
                    this.helperService.applyAggregationLogic(
                      tempArr,
                      aggregationType,
                      this.tooltip.percentile,
                    );
                } else {
                  const valToCompare = Array.isArray(selectedVal)
                    ? selectedVal[0]
                    : selectedVal;
                  this.kpiChartData[kpiId] = trendValueList?.filter(
                    (x) => x['filter'] === valToCompare,
                  )[0]?.value;
                }
              });

              if (
                kpiId == 'kpi17' &&
                this.kpiSelectedFilterObj[kpiId][0]?.toLowerCase() ==
                  'average coverage'
              ) {
                for (let i = 0; i < this.kpiChartData[kpiId]?.length; i++) {
                  this.kpiChartData[kpiId][i]['filter'] =
                    this.kpiSelectedFilterObj[kpiId][0];
                }
              }
            } else {
              this.kpiChartData[kpiId] = trendValueList?.filter(
                (x) => x['filter'] == 'Overall',
              )[0]?.value;
            }
          }
        } else if (
          filterPropArr.includes('filter1') ||
          filterPropArr.includes('filter2')
        ) {
          if (
            filterPropArr.includes('filter1') &&
            filterPropArr.includes('filter2')
          ) {
            let tempArr = [];
            tempArr = this.createCombinations(
              this.kpiSelectedFilterObj[kpiId]['filter1'],
              this.kpiSelectedFilterObj[kpiId]['filter2'],
              kpiId,
            );
            const preAggregatedValues = [];
            for (let i = 0; i < tempArr?.length; i++) {
              preAggregatedValues?.push(
                ...trendValueList?.filter(
                  (k) =>
                    k['filter1'] ==
                      (tempArr[i]?.filter1.length
                        ? tempArr[i]?.filter1
                        : 'Overall') &&
                    k['filter2'] ==
                      (tempArr[i]?.filter2 ? tempArr[i]?.filter2 : 'Overall'),
                ),
              );
            }
            if (preAggregatedValues && preAggregatedValues.length > 1) {
              if (kpiId === 'kpi171') {
                this.kpiChartData[kpiId] =
                  this.helperService.kpiCycleTime193Aggregration(
                    preAggregatedValues,
                  );
              } else {
                const transformFilter = {};
                preAggregatedValues.forEach((obj) => {
                  transformFilter[obj.filter1 + 'and' + obj.filter2] =
                    obj.value;
                });
                this.kpiChartData[kpiId] =
                  this.helperService.applyAggregationLogic(
                    transformFilter,
                    aggregationType,
                    this.tooltip.percentile,
                  );
              }
            } else {
              if (
                kpiId === 'kpi158' ||
                kpiId === 'kpi160' ||
                kpiId === 'kpi185' ||
                kpiId === 'kpi186'
              ) {
                this.kpiChartData[kpiId] = preAggregatedValues[0]?.data
                  ? preAggregatedValues[0]?.data
                  : [];
              } else {
                this.kpiChartData[kpiId] = preAggregatedValues[0]?.value
                  ? preAggregatedValues[0]?.value
                  : [];
              }
            }
          } else if (
            filterPropArr.includes('filter1') ||
            filterPropArr.includes('filter2')
          ) {
            const filters =
              this.kpiSelectedFilterObj[kpiId]?.filter1 ||
              this.kpiSelectedFilterObj[kpiId]?.filter2;
            let preAggregatedValues = [];
            for (let i = 0; i < filters?.length; i++) {
              preAggregatedValues = [
                ...preAggregatedValues,
                ...trendValueList?.filter(
                  (x) =>
                    x['filter1'] == filters[i] || x['filter2'] == filters[i],
                ),
              ];
            }
            this.kpiChartData[kpiId] = [];
            if (preAggregatedValues.length > 1) {
              const transformFilter = {};
              preAggregatedValues.forEach((obj, index) => {
                const key = obj.filter1 || obj.filter2 || index;
                transformFilter[key] = obj.value;
              });
              this.kpiChartData[kpiId] =
                this.helperService.applyAggregationLogic(
                  transformFilter,
                  aggregationType,
                  this.tooltip.percentile,
                );
            } else {
              this.kpiChartData[kpiId] = preAggregatedValues[0]?.value || [];
            }
          } else {
            this.kpiChartData[kpiId] = [];
            if (trendValueList && trendValueList?.length > 0) {
              this.kpiChartData[kpiId]?.push(
                trendValueList?.filter((x) => x['filter'] == 'Overall')[0],
              );
            } else if (trendValueList?.length > 0) {
              this.kpiChartData[kpiId] = [...trendValueList];
            } else {
              this.kpiChartData[kpiId]?.push(trendValueList);
            }
          }
        }
      }
      // when there are no KPI Level Filters
      else if (trendValueList?.length > 0 && !filterPropArr?.length) {
        this.kpiChartData[kpiId] = [...this.sortAlphabetically(trendValueList)];
      } else {
        this.kpiChartData[kpiId] = [];
      }
    } else {
      this.kpiChartData[kpiId] = [];
    }

    if (this.colorObj && Object.keys(this.colorObj)?.length > 0) {
      if (
        this.getChartType(kpiId) !== 'progressbar' &&
        this.getChartType(kpiId) !== 'card'
      ) {
        this.kpiChartData[kpiId] = this.generateColorObj(
          kpiId,
          this.kpiChartData[kpiId],
        );
      }
    }

    // For kpi3 and kpi53 generating table column headers and table data
    if (kpiId === 'kpi3' || kpiId === 'kpi53') {
      //generating column headers
      const columnHeaders = [];
      const kpiSelectedFilter =
        this.kpiSelectedFilterObj[kpiId] &&
        this.kpiSelectedFilterObj[kpiId]['filter1']
          ? this.kpiSelectedFilterObj[kpiId]['filter1']
          : this.kpiSelectedFilterObj[kpiId];
      if (
        Object.keys(this.kpiSelectedFilterObj)?.length &&
        kpiSelectedFilter?.length &&
        kpiSelectedFilter[0]
      ) {
        columnHeaders.push({
          field: 'name',
          header:
            this.hierarchyLevel[+this.filterApplyData.level - 1]
              ?.hierarchyLevelName + ' Name',
        });
        columnHeaders.push({ field: 'value', header: kpiSelectedFilter[0] });
        columnHeaders.push({ field: 'maturity', header: 'Maturity' });
      }
      if (this.kpiChartData[kpiId]) {
        this.kpiChartData[kpiId].columnHeaders = columnHeaders;
      }
      //generating Table data
      const kpiUnit = this.updatedConfigGlobalData?.find(
        (kpi) => kpi.kpiId === kpiId,
      )?.kpiDetail?.kpiUnit;
      const data = [];
      if (this.kpiChartData[kpiId] && this.kpiChartData[kpiId].length) {
        for (const element of this.kpiChartData[kpiId]) {
          const rowData = {
            name: element.data,
            maturity: 'M' + element.maturity,
            value: element.value[0].data + ' ' + kpiUnit,
          };
          data.push(rowData);
        }
      }
      this.kpiChartData[kpiId].data = data;
      this.showKpiTrendIndicator[kpiId] = false;
    }

    if (kpiId === 'kpi171') {
      this.kpiChartData[kpiId] = this.transformJSONForSQVTable(
        this.kpiChartData[kpiId],
      );
    }

    if (kpiId === 'kpi195') {
      this.defectsBreachedSLAsAllValues = this.allKpiArray[idx]?.trendValueList
        ? JSON.parse(JSON.stringify(this.allKpiArray[idx]?.trendValueList))
        : {};
      this.defectsBreachedSLAs = this.kpiChartData[kpiId];
    }
    if (
      Array.isArray(this.kpiChartData[kpiId]) &&
      this.kpiChartData[kpiId].some((d: any) => d?.forecasts)
    ) {
      this.applyForecastData(this.kpiChartData[kpiId]);
    }

    if (
      Array.isArray(this.kpiChartData[kpiId]) &&
      this.service.getSelectedTrends()?.length > 1
    ) {
      this.kpiChartData[kpiId] = this.helperService.alignSprintDataRightToLeft(
        this.kpiChartData[kpiId],
      );
    }

    this.createTrendsData(kpiId);
    this.handleMaturityTableLoader();
  }

  applyForecastData(chartSeries): void {
    chartSeries?.forEach((series) => {
      const forecastEntries = series?.forecasts;
      const forecastPoint = forecastEntries[0];
      const numericValue = Number(
        forecastPoint?.value ?? forecastPoint?.data ?? 0,
      );
      const lastActualPoint =
        series.value?.length > 0 ? series.value[series?.value?.length - 1] : {};
      const forecastLabel =
        forecastPoint?.date ||
        forecastPoint?.sortSprint ||
        forecastPoint?.sSprintName ||
        'Forecast';
      const mergeRequestKeys = [
        'No. of Merge Requests',
        'No. of Merge Request',
      ];
      const rawValue =
        forecastPoint?.lineValue ??
        mergeRequestKeys
          .map((k) => forecastPoint?.hoverValue?.[k])
          .find((v) => v !== undefined);

      const normalizedLineValue = Number.isFinite(Number(rawValue))
        ? Number(rawValue)
        : null;
      const newPoint = {
        ...lastActualPoint,
        ...forecastPoint,
        data: forecastPoint.data ?? numericValue.toString(),
        value: numericValue,
        lineValue: normalizedLineValue,
        sprojectName:
          forecastPoint?.sprojectName ||
          lastActualPoint?.sprojectName ||
          series?.data,
        isForecast: true,
      };
      newPoint['date'] = forecastPoint?.date || forecastLabel;
      newPoint['sortSprint'] = forecastPoint?.sortSprint || forecastLabel;
      newPoint['xAxisTick'] = forecastLabel;
      newPoint['xName'] = forecastLabel;
      newPoint['sSprintName'] = forecastLabel;
      newPoint['sprintNames'] = [forecastLabel];
      newPoint['xOrder'] = forecastLabel;
      series.value = [...series?.value, newPoint];
    });
  }

  getBackupKPIFilters(kpiId, filterPropArr) {
    const filterType = this.updatedConfigGlobalData
      .find((kpi) => kpi?.kpiId === kpiId)
      ?.kpiDetail?.kpiFilter?.toLowerCase();
    if (
      kpiId !== 'kpi171' &&
      Object.keys(this.service.getKpiSubFilterObj()).includes(kpiId)
    ) {
      this.kpiSelectedFilterObj[kpiId] =
        this.service.getKpiSubFilterObj()[kpiId];
    } else if (
      kpiId === 'kpi171' &&
      Object.keys(this.service.getKpiSubFilterObj()).includes(kpiId)
    ) {
      this.kpiSelectedFilterObj[kpiId] =
        this.service.getKpiSubFilterObj()[kpiId];
      this.durationFilter = JSON.parse(
        JSON.stringify(this.kpiSelectedFilterObj[kpiId].filter1),
      );
      this.service.getKpiSubFilterObj()['durationFilter'] = this.durationFilter;
    } else {
      this.getDefaultKPIFilters(kpiId, filterPropArr, filterType);
    }
    this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);
  }

  getDefaultKPIFilters(kpiId, filterPropArr, filterType) {
    if (
      this.kpiDropdowns[kpiId]?.length &&
      this.kpiDropdowns[kpiId][0]['options'] &&
      this.kpiDropdowns[kpiId][0]['options'].length
    ) {
      if (filterPropArr.includes('filter')) {
        if (filterType && filterType !== 'multiselectdropdown') {
          this.kpiSelectedFilterObj[kpiId] = [
            this.kpiDropdowns[kpiId][0]['options'][0],
          ];
        } else if (!filterType) {
          this.kpiSelectedFilterObj[kpiId] = [
            this.kpiDropdowns[kpiId][0]['options'][0],
          ];
        } else {
          this.kpiSelectedFilterObj[kpiId] = [];
        }
      } else if (
        filterPropArr.includes('filter1') &&
        filterPropArr.includes('filter2')
      ) {
        if (this.kpiDropdowns[kpiId]?.length > 1) {
          this.kpiSelectedFilterObj[kpiId] = {};
          for (let i = 0; i < this.kpiDropdowns[kpiId].length; i++) {
            if (filterType?.toLowerCase() === 'multitypefilters') {
              if (
                this.kpiDropdowns[kpiId][i].filterType.toLowerCase() ===
                'radiobtn'
              ) {
                this.kpiSelectedFilterObj[kpiId]['filter' + (i + 1)] = [
                  this.kpiDropdowns[kpiId][i].options[0],
                ];
              } else {
                this.kpiSelectedFilterObj[kpiId]['filter' + (i + 1)] = [];
              }
            } else {
              if (kpiId === 'kpi171') {
                this.kpiSelectedFilterObj[kpiId] = {
                  filter1: ['Past 6 Months'],
                  filter2: null,
                };
                this.durationFilter = 'Past 6 Months';
                this.kpiSelectedFilterObj['durationFilter'] =
                  this.durationFilter;
              } else {
                this.kpiSelectedFilterObj[kpiId]['filter' + (i + 1)] = [
                  this.kpiDropdowns[kpiId][i].options[0],
                ];
              }
            }
          }
        }
      } else {
        this.kpiSelectedFilterObj[kpiId] = {};
        this.kpiSelectedFilterObj[kpiId]['filter1'] = [
          this.kpiDropdowns[kpiId][0]['options'][0],
        ];
      }
    }
  }

  getBackupKPIFiltersForRelease(kpiId, filterPropArr) {
    const filterType = this.updatedConfigGlobalData
      .find((kpi) => kpi?.kpiId === kpiId)
      ?.kpiDetail?.kpiFilter?.toLowerCase();
    if (Object.keys(this.service.getKpiSubFilterObj()).includes(kpiId)) {
      this.kpiSelectedFilterObj[kpiId] =
        this.service.getKpiSubFilterObj()[kpiId];
    } else {
      this.getDefaultKPIFiltersForRelease(kpiId, filterPropArr, filterType);
    }
    this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);
  }

  /**
   * Sets the default KPI filters based on the provided KPI ID, filter properties, and filter type.
   * It populates the kpiSelectedFilterObj with default options from kpiDropdowns.
   *
   * @param kpiId - The ID of the KPI for which to set filters.
   * @param filterPropArr - An array of filter property names to determine filter behavior.
   * @param [filterType] - The type of filter to apply (optional).
   * @returns
   */
  getDefaultKPIFiltersForRelease(kpiId, filterPropArr, filterType) {
    if (
      this.kpiDropdowns[kpiId]?.length &&
      this.kpiDropdowns[kpiId][0]['options'] &&
      this.kpiDropdowns[kpiId][0]['options'].length
    ) {
      if (filterPropArr.includes('filter')) {
        if (filterType && filterType !== 'multiselectdropdown') {
          this.kpiSelectedFilterObj[kpiId] = [
            this.kpiDropdowns[kpiId][0]['options'][0],
          ];
        } else if (!filterType) {
          this.kpiSelectedFilterObj[kpiId] = [
            this.kpiDropdowns[kpiId][0]['options'][0],
          ];
        } else {
          this.kpiSelectedFilterObj[kpiId] = [];
        }
      } else if (
        filterPropArr.includes('filter1') &&
        filterPropArr.includes('filter2')
      ) {
        if (this.kpiDropdowns[kpiId]?.length > 1) {
          this.kpiSelectedFilterObj[kpiId] = {};
          for (let i = 0; i < this.kpiDropdowns[kpiId].length; i++) {
            this.kpiSelectedFilterObj[kpiId]['filter' + (i + 1)] = [
              this.kpiDropdowns[kpiId][i].options[0],
            ];
          }
        }
      } else {
        this.kpiSelectedFilterObj[kpiId] = {};
        this.kpiSelectedFilterObj[kpiId]['filter1'] = [
          this.kpiDropdowns[kpiId][0]['options'][0],
        ];
      }
    }
  }

  getBackupKPIFiltersForBacklog(kpiId) {
    const trendValueList =
      this.allKpiArray[this.ifKpiExist(kpiId)]?.trendValueList;
    const filters = this.allKpiArray[this.ifKpiExist(kpiId)]?.filters;
    const filterType = this.updatedConfigGlobalData
      .find((kpi) => kpi?.kpiId === kpiId)
      ?.kpiDetail?.kpiFilter?.toLowerCase();

    if (Object.keys(this.service.getKpiSubFilterObj()).includes(kpiId)) {
      this.kpiSelectedFilterObj[kpiId] =
        this.service.getKpiSubFilterObj()[kpiId];
    } else {
      this.getDefaultKPIFiltersForBacklog(
        kpiId,
        trendValueList,
        filters,
        filterType,
      );
    }
    this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);
  }

  getDefaultKPIFiltersForBacklog(kpiId, trendValueList, filters, filterType) {
    if (filters && Object.keys(filters).length !== 0) {
      if (this.kpiDropdowns[kpiId][0]['options']?.length) {
        if (
          (filterType && filterType !== 'multiselectdropdown') ||
          !filterType
        ) {
          this.kpiSelectedFilterObj[kpiId] = [
            this.kpiDropdowns[kpiId][0]['options'][0],
          ];
        } else if (filterType === 'multiselectdropdown') {
          // Initialize multiselect dropdown with first option in an array wrapped in filter1
          this.kpiSelectedFilterObj[kpiId] = {
            filter1: [this.kpiDropdowns[kpiId][0]['options'][0]],
          };
        }
      }
    } else if (
      trendValueList?.length > 0 &&
      trendValueList[0]?.hasOwnProperty('filter')
    ) {
      this.kpiSelectedFilterObj[kpiId] = { filter1: ['Overall'] };
    }

    if (
      trendValueList?.length > 0 &&
      trendValueList[0]?.hasOwnProperty('filter1')
    ) {
      this.kpiSelectedFilterObj[kpiId] = {};
      for (let i = 0; i < this.kpiDropdowns[kpiId].length; i++) {
        this.kpiSelectedFilterObj[kpiId]['filter' + (i + 1)] = [
          this.kpiDropdowns[kpiId][i].options[0],
        ];
      }
    }
  }

  getChartDataForBacklog(kpiId, idx, aggregationType) {
    const trendValueList = this.allKpiArray[idx]?.trendValueList;
    this.kpiThresholdObj[kpiId] = this.allKpiArray[idx]?.thresholdValue
      ? this.allKpiArray[idx]?.thresholdValue
      : null;

    if (trendValueList?.length) {
      // get backup KPI filters
      this.getBackupKPIFiltersForBacklog(kpiId);
    }

    if (
      trendValueList?.length > 0 &&
      trendValueList[0]?.hasOwnProperty('filter')
    ) {
      if (
        this.kpiSelectedFilterObj[kpiId] &&
        Object.keys(this.kpiSelectedFilterObj[kpiId])?.length > 0
      ) {
        const selectedVal = Array.isArray(this.kpiSelectedFilterObj[kpiId])
          ? this.kpiSelectedFilterObj[kpiId]
          : Object.values(this.kpiSelectedFilterObj[kpiId])[0];

        if (Array.isArray(selectedVal) && selectedVal.length > 1) {
          if (kpiId === 'kpi138') {
            // For KPI 138, we want separate items for each selected filter, not aggregation
            this.kpiChartData[kpiId] = trendValueList?.filter((x) =>
              selectedVal.includes(x['filter']),
            );
          } else {
            const tempArr = {};
            selectedVal.forEach((val) => {
              const matched = trendValueList?.filter(
                (x) => x['filter'] === val,
              )[0];
              if (matched) {
                tempArr[val] = matched.value;
              }
            });
            if (this.getChartType(kpiId) === 'progress-bar') {
              this.kpiChartData[kpiId] =
                this.applyAggregationLogicForProgressBar(tempArr);
            } else {
              this.kpiChartData[kpiId] =
                this.helperService.applyAggregationLogic(
                  tempArr,
                  aggregationType,
                  this.tooltip.percentile,
                );
            }
          }
        } else {
          const valToCompare = Array.isArray(selectedVal)
            ? selectedVal[0]
            : selectedVal;
          if (kpiId === 'kpi138') {
            this.kpiChartData[kpiId] = trendValueList?.filter(
              (x) => x['filter'] === valToCompare,
            );
          } else {
            this.kpiChartData[kpiId] = trendValueList?.filter(
              (x) => x['filter'] === valToCompare,
            )[0]?.value;
          }
        }
      } else {
        if (kpiId === 'kpi138') {
          this.kpiChartData[kpiId] = trendValueList?.filter(
            (x) => x['filter'] === 'Overall',
          );
        } else {
          this.kpiChartData[kpiId] = trendValueList?.filter(
            (x) => x['filter'] === 'Overall',
          )[0]?.value;
        }
      }
    } else if (
      this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') ||
      this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2')
    ) {
      const filters =
        this.kpiSelectedFilterObj[kpiId]['filter1'] ||
        this.kpiSelectedFilterObj[kpiId]['filter2'];
      const filter2 = this.kpiSelectedFilterObj[kpiId]['filter2'];
      let preAggregatedValues = [];
      for (let i = 0; i < filters?.length; i++) {
        if (
          this.kpiSelectedFilterObj[kpiId] &&
          Object.keys(this.kpiSelectedFilterObj[kpiId]).length === 1
        ) {
          preAggregatedValues = [
            ...preAggregatedValues,
            ...(trendValueList && trendValueList['value']
              ? trendValueList['value']
              : trendValueList
            )?.filter(
              (x) => x['filter1'] == filters[i] || x['filter2'] == filters[i],
            ),
          ];
        } else {
          preAggregatedValues = [
            ...preAggregatedValues,
            ...(trendValueList && trendValueList['value']
              ? trendValueList['value']
              : trendValueList
            )?.filter(
              (x) => x['filter1'] == filters[i] && x['filter2'] == filter2[i],
            ),
          ];
        }
      }
      this.kpiChartData[kpiId] = preAggregatedValues[0]?.value;
    } else {
      if (trendValueList?.length > 0) {
        this.kpiChartData[kpiId] = [
          ...this.helperService.sortAlphabetically(trendValueList),
        ];
      } else if (trendValueList?.hasOwnProperty('value')) {
        this.kpiChartData[kpiId] = [...trendValueList?.value];
      } else {
        this.kpiChartData[kpiId] = [];
      }
    }

    if (
      this.colorObj &&
      Object.keys(this.colorObj)?.length > 0 &&
      !['kpi161', 'kpi146', 'kpi148', 'kpi169'].includes(kpiId)
    ) {
      this.kpiChartData[kpiId] = this.generateColorObj(
        kpiId,
        this.kpiChartData[kpiId],
      );
    }

    // this.createTrendData(kpiId);
    if (kpiId !== 'kpi151' && kpiId !== 'kpi152' && kpiId !== 'kpi155') {
      this.createTrendsData(kpiId);
    }
    this.updatedConfigGlobalData.forEach((kpi) => {
      if (kpi.kpiId == kpiId) {
        this.showKpiTrendIndicator[kpiId] = kpiId === 'kpi3' ? true : false;
      }
    });
    const chartType = this.getChartType(kpiId);
    const isLineChart = chartType === 'line';
    const chartSeries = this.kpiChartData[kpiId];

    if (isLineChart && Array.isArray(chartSeries)) {
      if (chartSeries.some((d: any) => d?.forecasts)) {
        this.applyForecastData(chartSeries);
      }
    }

    // Right-align sprint data when multiple projects have different sprint counts
    if (
      Array.isArray(this.kpiChartData[kpiId]) &&
      this.service.getSelectedTrends()?.length > 1
    ) {
      this.kpiChartData[kpiId] = this.helperService.alignSprintDataRightToLeft(
        this.kpiChartData[kpiId],
      );
    }
  }

  getChartType(kpiId) {
    return this.updatedConfigGlobalData.find((kpi) => kpi?.kpiId === kpiId)
      ?.kpiDetail?.chartType;
  }

  applyAggregationLogicForProgressBar(obj) {
    let maxValue = 0;
    let value = 0;
    for (const key in obj) {
      const currentObj = obj[key][0]?.value[0]?.hoverValue;
      if (!currentObj) {
        continue;
      }
      Object.keys(currentObj).forEach((prop) => {
        if (prop?.toLowerCase()?.includes('total')) {
          maxValue += currentObj[prop];
        } else {
          value += currentObj[prop];
        }
      });
    }
    const kpiChartData = obj[Object.keys(obj)[0]];
    kpiChartData[0].value[0].maxValue = maxValue;
    kpiChartData[0].value[0].value = value;
    return kpiChartData;
  }

  /*   createTrendData(kpiId) {
      const kpiDetail = this.configGlobalData.find(details => details.kpiId == kpiId)
      const trendingList = this.kpiChartData[kpiId];
      if (trendingList?.length) {
        this.kpiTrendObject[kpiId] = [];
        if (trendingList[0]?.value?.length > 0 && kpiDetail) {
          let trendObj = {};
          const [latest, trend, unit] = this.checkLatestAndTrendValue(kpiDetail, trendingList[0]);
          trendObj = {
            "hierarchyName": trendingList[0]?.data,
            "trend": trend,
            "maturity": 'M' + trendingList[0]?.maturity,
            "maturityValue": trendingList[0]?.maturityValue,
            "maturityDenominator": trendingList[0]?.value.length,
            "kpiUnit": unit
          };
          this.kpiTrendObject[kpiId]?.push(trendObj);
        }
      }

    } */

  getChartDataforRelease(
    kpiId,
    idx,
    aggregationType?,
    kpiFilterChange = false,
  ) {
    const trendValueList = this.allKpiArray[idx]?.trendValueList
      ? JSON.parse(JSON.stringify(this.allKpiArray[idx]?.trendValueList))
      : {};
    this.kpiThresholdObj[kpiId] = this.allKpiArray[idx]?.thresholdValue
      ? this.allKpiArray[idx]?.thresholdValue
      : null;

    if (trendValueList?.length > 0) {
      const filterPropArr = Object.keys(trendValueList[0])?.filter((prop) =>
        prop.includes('filter'),
      );

      // get backup KPI filters
      // this.getBackupKPIFiltersForRelease(kpiId, filterPropArr);
      this.getBackupKPIFilters(kpiId, filterPropArr);
    }

    if (kpiId === 'kpi178') {
      this.kpiChartData[kpiId] = [];
      this.kpiChartData[kpiId].push({
        data: this.allKpiArray[idx]?.issueData,
        filters: this.allKpiArray[idx]?.filterGroup,
        modalHeads: this.allKpiArray[idx]?.modalHeads,
      });
    } else {
      /**if trendValueList is an object */
      if (
        trendValueList &&
        Object.keys(trendValueList)?.length > 0 &&
        !Array.isArray(trendValueList)
      ) {
        if (
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') &&
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2')
        ) {
          let tempArr = [];
          const preAggregatedValues = [];
          /** tempArr: array with combination of all items of filter1 and filter2 */
          tempArr = this.helperService.createCombinations(
            this.kpiSelectedFilterObj[kpiId]['filter1'],
            this.kpiSelectedFilterObj[kpiId]['filter2'],
          );
          for (let i = 0; i < tempArr?.length; i++) {
            preAggregatedValues?.push(
              ...trendValueList['value']?.filter(
                (k) =>
                  k['filter1'] == tempArr[i]?.filter1 &&
                  k['filter2'] == tempArr[i]?.filter2,
              ),
            );
          }
          if (preAggregatedValues?.length > 1) {
            this.kpiChartData[kpiId] =
              this.applyAggregationLogic(preAggregatedValues);
          } else {
            this.kpiChartData[kpiId] = [...preAggregatedValues];
          }
        } else if (
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') ||
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2')
        ) {
          const filters =
            this.kpiSelectedFilterObj[kpiId]['filter1'] ||
            this.kpiSelectedFilterObj[kpiId]['filter2'];
          let preAggregatedValues = [];
          for (let i = 0; i < filters?.length; i++) {
            preAggregatedValues = [
              ...preAggregatedValues,
              ...(trendValueList['value']
                ? trendValueList['value']
                : trendValueList
              )?.filter(
                (x) => x['filter1'] == filters[i] || x['filter2'] == filters[i],
              ),
            ];
          }
          if (preAggregatedValues?.length > 1) {
            this.kpiChartData[kpiId] =
              this.applyAggregationLogic(preAggregatedValues);
          } else {
            this.kpiChartData[kpiId] = [...preAggregatedValues];
          }
        } else {
          /** when there are no kpi level filters */
          this.kpiChartData[kpiId] = [];
          if (
            trendValueList &&
            trendValueList?.hasOwnProperty('value') &&
            trendValueList['value']?.length > 0
          ) {
            this.kpiChartData[kpiId]?.push(
              trendValueList['value']?.filter(
                (x) => x['filter1'] == 'Overall',
              )[0],
            );
          } else if (trendValueList?.length > 0) {
            this.kpiChartData[kpiId] = [...trendValueList];
          } else {
            const obj = JSON.parse(JSON.stringify(trendValueList));
            this.kpiChartData[kpiId]?.push(obj);
          }
        }
      } else if (
        /**if trendValueList is an array */
        trendValueList?.length > 0 &&
        trendValueList[0]?.hasOwnProperty('filter1')
      ) {
        if (
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') &&
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2')
        ) {
          let tempArr = [];
          const preAggregatedValues = [];
          /** tempArr: array with combination of all items of filter1 and filter2 */
          tempArr = this.helperService.createCombinations(
            this.kpiSelectedFilterObj[kpiId]['filter1'],
            this.kpiSelectedFilterObj[kpiId]['filter2'],
          );
          for (let i = 0; i < tempArr?.length; i++) {
            preAggregatedValues?.push(
              ...trendValueList?.filter(
                (k) =>
                  k['filter1'] == tempArr[i]?.filter1 &&
                  k['filter2'] == tempArr[i]?.filter2,
              ),
            );
          }
          if (preAggregatedValues?.length > 1) {
            this.kpiChartData[kpiId] =
              this.applyAggregationLogic(preAggregatedValues);
          } else {
            this.kpiChartData[kpiId] = [...preAggregatedValues];
          }
        } else if (
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') ||
          this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2')
        ) {
          let filters =
            this.kpiSelectedFilterObj[kpiId]['filter1'] ||
            this.kpiSelectedFilterObj[kpiId]['filter2'];
          let preAggregatedValues = [];
          // for single select dropdown filters
          if (!Array.isArray(filters)) {
            filters = [filters];
          }
          for (let i = 0; i < filters?.length; i++) {
            preAggregatedValues = [
              ...preAggregatedValues,
              ...trendValueList?.filter(
                (x) => x['filter1'] == filters[i] || x['filter2'] == filters[i],
              ),
            ];
          }
          if (preAggregatedValues?.length > 1) {
            this.kpiChartData[kpiId] =
              this.applyAggregationLogic(preAggregatedValues);
          } else {
            if (preAggregatedValues[0]?.hasOwnProperty('value')) {
              this.kpiChartData[kpiId] = preAggregatedValues[0]?.value;
            } else {
              this.kpiChartData[kpiId] = [...preAggregatedValues];
            }
          }
        } else {
          this.kpiChartData[kpiId] = trendValueList.filter(
            (kpiData) => kpiData.filter1 === 'Overall',
          );
        }
      } else if (trendValueList?.length > 0) {
        this.kpiChartData[kpiId] = [...trendValueList[0]?.value];
      } else {
        /** when there are no kpi level filters */
        this.kpiChartData[kpiId] = [];
        if (
          trendValueList &&
          trendValueList?.hasOwnProperty('value') &&
          trendValueList['value']?.length > 0
        ) {
          this.kpiChartData[kpiId]?.push(
            trendValueList['value']?.filter(
              (x) => x['filter1'] == 'Overall',
            )[0],
          );
        } else if (trendValueList?.length > 0) {
          this.kpiChartData[kpiId] = [...trendValueList];
        } else {
          const obj = JSON.parse(JSON.stringify(trendValueList));
          this.kpiChartData[kpiId]?.push(obj);
        }
      }
    }

    // Right-align sprint data when multiple projects have different sprint counts
    if (
      Array.isArray(this.kpiChartData[kpiId]) &&
      this.service.getSelectedTrends()?.length > 1
    ) {
      this.kpiChartData[kpiId] = this.helperService.alignSprintDataRightToLeft(
        this.kpiChartData[kpiId],
      );
    }
  }
  /**To create KPI table headings */
  createKpiTableHeads(selectedType) {
    this.kpiTableHeadingArr = [];
    if (selectedType == 'kanban') {
      this.noOfDataPoints = this.filterApplyData['ids']?.[0];
    }
    if (this.noOfDataPoints) {
      this.kpiTableHeadingArr?.push({ field: 'kpiName', header: 'Kpi Name' });
      this.kpiTableHeadingArr?.push({
        field: 'frequency',
        header: 'Frequency',
      });
      for (let i = 0; i < this.noOfDataPoints; i++) {
        this.kpiTableHeadingArr?.push({ field: i + 1, header: i + 1 });
      }
      this.kpiTableHeadingArr?.push({ field: 'trend', header: 'Trend' });
      this.kpiTableHeadingArr?.push({ field: 'maturity', header: 'Maturity' });
    }
  }

  /** to prepare table data */
  getTableData(kpiId, idx, enabledKpi) {
    let trendValueList = [];
    if (idx >= 0) {
      trendValueList = this.allKpiArray[idx]?.trendValueList;
    } else {
      trendValueList = this.allKpiArray?.filter((x) => x[kpiId] == kpiId)[0]
        ?.trendValueList;
    }
    if (trendValueList?.length > 0) {
      let selectedIdx = -1;
      let iterativeEle = JSON.parse(JSON.stringify(trendValueList));
      const trendVals =
        trendValueList[0]?.hasOwnProperty('filter') ||
        trendValueList[0]?.hasOwnProperty('filter1');
      if (trendVals) {
        if (kpiId == 'kpi17') {
          selectedIdx = trendValueList?.findIndex(
            (x) => x['filter']?.toLowerCase() == 'average coverage',
          );
        } else if (kpiId == 'kpi72') {
          selectedIdx = trendValueList?.findIndex(
            (x) =>
              x['filter1']?.toLowerCase() ==
                'initial commitment (story points)' &&
              x['filter2']?.toLowerCase() == 'overall',
          );
        } else {
          selectedIdx = trendValueList?.findIndex(
            (x) => x['filter']?.toLowerCase() == 'overall',
          );
          if (selectedIdx < 0) {
            selectedIdx = 0;
          }
        }
        if (selectedIdx != -1 && trendValueList[selectedIdx]?.value) {
          iterativeEle = JSON.parse(
            JSON.stringify(trendValueList[selectedIdx]?.value),
          );
        }
      }
      const filtersApplied = [];

      for (const key in this.colorObj) {
        filtersApplied.push(this.colorObj[key].nodeId);
      }

      filtersApplied.forEach((hierarchyId) => {
        const obj = {
          kpiId,
          kpiName: this.allKpiArray[idx]?.kpiName,
          frequency: enabledKpi?.kpiDetail?.xaxisLabel,
          show: enabledKpi?.isEnabled && enabledKpi?.shown,
          hoverText: [],
          order: enabledKpi?.order,
        };
        const chosenItem = iterativeEle?.filter(
          (item) => item['data'] == this.colorObj[hierarchyId]?.nodeDisplayName,
        )[0];

        const trendData = this.kpiTrendsObj[kpiId]?.filter(
          (x) => x['hierarchyId']?.toLowerCase() == hierarchyId?.toLowerCase(),
        )[0];
        obj['latest'] = trendData?.value || '-';
        obj['trend'] = trendData?.trend || '-';
        obj['maturity'] = trendData?.maturity || '-';
        for (let i = 0; i < this.noOfDataPoints; i++) {
          const item = chosenItem?.value[i];
          const trendDataKpiUnit = trendData?.kpiUnit
            ? ' ' + trendData?.kpiUnit
            : '';
          if (item) {
            obj['hoverText']?.push(
              i +
                1 +
                ' - ' +
                this.utcToLocalUser(
                  item?.['sprintNames']?.length > 0
                    ? item['sprintNames'].join(',')
                    : item?.['sSprintName']
                    ? item['sSprintName']
                    : item?.['date'],
                  obj['frequency'],
                ),
            );
            const val = item?.lineValue >= 0 ? item?.lineValue : item?.value;
            obj[i + 1] =
              val > 0
                ? Math.round(val * 10) / 10 + trendDataKpiUnit
                : val + trendDataKpiUnit || '-';
            if (kpiId === 'kpi153') {
              obj[i + 1] =
                item?.dataValue.find(
                  (pdata) => pdata['name'] === 'Achieved Value',
                ).value || '-';
            }
          } else {
            obj[i + 1] = '-';
          }
        }
        const kpiIndex = this.kpiTableDataObj[hierarchyId]?.findIndex(
          (x) => x.kpiId == kpiId,
        );
        if (kpiIndex > -1) {
          this.kpiTableDataObj[hierarchyId]?.splice(kpiIndex, 1);
        }
        if (
          enabledKpi?.isEnabled &&
          enabledKpi?.shown &&
          this.kpiTableDataObj[hierarchyId]
        ) {
          this.kpiTableDataObj[hierarchyId] = [
            ...this.kpiTableDataObj[hierarchyId],
            obj,
          ];
        }
        this.sortingRowsInTable(hierarchyId);
      });
    } else {
      /** when no data available */
      if (this.allKpiArray[idx]?.kpiName) {
        const obj = {
          kpiId,
          kpiName: this.allKpiArray[idx]?.kpiName,
          frequency: enabledKpi?.kpiDetail?.xaxisLabel,
          show: enabledKpi?.isEnabled && enabledKpi?.shown,
          hoverText: [],
          order: enabledKpi?.order,
        };
        for (let i = 0; i < this.noOfDataPoints; i++) {
          obj[i + 1] = '-';
        }
        obj['latest'] = '-';
        obj['trend'] = '-';
        obj['maturity'] = '-';
        for (const hierarchyName in this.kpiTableDataObj) {
          if (enabledKpi?.isEnabled && enabledKpi?.shown) {
            const kpiIndex = this.kpiTableDataObj[hierarchyName]?.findIndex(
              (x) => x.kpiId == kpiId,
            );
            if (kpiIndex > -1) {
              this.kpiTableDataObj[hierarchyName]?.splice(kpiIndex, 1);
            }
            this.kpiTableDataObj[hierarchyName]?.push(obj);
            this.sortingRowsInTable(hierarchyName);
          }
        }
      }
    }
    if (!this.maturityTableKpiList.includes(kpiId)) {
      this.maturityTableKpiList.push(kpiId);
    }
  }
  sortingRowsInTable(hierarchyName) {
    this.kpiTableDataObj[hierarchyName]?.sort((a, b) => a.order - b.order);
  }

  createCombinations(arr1, arr2, kpiId) {
    const arr = [];
    if (arr1?.length > 0) {
      for (let i = 0; i < arr1?.length; i++) {
        for (let j = 0; j < arr2?.length; j++) {
          if (kpiId === 'kpi171') {
            arr.push({ filter1: [arr1[i]], filter2: [arr2[j]] });
          } else {
            arr.push({ filter1: arr1[i], filter2: arr2[j] });
          }
        }
      }
    } else {
      /** Handled for Multi Type Dropdown */
      return [
        {
          filter1: ['Overall'],
          filter2: arr2?.length > 0 ? arr2 : ['Overall'],
        },
      ];
    }

    if (kpiId === 'kpi171' && (arr2 == null || arr2.length === 0)) {
      return [
        {
          filter1: arr1,
          filter2: null,
        },
      ];
    }

    return arr;
  }

  ifKpiExist(kpiId) {
    const id = this.allKpiArray?.findIndex((kpi) => kpi.kpiId == kpiId);
    return id;
  }

  createAllKpiArray(data) {
    for (const key in data) {
      console.log('data key', data[key]);
      if (data[key]?.kpiId === 'kpi202') {
        const kpi202DuplicateData = JSON.parse(JSON.stringify(data[key]));
        kpi202DuplicateData.kpiId = 'kpi202_duplicate';
        data['kpi202_duplicate'] = kpi202DuplicateData;
      }
      // kpi202_duplicate chart data is computed separately — skip normal processing
      if (data[key]?.kpiId === 'kpi202_duplicate') {
        continue;
      }
      /** Creating recomm data */
      const kpiId = data[key]?.kpiId || key;
      this.kpiRecommData[kpiId] = data[key]?.recommendationActionPlan || {};
      const idx = this.ifKpiExist(data[key]?.kpiId);
      if (idx !== -1) {
        this.allKpiArray.splice(idx, 1);
      }
      this.allKpiArray.push(data[key]);
      const trendValueList =
        this.allKpiArray[this.allKpiArray?.length - 1]?.trendValueList;
      const filters = this.allKpiArray[this.allKpiArray?.length - 1]?.filters;
      if (
        trendValueList &&
        !Array.isArray(trendValueList) &&
        Object.keys(trendValueList)?.length > 0 &&
        filters &&
        Object.keys(filters)?.length > 0
      ) {
        this.getDropdownArray(data[key]?.kpiId);
        // this.setFilterValueIfAlreadyHaveBackup(data[key]?.kpiId, {}, ['Overall'], filters)
      } else if (
        trendValueList?.length > 0 &&
        (trendValueList[0]?.hasOwnProperty('filter') ||
          trendValueList[0]?.hasOwnProperty('filter1'))
      ) {
        this.populateKPIFilters(data, key);
      } else if (!trendValueList || trendValueList?.length == 0) {
        this.getDropdownArray(data[key]?.kpiId);
      }
      const agType = this.updatedConfigGlobalData?.filter(
        (x) => x.kpiId == data[key]?.kpiId,
      )[0]?.kpiDetail?.aggregationCriteria;

      if (
        this.selectedTab.toLowerCase() !== 'release' &&
        this.selectedTab.toLowerCase() !== 'backlog'
      ) {
        this.getChartData(
          data[key]?.kpiId,
          this.allKpiArray?.length - 1,
          agType,
        );
      } else if (this.selectedTab.toLowerCase() === 'release') {
        this.getChartDataforRelease(
          data[key]?.kpiId,
          this.allKpiArray?.length - 1,
          agType,
        );
      }
      // After kpi202 chart data is set, compute the aggregated line chart data for the duplicate
      if (data[key]?.kpiId === 'kpi202') {
        // Fetch and cache the saved workflow order from field mapping (once per project),
        // then re-render. computeKpi202DuplicateChartData is also called immediately
        // below so the chart renders right away with whatever order is already cached.
        if (!this.kpi202WorkflowOrderFetched) {
          this.kpi202WorkflowOrderFetched = true;
          this.fetchAndCacheKpi202WorkflowOrder();
        }
        this.computeKpi202DuplicateChartData();
      }
    }
  }

  appendParentName(data) {
    // logic for same node Display Names ie... sProjectName in data
    let anyProjectNodeArr = [];
    let uniqueProjectNames;
    Object.keys(data).forEach((kpiId) => {
      if (kpiId !== 'kpi189') {
        // && kpiId !== 'kpi168') {
        // && kpiId !== 'kpi38') {
        if (data[kpiId].trendValueList?.length) {
          let allProjectNames = data[kpiId].trendValueList?.flatMap((item) =>
            item.value?.map((v) => v.sprojectName || v.data),
          );

          let projectHasData = true;
          let everyProjectHasData = true;
          this.service.getSelectedTrends().forEach((element) => {
            for (const curr of data[kpiId].trendValueList) {
              projectHasData =
                curr.value
                  .map((v) => v.sProjectName || v.data)
                  .includes(element.nodeName) ||
                curr.value
                  .map((v) => v.sProjectName || v.data)
                  .includes(element.nodeDisplayName);
              if (!projectHasData) {
                if ([...new Set(allProjectNames)].length !== 1) {
                  allProjectNames = allProjectNames.filter(
                    (x) =>
                      x !== element.nodeName && x !== element.nodeDisplayName,
                  );
                  if (everyProjectHasData) {
                    everyProjectHasData = false;
                  }
                  // break;
                } else {
                  if (
                    [...new Set(allProjectNames)].length !==
                    this.service.getSelectedTrends().length
                  ) {
                    if (everyProjectHasData) {
                      everyProjectHasData = false;
                    }
                  }
                }
              }
            }
          });

          uniqueProjectNames = [...new Set(allProjectNames)];
          if (
            uniqueProjectNames?.length !==
              this.service.getSelectedTrends()?.length &&
            // && everyProjectHasData
            uniqueProjectNames.length !== allProjectNames?.length
          ) {
            this.nonUniqueNames = true;
            if (uniqueProjectNames.map((x) => x).length) {
              data[kpiId].trendValueList.forEach((dataItem, dataIndex) => {
                let anyProject;

                anyProject = dataItem.value.map((valueItem) => {
                  let result;
                  result = valueItem.projectNames || [valueItem.sprojectName];
                  if (result?.[0]) {
                    return result;
                  } else {
                    result = valueItem.value.map(
                      (val) => val.projectNames || [val.sprojectName],
                    );
                    return result;
                  }
                });
                if (!anyProject?.length) {
                } else {
                  if (
                    Array.isArray(anyProject[0][0]) &&
                    anyProject[0][0].length
                  ) {
                    anyProject = [...new Set(anyProject)];
                    anyProject = anyProject.map((x) => x[0]).map((x) => x[0]);
                  }
                }

                if (!Array.isArray(anyProject)) {
                  anyProject = [anyProject];
                } else if (Array.isArray(anyProject[0])) {
                  anyProject = anyProject[0];
                }

                const completeHierarchyData =
                  JSON.parse(localStorage.getItem('completeHierarchyData'))[
                    this.selectedtype
                  ] || [];

                // anyProject
                let anyProjectNode;

                if (anyProject?.length) {
                  anyProject?.forEach((anyProjectElem) => {
                    anyProjectNode = this.findHigherLevelParentForOtherNode(
                      anyProjectElem,
                      completeHierarchyData,
                    );

                    if (!anyProjectNode) {
                      // this means project is coming instead of subsequent level
                      anyProjectNode = this.findHigherLevelParentForProject(
                        anyProjectElem,
                        completeHierarchyData,
                      );
                    }

                    if (
                      !anyProjectNode ||
                      !anyProjectNode['nodeId'] ||
                      !this.service
                        .getSelectedTrends()
                        .map((x) => x.parentId)
                        .includes(anyProjectNode['nodeId'])
                    ) {
                      if (
                        anyProjectNode &&
                        anyProjectNode['labelName'] === 'project'
                      ) {
                        anyProjectNode = this.findHigherLevelParentForProject(
                          anyProjectNode['nodeDisplayName'],
                          completeHierarchyData,
                        );
                      }
                    }

                    anyProjectNodeArr.push(anyProjectNode);
                    anyProjectNodeArr = [...new Set(anyProjectNodeArr)];
                  });
                }
              });
            }
          }
        }
      }

      if (
        anyProjectNodeArr?.length &&
        uniqueProjectNames?.length !== this.service.getSelectedTrends()?.length
      ) {
        if (kpiId !== 'kpi189' && kpiId !== 'kpi168') {
          data[kpiId].trendValueList = this.appendParentNameInActualData(
            data[kpiId].trendValueList,
            anyProjectNodeArr,
          );
        }

        // });
        // this.cdr.detectChanges();
      }
    });
    return data;
  }

  appendParentNameInActualData(data, anyProjectNodeArr) {
    if (Array.isArray(data)) {
      data.forEach((dataBlock, index) => {
        if (
          dataBlock.hasOwnProperty('data') &&
          isNaN(dataBlock.data) &&
          anyProjectNodeArr[index] &&
          anyProjectNodeArr[index]['nodeName']
        ) {
          dataBlock.data =
            dataBlock.data + ' (' + anyProjectNodeArr[index]['nodeName'] + ')';
        }
        dataBlock.value.forEach((dataItem, subIndex) => {
          let anyProjectNode = anyProjectNodeArr[index];
          if (
            dataItem.hasOwnProperty('data') &&
            isNaN(dataItem.data) &&
            anyProjectNode
          ) {
            dataItem.data =
              dataItem.data + ' (' + anyProjectNode['nodeName'] + ')';
          }

          if (Array.isArray(dataItem.value) && anyProjectNodeArr[subIndex]) {
            anyProjectNode = anyProjectNodeArr[subIndex];
            dataItem.value?.forEach((element) => {
              if (element.hasOwnProperty('sprojectName')) {
                element.sprojectName =
                  element.sprojectName +
                  ' (' +
                  anyProjectNode['nodeName'] +
                  ')';
              }
            });
          } else if (anyProjectNode) {
            if (dataItem.hasOwnProperty('sprojectName')) {
              dataItem.sprojectName =
                dataItem.sprojectName + ' (' + anyProjectNode['nodeName'] + ')';
            }
          }
        });
      });
    }
    return data;
  }

  findHigherLevelParentForProject(anyProject, completeHierarchyData) {
    if (!Array.isArray(completeHierarchyData)) {
      completeHierarchyData = [];
    }
    const projectLevel = completeHierarchyData.find(
      (x) => x.hierarchyLevelId.toLowerCase() === 'project',
    )?.level;
    let parentName;
    let anyProjectNode = this.completeFilterData[
      completeHierarchyData.find((x) => x.level === projectLevel)
        ?.hieararchyLevelName
    ]?.filter(
      (x) => x.nodeName === anyProject || x.nodeDisplayName === anyProject,
    );

    if (anyProjectNode?.length && anyProjectNode.length > 1) {
      anyProjectNode = anyProjectNode.filter((x) =>
        this.service
          .getSelectedTrends()
          .map((f) => f.nodeId)
          .includes(x.parentId),
      )[0];
    } else if (anyProjectNode?.length) {
      anyProjectNode = anyProjectNode[0];
    } else {
      const level = this.service.getSelectedTrends().map((x) => x.level)[0];
      anyProjectNode = this.completeFilterData[
        completeHierarchyData.find((x) => x.level === level)?.hierarchyLevelName
      ]?.find(
        (x) =>
          x.nodeName ===
            (Array.isArray(anyProject) ? anyProject[0] : anyProject) ||
          x.nodeDisplayName ===
            (Array.isArray(anyProject) ? anyProject[0] : anyProject),
      );
    }

    if (anyProjectNode && anyProjectNode['level']) {
      for (
        let k = anyProjectNode['level'];
        k >= this.service.getSelectedTrends()[0].level;
        k--
      ) {
        parentName = this.completeFilterData[
          completeHierarchyData.find((x) => x.level === k - 1)
            .hierarchyLevelName
        ].filter((x) => x.nodeId === anyProjectNode['parentId'])[0];
        anyProjectNode = this.completeFilterData[
          completeHierarchyData.find((x) => x.level === k - 1)
            .hierarchyLevelName
        ].find((x) => x.nodeId === parentName.nodeId);
      }
    } else {
      anyProjectNode = this.findHigherLevelParentForOtherNode(
        anyProject,
        completeHierarchyData,
      );
    }
    return anyProjectNode;
  }

  findHigherLevelParentForOtherNode(anyProject, completeHierarchyData) {
    if (!Array.isArray(completeHierarchyData)) {
      completeHierarchyData = [];
    }
    let anyProjectNode;
    let parentName;
    const projectLevel = completeHierarchyData?.find(
      (x) => x.hierarchyLevelId.toLowerCase() === 'project',
    )?.level;
    for (
      let k = projectLevel;
      k >= this.service.getSelectedTrends()[0]?.level;
      k--
    ) {
      anyProjectNode = this.completeFilterData[
        completeHierarchyData?.find((x) => x.level === k + 1).hierarchyLevelName
      ].filter(
        (x) => x.nodeName === anyProject || x.nodeDisplayName === anyProject,
      );
      if (anyProjectNode?.length) {
        break;
      }
    }
    if (anyProjectNode?.length && anyProjectNode.length > 1) {
      anyProjectNode = anyProjectNode.filter((x) =>
        this.service
          .getSelectedTrends()
          .map((f) => f.nodeId)
          .includes(x.parentId),
      )[0];
    } else if (anyProjectNode?.length) {
      if (Array.isArray(anyProjectNode)) {
        anyProjectNode = anyProjectNode[0];
      } else if (typeof anyProject === 'string') {
        const level = this.service.getSelectedTrends().map((x) => x.level)[0];
        anyProjectNode = this.completeFilterData[
          completeHierarchyData.find((x) => x.level === level)
            .hierarchyLevelName
        ].find(
          (x) => x.nodeName === anyProject || x.nodeDisplayName === anyProject,
        );

        if (!anyProjectNode) {
          anyProjectNode = this.findHigherLevelParentForOtherNode(
            anyProject,
            completeHierarchyData,
          );
        }
      }
    }

    if (anyProjectNode && anyProjectNode['nodeId']) {
      for (
        let k = anyProjectNode['level'];
        k >= this.service.getSelectedTrends()[0].level;
        k--
      ) {
        parentName = this.completeFilterData[
          completeHierarchyData.find((x) => x.level === k).hierarchyLevelName
        ].filter((x) => x.nodeId === anyProjectNode['nodeId'])[0];
        anyProjectNode = this.completeFilterData[
          completeHierarchyData.find((x) => x.level === k - 1)
            .hierarchyLevelName
        ].find((x) => x.nodeId === parentName.parentId);
      }

      return anyProjectNode;
    }
  }

  createAllKpiArrayForBacklog(data) {
    for (const key in data) {
      const idx = this.ifKpiExist(data[key]?.kpiId);
      if (idx !== -1) {
        this.allKpiArray.splice(idx, 1);
      }
      /**Todo: if else condition to be removed after api integration */
      this.allKpiArray.push(data[key]);

      /** if: for graphs, else: for other than graphs */
      if (
        this.updatedConfigGlobalData.filter((kpi) => kpi?.kpiId == key)[0]
          ?.kpiDetail?.chartType
      ) {
        this.getDropdownArrayForBacklog(data[key]?.kpiId);

        const agType = this.updatedConfigGlobalData?.filter(
          (x) => x.kpiId == data[key]?.kpiId,
        )[0]?.kpiDetail?.aggregationCriteria;
        this.getChartDataForBacklog(
          data[key]?.kpiId,
          this.allKpiArray?.length - 1,
          agType,
        );
      } else {
        this.getDropdownArrayForCard(data[key]?.kpiId);
        if (data[key]?.kpiId === 'kpi138') {
          this.updateKPI138FilterOptions(data[key]?.kpiId);
        }
        this.getChartDataForCard(
          data[key]?.kpiId,
          this.ifKpiExist(data[key]?.kpiId),
        );
      }
    }
  }

  getChartDataForCard(kpiId, idx) {
    if (kpiId === 'kpi138') {
      console.log(this.kpiSelectedFilterObj[kpiId]);
    }
    const trendValueList = this.allKpiArray[idx]?.trendValueList
      ? JSON.parse(JSON.stringify(this.allKpiArray[idx]?.trendValueList))
      : {};

    if (trendValueList && Object.keys(trendValueList)?.length > 0) {
      if (kpiId === 'kpi138') {
        console.log(trendValueList);

        const selectedFilter1 =
          this.kpiSelectedFilterObj[kpiId]?.['filter1'] || [];
        const selectedFilter2 =
          this.kpiSelectedFilterObj[kpiId]?.['filter2'] || [];
        const dropdownArr = this.kpiDropdowns[kpiId] || [];
        const totalOptions1 = dropdownArr[0]?.options || [];
        const totalOptions2 = dropdownArr[1]?.options || [];

        if (
          (selectedFilter1.length > 0 &&
            selectedFilter1.length === totalOptions1.length &&
            selectedFilter2.length > 0 &&
            selectedFilter2.length === totalOptions2.length) ||
          selectedFilter1.length === 0
        ) {
          const overall = trendValueList['value']?.find(
            (x) =>
              x.filter1?.toLowerCase() === 'overall' ||
              x.filter2?.toLowerCase() === 'overall',
          );
          if (overall) {
            this.kpiChartData[kpiId] = [overall];
            return;
          }
        }
      }
      // get backup KPI filters
      this.getBackupKPIFiltersForBacklog(kpiId);

      if (
        this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') &&
        this.kpiSelectedFilterObj[kpiId]['filter1']?.length > 0 &&
        this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2') &&
        this.kpiSelectedFilterObj[kpiId]['filter2']?.length > 0 &&
        Array.isArray(this.kpiSelectedFilterObj[kpiId]['filter1']) &&
        Array.isArray(this.kpiSelectedFilterObj[kpiId]['filter2'])
      ) {
        const tempArr = [];
        const preAggregatedValues = [];
        /** tempArr: array with combination of all items of filter1 and filter2 */
        for (
          let i = 0;
          i < this.kpiSelectedFilterObj[kpiId]['filter1']?.length;
          i++
        ) {
          for (
            let j = 0;
            j < this.kpiSelectedFilterObj[kpiId]['filter2']?.length;
            j++
          ) {
            tempArr.push({
              filter1: this.kpiSelectedFilterObj[kpiId]['filter1'][i],
              filter2: this.kpiSelectedFilterObj[kpiId]['filter2'][j],
            });
          }
        }

        for (let i = 0; i < tempArr?.length; i++) {
          const filteredItems = trendValueList['value']?.filter(
            (k) =>
              k['filter1'] == tempArr[i]?.filter1 &&
              k['filter2'] == tempArr[i]?.filter2,
          );
          if (filteredItems?.length > 0) {
            preAggregatedValues.push(...filteredItems);
          } else if (
            kpiId === 'kpi138' &&
            trendValueList['value']?.length > 0
          ) {
            const placeholder = JSON.parse(
              JSON.stringify(trendValueList['value'][0] || {}),
            );
            placeholder.filter1 = tempArr[i]?.filter1;
            placeholder.filter2 = tempArr[i]?.filter2;
            if (placeholder.data && Array.isArray(placeholder.data)) {
              placeholder.data.forEach((d) => (d.value = -99));
            }
            preAggregatedValues.push(placeholder);
          }
        }
        if (preAggregatedValues?.length > 1) {
          if (kpiId === 'kpi138') {
            this.kpiChartData[kpiId] = [...preAggregatedValues];
          } else {
            this.kpiChartData[kpiId] =
              this.applyAggregationLogic(preAggregatedValues);
          }
        } else {
          this.kpiChartData[kpiId] = [...preAggregatedValues];
        }
      } else if (
        (this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') &&
          Array.isArray(this.kpiSelectedFilterObj[kpiId]['filter1']) &&
          !this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2')) ||
        (this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2') &&
          Array.isArray(this.kpiSelectedFilterObj[kpiId]['filter2']) &&
          !this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1'))
      ) {
        const filters =
          this.kpiSelectedFilterObj[kpiId]['filter1'] ||
          this.kpiSelectedFilterObj[kpiId]['filter2'];
        const filterKey = this.kpiSelectedFilterObj[kpiId]?.['filter1']
          ? 'filter1'
          : 'filter2';
        const preAggregatedValues = [];
        for (let i = 0; i < filters?.length; i++) {
          const filteredItems = trendValueList['value']?.filter(
            (x) => x['filter1'] == filters[i] || x['filter2'] == filters[i],
          );
          if (filteredItems?.length > 0) {
            preAggregatedValues.push(...filteredItems);
          } else if (
            kpiId === 'kpi138' &&
            trendValueList['value']?.length > 0
          ) {
            const placeholder = JSON.parse(
              JSON.stringify(trendValueList['value'][0] || {}),
            );
            placeholder[filterKey] = filters[i];
            const otherKey = filterKey === 'filter1' ? 'filter2' : 'filter1';
            placeholder[otherKey] = 'Overall';
            if (placeholder.data && Array.isArray(placeholder.data)) {
              placeholder.data.forEach((d) => (d.value = -99));
            }
            preAggregatedValues.push(placeholder);
          }
        }
        if (preAggregatedValues?.length > 1) {
          if (kpiId === 'kpi138') {
            this.kpiChartData[kpiId] = [...preAggregatedValues];
          } else {
            this.kpiChartData[kpiId] =
              this.applyAggregationLogic(preAggregatedValues);
          }
        } else {
          this.kpiChartData[kpiId] = [...preAggregatedValues];
        }
      } else if (
        this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') ||
        (this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2') &&
          (!Array.isArray(this.kpiSelectedFilterObj[kpiId]['filter1']) ||
            !Array.isArray(this.kpiSelectedFilterObj[kpiId]['filter2'])))
      ) {
        // if (kpiId === 'kpi171') {
        //   // this.getkpi171Data(kpiId, trendValueList);
        // } else {
        this.getChartDataForCardWithCombinationFilter(kpiId, trendValueList);
        // }
      } else {
        /** when there are no kpi level filters */
        this.kpiChartData[kpiId] = [];
        if (
          trendValueList?.hasOwnProperty('value') &&
          trendValueList['value']?.length > 0
        ) {
          this.kpiChartData[kpiId]?.push(
            trendValueList['value']?.filter(
              (x) => x['filter1'] == 'Overall',
            )[0],
          );
        } else if (trendValueList?.length > 0) {
          this.kpiChartData[kpiId] = [...trendValueList];
        } else {
          const obj = JSON.parse(JSON.stringify(trendValueList));
          this.kpiChartData[kpiId]?.push(obj);
        }
      }
    } else {
      this.kpiChartData[kpiId] = [];
    }
    // this.kpi171RoundOff();
  }

  getChartDataForCardWithCombinationFilter(kpiId, trendValueList) {
    this.getBackupKPIFiltersForBacklog(kpiId);
    const filters = this.kpiSelectedFilterObj[kpiId];
    if (kpiId === 'kpi138') {
      console.log(filters);
    }

    if (kpiId === 'kpi138') {
      const f1 = Array.isArray(filters?.filter1)
        ? filters.filter1
        : filters?.filter1
        ? [filters.filter1]
        : [];
      const f2 = Array.isArray(filters?.filter2)
        ? filters.filter2
        : filters?.filter2
        ? [filters.filter2]
        : [];

      const dropdownArr = this.kpiDropdowns[kpiId] || [];
      const totalOptions1 = dropdownArr[0]?.options || [];
      const totalOptions2 = dropdownArr[1]?.options || [];

      if (
        (f1.length > 0 &&
          f1.length === totalOptions1.length &&
          f2.length > 0 &&
          f2.length === totalOptions2.length) ||
        f1.length === 0
      ) {
        const overall = trendValueList['value']?.find(
          (x) =>
            x.filter1?.toLowerCase() === 'overall' ||
            x.filter2?.toLowerCase() === 'overall',
        );
        if (overall) {
          this.kpiChartData[kpiId] = [overall];
          return;
        }
      }

      const tempArr = [];
      const preAggregatedValues = [];
      const loop1 = f1.length > 0 ? f1 : [undefined];
      const loop2 = f2.length > 0 ? f2 : [undefined];

      for (let i = 0; i < loop1.length; i++) {
        for (let j = 0; j < loop2.length; j++) {
          tempArr.push({ filter1: loop1[i], filter2: loop2[j] });
        }
      }

      for (let i = 0; i < tempArr.length; i++) {
        const filteredItems = trendValueList['value']?.filter((k) => {
          const match1 = tempArr[i].filter1
            ? k.filter1 === tempArr[i].filter1
            : true;
          const match2 = tempArr[i].filter2
            ? k.filter2 === tempArr[i].filter2
            : true;
          return match1 && match2;
        });

        if (filteredItems?.length > 0) {
          preAggregatedValues.push(...filteredItems);
        } else if (trendValueList['value']?.length > 0) {
          const placeholder = JSON.parse(
            JSON.stringify(trendValueList['value'][0] || {}),
          );
          placeholder.filter1 = tempArr[i].filter1;
          placeholder.filter2 = tempArr[i].filter2;
          if (placeholder.data && Array.isArray(placeholder.data)) {
            placeholder.data.forEach((d) => (d.value = -99));
          }
          preAggregatedValues.push(placeholder);
        }
      }
      this.kpiChartData[kpiId] = preAggregatedValues;
      return;
    }

    /** Existing logic for other KPIs */
    let preAggregatedValues = [];
    for (const filter in filters) {
      let tempArr = [];
      if (preAggregatedValues.length > 0) {
        tempArr = preAggregatedValues;
      } else {
        tempArr = trendValueList?.value ? trendValueList?.value : [];
      }

      if (Array.isArray(filters[filter])) {
        if (filters[filter].length > 0) {
          preAggregatedValues = [
            ...tempArr.filter((x) => filters[filter].includes(x[filter])),
          ];
        } else {
          preAggregatedValues = [...tempArr];
        }
      } else {
        preAggregatedValues = [
          ...tempArr.filter((x) => x[filter] === filters[filter]),
        ];
      }
    }

    if (preAggregatedValues?.length > 1) {
      this.kpi171Check(kpiId, preAggregatedValues);
    } else {
      this.kpiChartData[kpiId] = [...preAggregatedValues];
    }
    // this.kpi171RoundOff();
  }

  // kpi171RoundOff() {
  //   if (
  //     this.kpiChartData.hasOwnProperty('kpi171') &&
  //     this.kpiChartData['kpi171'].length
  //   ) {
  //     const roundOffData = [...this.kpiChartData['kpi171']];
  //     if (roundOffData && roundOffData?.length) {
  //       roundOffData[0]['data'] = roundOffData[0]?.data?.map((item) => ({
  //         ...item,
  //         value: Math.round(item.value), // Round off `value`
  //         value1: Math.round(item.value1), // Round off `value1`
  //       }));
  //       this.kpiChartData['kpi171'] = roundOffData;
  //     }
  //   }
  // }

  kpi171Check(kpiId, preAggregatedValues) {
    if (kpiId === 'kpi171') {
      //calculate number of days for lead time
      let kpi171preAggregatedValues = JSON.parse(
        JSON.stringify(preAggregatedValues),
      );
      kpi171preAggregatedValues = this.helperService.aggregationCycleTime(
        kpi171preAggregatedValues,
      );
      this.kpiChartData[kpiId] = [kpi171preAggregatedValues];
    } else {
      this.kpiChartData[kpiId] =
        this.applyAggregationLogic(preAggregatedValues);
    }
  }

  populateKPIFilters(data, key) {
    const filters = this.allKpiArray[this.allKpiArray?.length - 1]?.filters;
    this.getDropdownArray(data[key]?.kpiId);
  }

  getKpiChartType(kpiId) {
    return this.updatedConfigGlobalData.filter(
      (kpiDetails) => kpiDetails.kpiId === kpiId,
    )[0]?.kpiDetail?.chartType;
  }

  applyAggregationLogic(arr) {
    const aggregatedArr = [JSON.parse(JSON.stringify(arr[0]))];
    for (let i = 0; i < arr?.length; i++) {
      for (let j = 0; j < arr[i]?.data?.length; j++) {
        const idx = aggregatedArr[0].data?.findIndex(
          (x) => x.label == arr[i]?.data[j]?.label,
        );
        if (idx == -1) {
          aggregatedArr[0]?.data?.push(arr[i]?.data[j]);
        }
      }
    }

    aggregatedArr[0].data = aggregatedArr[0]?.data?.map((item) => ({
      ...item,
      value: 0,
      value1: item?.hasOwnProperty('value1') ? 0 : null,
      modalValues: item?.hasOwnProperty('modalValues') ? [] : null,
    }));

    for (let i = 0; i < arr?.length; i++) {
      for (let j = 0; j < arr[i]?.data?.length; j++) {
        const idx = aggregatedArr[0].data?.findIndex(
          (x) => x.label == arr[i].data[j]['label'],
        );

        if (idx != -1) {
          aggregatedArr[0].data[idx]['value'] += arr[i].data[j]['value'];
          if (
            aggregatedArr[0]?.data[idx]?.hasOwnProperty('value1') &&
            aggregatedArr[0]?.data[idx]?.value1 != null
          ) {
            aggregatedArr[0].data[idx]['value1'] += arr[i].data[j]['value1'];
          }
          if (
            aggregatedArr[0]?.data[idx]?.hasOwnProperty('modalValues') &&
            aggregatedArr[0]?.data[idx]?.modalValues != null
          ) {
            aggregatedArr[0].data[idx]['modalValues'] = [
              ...aggregatedArr[0]?.data[idx]['modalValues'],
              ...arr[i]?.data[j]['modalValues'],
            ];
          }
        }
      }
    }

    aggregatedArr[0]?.data?.forEach((item) => {
      item['value'] = +item['value']?.toFixed(2);
      if (item.value1) {
        item['value1'] = +item['value1']?.toFixed(2);
      }
    });
    return aggregatedArr;
  }

  convertToHoursIfTime(val, unit) {
    if (unit?.toLowerCase() == 'hours') {
      const hours = val / 60;
      const rhours = Math.floor(hours);
      const minutes = (hours - rhours) * 60;
      const rminutes = Math.round(minutes);
      if (rminutes == 0) {
        val = rhours + 'h';
      } else if (rhours == 0) {
        val = rminutes + 'm';
      } else {
        val = rhours + 'h ' + rminutes + 'm';
      }
    }
    return val;
  }

  checkSprint(value, unit, kpiId) {
    if (
      kpiId !== 'kpi138' &&
      ((this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter1') &&
        this.kpiSelectedFilterObj[kpiId]['filter1']?.length > 0 &&
        this.kpiSelectedFilterObj[kpiId]['filter1'][0]?.toLowerCase() !==
          'overall') ||
        (this.kpiSelectedFilterObj[kpiId]?.hasOwnProperty('filter2') &&
          this.kpiSelectedFilterObj[kpiId]['filter2']?.length > 0 &&
          this.kpiSelectedFilterObj[kpiId]['filter2'][0]?.toLowerCase() !==
            'overall'))
    ) {
      return '-';
    } else {
      if (value === -99) {
        return '-';
      }
      return Math.floor(value) < value
        ? `${Math.round(value)} ${unit}`
        : `${value} ${unit}`;
    }
  }

  handleArrowClick(kpi, label, tableValues) {
    const idx = this.ifKpiExist(kpi?.kpiId);
    const basicConfigId = this.service.selectedTrends[0].basicProjectConfigId;
    this.httpService
      .getkpiColumns(basicConfigId, kpi.kpiId)
      .subscribe((response) => {
        if (response['success']) {
          this.exportExcelComponent.dataTransformForIterationTableWidget(
            [],
            [],
            response['data']['kpiColumnDetails'],
            tableValues,
            kpi?.kpiName + ' / ' + label,
            kpi.kpiId,
          );
        }
      });
  }

  /**
   * Checks if the KPI data is zero or not based on various conditions and KPI IDs.
   * @param kpi - The KPI object containing details and ID to evaluate.
   * @returns - Returns true if data is present and greater than zero, otherwise false.
   */
  checkIfZeroData(kpi) {
    if (
      this.checkIfDataPresent(kpi) &&
      this.service.getSelectedTrends()[0]?.labelName?.toLowerCase() ===
        'project'
    ) {
      if (this.service.getSelectedTrends()?.length === 1) {
        /** 19th Nov, 2024: Decision was taken to bypass all the checks and show a warning in case of failed processor run */

        // let data = this.kpiChartData[kpi.kpiId];
        // let dataValue = 0;

        // flow load and flow distributions KPIs
        // if (kpi.kpiId === 'kpi148' || kpi.kpiId === 'kpi146') {
        //   if (this.kpiChartData[kpi.kpiId]?.length) {
        //     return true;
        //   }
        // }

        // // Cycle Time
        // if (kpi.kpiId === 'kpi171') {
        //   if (this.kpiChartData[kpi.kpiId]?.length && this.kpiChartData[kpi.kpiId][0]?.data?.length > 0) {
        //     return true;
        //   } else {
        //     return false;
        //   }
        // }

        // // Refinement Rejection Rate and Production Defects Ageing
        // if (kpi.kpiId === 'kpi139' || kpi.kpiId === 'kpi127') {
        //   if (this.kpiChartData[kpi.kpiId]?.length && this.kpiChartData[kpi.kpiId][0].value?.length) {
        //     if (Array.isArray(data[0].value) && data[0].value.length) {
        //       data[0].value.forEach(element => {
        //         dataValue += parseInt(element.data);
        //       });
        //     }
        //   }
        // }

        // // Sonar Code Quality, Test Execution and Pass Percentage KPI , PI Predicatability
        // else if (kpi.kpiId === 'kpi168' || kpi.kpiId === 'kpi70' || kpi.kpiId === 'kpi153') {
        //   if (this.kpiChartData[kpi.kpiId]?.length && this.kpiChartData[kpi.kpiId][0].value?.length > 0) {
        //     if (Array.isArray(data[0].value) && data[0].value) {
        //       data[0].value.forEach(element => {
        //         if (kpi.kpiId === 'kpi70') {
        //           dataValue += element.value;
        //         } else if (Array.isArray(element.dataValue) && element.dataValue.length) {
        //           element.dataValue.forEach(subElem => {
        //             dataValue += subElem.value;
        //           });
        //         }
        //       });
        //     }
        //   }
        // }

        // else if (Array.isArray(data[0].value)) {
        //   data[0].value.forEach(element => {
        //     dataValue += element.value;
        //   });
        // }

        // if (dataValue > 0) {
        //   return true;
        // } else {
        const processorLastRun = this.findTraceLogForTool(
          kpi.kpiDetail.combinedKpiSource || kpi.kpiDetail.kpiSource,
        );
        // processorLastRunSuccess = false;
        if (
          processorLastRun == undefined ||
          processorLastRun == null ||
          processorLastRun.executionEndedAt == 0
        ) {
          return true;
        } else if (!processorLastRun?.executionSuccess) {
          if (this.kpiStatusCodeArr[kpi.kpiId] !== '201') {
            this.kpiStatusCodeArr[kpi.kpiId] = '203';
          }
          return true;
        } else if (processorLastRun?.executionSuccess) {
          return true;
        } else {
          return true;
        }
        // }
      } else {
        return true;
      }
      // return false;
    } else {
      return this.checkIfDataPresent(kpi);
    }
  }

  /**
   * Retrieves the trace log for a specified processor by its name.
   * @param processorName - The name of the processor, which may include a path.
   * @returns The log details of the processor if found, otherwise undefined.
   */
  findTraceLogForTool(processorName) {
    const sourceArray = processorName.includes('/')
      ? processorName.split('/')
      : [processorName];
    return this.service
      .getProcessorLogDetails()
      .find((ptl) => sourceArray.includes(ptl['processorName']));
  }

  checkIfDataPresent(kpi) {
    if (this.kpiStatusCodeArr[kpi.kpiId]) {
      if (
        (this.kpiStatusCodeArr[kpi.kpiId] === '200' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '201' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '203') &&
        (kpi.kpiId === 'kpi148' || kpi.kpiId === 'kpi146')
      ) {
        if (this.kpiChartData[kpi.kpiId]?.length) {
          return true;
        }
      } else if (
        (this.kpiStatusCodeArr[kpi.kpiId] === '200' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '201' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '203') &&
        (kpi.kpiId === 'kpi139' || kpi.kpiId === 'kpi127')
      ) {
        if (
          this.kpiChartData[kpi.kpiId]?.length &&
          this.kpiChartData[kpi.kpiId][0].value?.length
        ) {
          return true;
        }
      } else if (
        (this.kpiStatusCodeArr[kpi.kpiId] === '200' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '201' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '203') &&
        (kpi.kpiId === 'kpi168' ||
          kpi.kpiId === 'kpi70' ||
          kpi.kpiId === 'kpi153' ||
          kpi.kpiId === 'kpi135')
      ) {
        if (
          this.kpiChartData[kpi.kpiId]?.length &&
          this.kpiChartData[kpi.kpiId][0].value?.length > 0
        ) {
          return true;
        }
      } else if (
        (this.kpiStatusCodeArr[kpi.kpiId] === '200' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '201' ||
          this.kpiStatusCodeArr[kpi.kpiId] === '203') &&
        kpi.kpiId === 'kpi171'
      ) {
        return (
          this.kpiChartData[kpi.kpiId] &&
          this.kpiChartData[kpi.kpiId]?.data?.length &&
          this.kpiChartData[kpi.kpiId]?.data?.length
        );
      } else {
        return (
          (this.kpiStatusCodeArr[kpi.kpiId] === '200' ||
            this.kpiStatusCodeArr[kpi.kpiId] === '201' ||
            this.kpiStatusCodeArr[kpi.kpiId] === '203') &&
          this.helperService.checkDataAtGranularLevel(
            this.kpiChartData[kpi.kpiId],
            kpi.kpiDetail.chartType,
            this.selectedTab,
          )
        );
      }
    }
    return false;
  }

  checkIfPartialDataPresent(kpi) {
    const kpiData =
      this.ifKpiExist(kpi.kpiId) >= 0
        ? this.allKpiArray[this.ifKpiExist(kpi.kpiId)]?.trendValueList
        : null;
    const filters = kpiData?.length ? kpiData.map((x) => x.filter1) : null;
    if (kpiData && filters && kpi.kpiId !== 'kpi171') {
      return this.checkPartialDataCondition(kpi, kpiData, filters);
    } else {
      return false;
    }
  }

  checkPartialDataCondition(kpi, kpiData, filters) {
    if (filters.length === 2) {
      const partialKpiData1 = kpiData.filter((x) => x.filter1 === filters[0]);
      const partialKpiData2 = kpiData.filter((x) => x.filter1 === filters[1]);
      if (
        (this.helperService.checkDataAtGranularLevel(
          partialKpiData1,
          kpi.kpiDetail.chartType,
          this.selectedTab,
        ) &&
          !this.helperService.checkDataAtGranularLevel(
            partialKpiData2,
            kpi.kpiDetail.chartType,
            this.selectedTab,
          )) ||
        (this.helperService.checkDataAtGranularLevel(
          partialKpiData2,
          kpi.kpiDetail.chartType,
          this.selectedTab,
        ) &&
          !this.helperService.checkDataAtGranularLevel(
            partialKpiData1,
            kpi.kpiDetail.chartType,
            this.selectedTab,
          ))
      ) {
        return true;
      }
    } else {
      return false;
    }
  }

  // checkIfPartialDataForKpi171(kpiData) {
  //   kpiData = kpiData?.value;
  //   let filters = kpiData?.length ? kpiData.map((x) => x.filter1) : null;
  //   for (let i = 0; i < filters?.length; i++) {
  //     let partialKpiData = kpiData.filter((x) => x.filter1 === filters[i])[0];
  //     if (partialKpiData && partialKpiData.data?.length) {
  //       return true;
  //     }
  //   }
  // }
  generateColorObj(kpiId, arr) {
    // If the arr is empty, return an empty array
    if (!arr?.length) {
      return [];
    }

    const finalArr = [];
    this.chartColorList[kpiId] = [];

    for (let i = 0; i < arr?.length; i++) {
      for (const key in this.colorObj) {
        if (arr[i].value?.length) {
          let selectedNode;
          if (this.nonUniqueNames) {
            selectedNode = this.filterData.filter(
              (x) => this.appendParent(x) === arr[i].value[0].sprojectName,
            );
          } else {
            selectedNode = this.filterData.filter(
              (x) => x.nodeDisplayName === arr[i].value[0].sprojectName,
            );
          }
          let selectedId;
          if (selectedNode?.length > 1) {
            selectedId = selectedNode.filter((x) => x.nodeId === key)[0]
              ?.nodeId;
          } else {
            selectedId = selectedNode[0]?.nodeId;
            if (!selectedId) {
              selectedNode = this.filterData.filter(
                (x) => x.nodeDisplayName === arr[i].value[0].sprojectName,
              );
            }
            if (selectedNode?.length > 1) {
              selectedId = selectedNode.filter((x) => x.nodeId === key)[0]
                ?.nodeId;
            } else {
              selectedId = selectedNode[0]?.nodeId;
            }
          }

          // if (!this.chartColorList[kpiId].includes(this.colorObj[key]?.color)) {
          if (kpiId == 'kpi17' && this.colorObj[key]?.nodeId == selectedId) {
            this.chartColorList[kpiId].push(this.colorObj[key]?.color);
            finalArr.push(JSON.parse(JSON.stringify(arr[i])));
          } else if (this.colorObj[key]?.nodeId == selectedId) {
            this.chartColorList[kpiId].push(this.colorObj[key]?.color);
            finalArr.push(arr[i]);
          } else {
            continue;
          }
          // } else continue;
        }
      }
    }
    return finalArr;
  }

  /** get array of the kpi level filter */
  getDropdownArray(kpiId) {
    const idx = this.ifKpiExist(kpiId);
    const dropdownArr = [];
    const trendValueList = this.allKpiArray[idx]?.trendValueList;
    if (idx != -1 && trendValueList?.length) {
      const filterPropArr = Object.keys(trendValueList[0]).filter((prop) =>
        prop.includes('filter'),
      );
      if (trendValueList?.length > 0 && filterPropArr?.length) {
        filterPropArr.forEach((filterProp) => {
          dropdownArr?.push(
            new Set([...trendValueList.map((x) => x[filterProp])]),
          );
        });

        this.kpiDropdowns[kpiId] = [];
        dropdownArr.forEach((arr, i) => {
          arr = Array.from(arr);
          const obj = {};
          const kpiObj = this.updatedConfigGlobalData?.filter(
            (x) => x['kpiId'] == kpiId,
          )[0];
          if (
            this.selectedTab.toLowerCase() !== 'developer' ||
            kpiId !== 'kpi168'
          ) {
            if (
              kpiObj &&
              kpiObj['kpiDetail']?.hasOwnProperty('kpiFilter') &&
              (kpiObj['kpiDetail']['kpiFilter']?.toLowerCase() ==
                'multiselectdropdown' ||
                kpiObj['kpiDetail']['kpiFilter']?.toLowerCase() ==
                  'multitypefilters')
            ) {
              const index = arr?.findIndex(
                (x) => x?.toLowerCase() == 'overall',
              );
              if (index > -1) {
                arr?.splice(index, 1);
              }
            }
          }

          if (this.allKpiArray[idx]?.filters) {
            const filterConfig = this.allKpiArray[idx].filters;
            obj['filterType'] = filterConfig['filter' + (i + 1)]?.filterType
              ? filterConfig['filter' + (i + 1)]?.filterType
              : 'Select a filter';
          } else {
            obj['filterType'] = 'Select a filter';
          }
          if (arr.length > 0) {
            arr.sort((a, b) => {
              if (a === 'Overall') {
                return -1; // "Overall" should be moved to the beginning (0 index)
              } else if (b === 'Overall') {
                return 1; // "Overall" should be moved to the beginning (0 index)
              } else {
                return 0; // Maintain the original order of other elements
              }
            });

            obj['options'] = arr;
            this.kpiDropdowns[kpiId].push(obj);
          }
        });
      }
    } else if (!trendValueList || trendValueList?.length == 0) {
      this.kpiDropdowns[kpiId] = [];
    }

    if (
      (kpiId === 'kpi171' || kpiId === 'kpi202') &&
      this.allKpiArray[idx]?.filters
    ) {
      this.kpiDropdowns[kpiId] = Object.values(this.allKpiArray[idx]?.filters);
      this.kpiSelectedFilterObj[kpiId] = {
        filter1: ['Past 6 Months'],
        filter2: null,
      };
      if (kpiId === 'kpi171') {
        this.durationFilter = this.durationFilter || 'Past 6 Months';
      } else {
        this.durationFilterKpi202 =
          this.durationFilterKpi202 || 'Past 6 Months';
      }
    }

    if (
      this.kpiDropdowns[kpiId]?.length > 1 &&
      kpiId !== 'kpi171' &&
      kpiId !== 'kpi202'
    ) {
      this.kpiSelectedFilterObj[kpiId] = {};
      for (let i = 0; i < this.kpiDropdowns[kpiId].length; i++) {
        this.kpiSelectedFilterObj[kpiId]['filter' + (i + 1)] = this
          .kpiDropdowns[kpiId][i]?.options?.length
          ? [this.kpiDropdowns[kpiId][i].options[0]]
          : [];
      }
    }
  }

  getDropdownArrayForBacklog(kpiId) {
    const idx = this.ifKpiExist(kpiId);
    let trendValueList = [];
    const optionsArr = [];
    let filters = {};

    if (idx != -1) {
      trendValueList = this.allKpiArray[idx]?.trendValueList;
      filters = this.allKpiArray[idx]?.filters;
      if (filters && Object.keys(filters).length !== 0) {
        Object.keys(filters)?.forEach((x) => {
          optionsArr.push(filters[x]);
        });
        this.kpiDropdowns[kpiId] = [...optionsArr];
      } else if (
        trendValueList?.length > 0 &&
        trendValueList[0]?.hasOwnProperty('filter')
      ) {
        const obj = {};
        for (let i = 0; i < trendValueList?.length; i++) {
          if (
            trendValueList[i]?.filter?.toLowerCase() != 'overall' &&
            trendValueList.length > 1
          ) {
            optionsArr?.push(trendValueList[i]?.filter);
          }
        }
        obj['filterType'] = 'Select a filter';
        obj['options'] = optionsArr;
        this.kpiDropdowns[kpiId] = [];
        this.kpiDropdowns[kpiId].push(obj);
      } else if (
        trendValueList?.length > 0 &&
        trendValueList[0]?.hasOwnProperty('filter1')
      ) {
        const obj = {};
        for (let i = 0; i < trendValueList?.length; i++) {
          const ifExist = optionsArr.findIndex(
            (x) => x == trendValueList[i]?.filter1,
          );
          if (ifExist == -1) {
            optionsArr?.push(trendValueList[i]?.filter1);
          }
        }
        const kpiObj = this.updatedConfigGlobalData?.filter(
          (x) => x['kpiId'] == kpiId,
        )[0];
        if (
          kpiObj &&
          kpiObj['kpiDetail']?.hasOwnProperty('kpiFilter') &&
          (kpiObj['kpiDetail']['kpiFilter']?.toLowerCase() ==
            'multiselectdropdown' ||
            (kpiObj['kpiDetail']['kpiFilter']?.toLowerCase() == 'dropdown' &&
              kpiObj['kpiDetail'].hasOwnProperty('hideOverallFilter') &&
              kpiObj['kpiDetail']['hideOverallFilter']))
        ) {
          const index = optionsArr?.findIndex(
            (x) => x?.toLowerCase() == 'overall',
          );
          if (index > -1) {
            optionsArr?.splice(index, 1);
          }
        }
        obj['filterType'] = 'Select a filter';
        obj['options'] = optionsArr;
        this.kpiDropdowns[kpiId] = [];
        this.kpiDropdowns[kpiId].push(obj);
      }
    }
  }

  getDropdownArrayForCard(kpiId) {
    const idx = this.ifKpiExist(kpiId);
    let filters = {};
    const dropdownArr = [];

    if (idx != -1) {
      filters = this.allKpiArray[idx]?.filters;
      if (filters && Object.keys(filters).length !== 0) {
        Object.keys(filters)?.forEach((x) => {
          dropdownArr.push(JSON.parse(JSON.stringify(filters[x])));
        });
      }
    }
    this.kpiDropdowns[kpiId] = [...dropdownArr];
  }

  updateKPI138FilterOptions(kpiId) {
    const idx = this.ifKpiExist(kpiId);
    if (idx === -1) {
      return;
    }

    const filtersBase = this.allKpiArray[idx]?.filters;
    const originalDropdownArr = [];
    if (filtersBase && Object.keys(filtersBase).length !== 0) {
      Object.keys(filtersBase)?.forEach((x) => {
        originalDropdownArr.push(JSON.parse(JSON.stringify(filtersBase[x])));
      });
    }

    // Initialize if not present
    if (!this.kpiDropdowns[kpiId] || this.kpiDropdowns[kpiId].length === 0) {
      this.kpiDropdowns[kpiId] = [...originalDropdownArr];
    } else {
      // Update existing elements to maintain object reference
      originalDropdownArr.forEach((newFilter, i) => {
        if (this.kpiDropdowns[kpiId][i]) {
          // Keep filterType as is and only update options if needed
          // Actually, for kpi138 we specifically want to update filter2 options based on filter1 selection
          // but we reset to original first according to existing logic.
          // To maintain reference, we update the 'options' property of existing objects.
          this.kpiDropdowns[kpiId][i].options = newFilter.options;
          this.kpiDropdowns[kpiId][i].filterType = newFilter.filterType;
        } else {
          this.kpiDropdowns[kpiId][i] = newFilter;
        }
      });
      // Handle cases where original arrangement might have changed (unlikely for a single KPI but good for safety)
      if (this.kpiDropdowns[kpiId].length > originalDropdownArr.length) {
        this.kpiDropdowns[kpiId].splice(originalDropdownArr.length);
      }
    }

    const trendValueList = this.allKpiArray[idx]?.trendValueList?.value || [];
    const selectedFilters = this.kpiSelectedFilterObj[kpiId];
    const selectedF1 = Array.isArray(selectedFilters?.filter1)
      ? selectedFilters.filter1
      : selectedFilters?.filter1
      ? [selectedFilters.filter1]
      : [];

    if (
      selectedF1.length > 0 &&
      !selectedF1.includes('Overall') &&
      this.kpiDropdowns[kpiId]?.length > 1
    ) {
      const availableF2 = new Set();
      trendValueList.forEach((item) => {
        if (selectedF1.includes(item.filter1)) {
          if (item.filter2) {
            availableF2.add(item.filter2);
          }
        }
      });

      // Update Filter 2 (index 1) options
      const filter2Dropdown = this.kpiDropdowns[kpiId][1];
      if (filter2Dropdown && filter2Dropdown.options) {
        const filteredOptions = filter2Dropdown.options.filter((opt) =>
          availableF2.has(opt),
        );
        // Only apply filter if it leaves some options, otherwise we revert to original options so the dropdown doesn't disappear
        if (filteredOptions.length > 0) {
          filter2Dropdown.options = filteredOptions;
        } else {
          // Fallback to original options if filtering would hide the dropdown entirely
          const originalF2Options = originalDropdownArr[1]?.options || [];
          filter2Dropdown.options = originalF2Options;
        }
      }

      // Also ensure that if Filter 2 has selections that are no longer available, they are removed
      if (selectedFilters.filter2) {
        if (Array.isArray(selectedFilters.filter2)) {
          const newF2Selected = selectedFilters.filter2.filter((val) =>
            availableF2.has(val),
          );
          if (newF2Selected.length !== selectedFilters.filter2.length) {
            selectedFilters.filter2 = newF2Selected;
          }
        } else if (!availableF2.has(selectedFilters.filter2)) {
          delete selectedFilters.filter2;
        }
      }
    }
  }

  handleSelectedOption(event, kpi) {
    // Deep copy event to prevent shared state mutation with card component
    event = JSON.parse(JSON.stringify(event));
    if (kpi?.kpiId === 'kpi138') {
      if (
        event &&
        event.filter1 &&
        typeof event.filter1 === 'object' &&
        !Array.isArray(event.filter1)
      ) {
        const flattenedEvent: any = {};
        if (event.filter1.hasOwnProperty('filter1')) {
          flattenedEvent['filter1'] = event.filter1.filter1;
        }
        if (event.filter1.hasOwnProperty('filter2')) {
          flattenedEvent['filter2'] = event.filter1.filter2;
        }
        if (event.hasOwnProperty('filter2') && event.filter2 !== null) {
          // If we had a flat filter2 already, prefer it or merge it
          flattenedEvent['filter2'] = event.filter2;
        }
        event = flattenedEvent;
      } else if (
        event &&
        typeof event.filter1 === 'object' &&
        Array.isArray(event.filter1) &&
        event.filter1.length > 0 &&
        typeof event.filter1[0] === 'object'
      ) {
        // Handle case where user selects multiple object options from a multiselect
        const flattenedEvent: any = { filter1: [], filter2: [] };
        event.filter1.forEach((opt: any) => {
          if (opt && opt.filter1) {
            if (!flattenedEvent.filter1.includes(opt.filter1)) {
              flattenedEvent.filter1.push(opt.filter1);
            }
          }
          if (opt && opt.filter2) {
            if (Array.isArray(opt.filter2)) {
              opt.filter2.forEach((val) => {
                if (!flattenedEvent.filter2.includes(val)) {
                  flattenedEvent.filter2.push(val);
                }
              });
            } else {
              if (!flattenedEvent.filter2.includes(opt.filter2)) {
                flattenedEvent.filter2.push(opt.filter2);
              }
            }
          }
        });
        if (
          event.hasOwnProperty('filter2') &&
          event.filter2 !== null &&
          (!Array.isArray(event.filter2) || event.filter2.length > 0)
        ) {
          flattenedEvent['filter2'] = event.filter2;
        }
        event = flattenedEvent;
      }
    }
    if (this.selectedTab.toLowerCase() === 'release') {
      this.handleSelectedOptionOnRelease(event, kpi);
    } else if (this.selectedTab.toLowerCase() === 'backlog') {
      if (kpi?.kpiDetail?.chartType) {
        this.handleSelectedOptionOnBacklog(event, kpi);
      } else {
        this.handleSelectedOptionForCard(event, kpi);
      }
    } else {
      if (
        kpi.kpiId === 'kpi72' ||
        kpi.kpiId === 'kpi171' ||
        kpi.kpiId === 'kpi202'
      ) {
        if (
          event.hasOwnProperty('filter1') ||
          event.hasOwnProperty('filter2')
        ) {
          // For kpi171, check if filter1 is nested and flatten it
          if (
            (kpi.kpiId === 'kpi171' || kpi.kpiId === 'kpi202') &&
            event.filter1 &&
            typeof event.filter1 === 'object' &&
            !Array.isArray(event.filter1)
          ) {
            // Flatten nested filter1 structure
            const flattenedEvent = {};
            if (event.filter1.hasOwnProperty('filter1')) {
              flattenedEvent['filter1'] = event.filter1.filter1;
            }
            if (event.filter1.hasOwnProperty('filter2')) {
              flattenedEvent['filter2'] = event.filter1.filter2;
            }
            // Merge with top-level filter2 if it exists
            if (event.hasOwnProperty('filter2') && event.filter2 !== null) {
              flattenedEvent['filter2'] = event.filter2;
            }
            event = flattenedEvent;
          }

          if (!Array.isArray(event.filter1) || !Array.isArray(event.filter2)) {
            const outputObject = {};
            for (const key in event) {
              outputObject[key] =
                kpi.kpiId === 'kpi171' || kpi.kpiId === 'kpi202'
                  ? Array.isArray(event[key])
                    ? event[key]
                    : [event[key]]
                  : [event[key]];
            }
            event = outputObject;
          }
        }
        if (
          event &&
          Object.keys(event)?.length !== 0 &&
          typeof event === 'object'
        ) {
          for (const key in event) {
            if (
              event[key]?.length == 0 &&
              kpi.kpiId !== 'kpi171' &&
              kpi.kpiId !== 'kpi202'
            ) {
              delete event[key];
            } else if (
              event[key]?.length == 0 &&
              (kpi.kpiId === 'kpi171' || kpi.kpiId === 'kpi202')
            ) {
              event[key] = null;
            }
          }
          this.kpiSelectedFilterObj[kpi?.kpiId] = event;
        } else {
          this.kpiSelectedFilterObj[kpi?.kpiId] = { filter1: [event] };
        }
      } else if (
        (kpi?.kpiDetail?.kpiFilter &&
          kpi?.kpiDetail?.kpiFilter.toLowerCase() === 'multitypefilters') ||
        kpi?.kpiDetail?.kpiFilter.toLowerCase() === 'multiselectdropdown' ||
        kpi?.kpiId === 'kpi138'
      ) {
        this.kpiSelectedFilterObj[kpi?.kpiId] = event;
      } else {
        if (
          event &&
          Object.keys(event)?.length !== 0 &&
          typeof event === 'object' &&
          this.selectedTab.toLowerCase() !== 'developer'
        ) {
          this.kpiSelectedFilterObj[kpi?.kpiId] = [];
          for (const key in event) {
            if (event[key]?.length == 0) {
              delete event[key];
              this.kpiSelectedFilterObj[kpi?.kpiId] = event;
            } else if (Array.isArray(event[key])) {
              for (let i = 0; i < event[key]?.length; i++) {
                this.kpiSelectedFilterObj[kpi?.kpiId] = [
                  ...this.kpiSelectedFilterObj[kpi?.kpiId],
                  Array.isArray(event[key]) ? event[key][i] : event[key],
                ];
              }
            } else {
              if (kpi.kpiDetail.kpiFilter?.toLowerCase() !== 'dropdown') {
                this.kpiSelectedFilterObj[kpi?.kpiId] = Array.isArray(
                  event[key],
                )
                  ? event[key]
                  : [event[key]];
              } else {
                // Ensure dropdown string values are always wrapped in an array so they iterate correctly in getChartData
                event[key] = Array.isArray(event[key])
                  ? event[key]
                  : [event[key]];
                this.kpiSelectedFilterObj[kpi?.kpiId] = event;
              }
            }
          }
        } else if (this.selectedTab.toLowerCase() === 'developer') {
          const eventValue =
            typeof event.value === 'object' && event.value !== null
              ? event.value.nodeId
              : event.value;
          if (
            eventValue &&
            typeof eventValue === 'string' &&
            eventValue.includes('->')
          ) {
            this.currentBranch = eventValue;
            this.filterPerformanceSummaryData();
          }
          const trendValueList =
            this.allKpiArray[this.ifKpiExist(kpi.kpiId)]?.trendValueList;
          if (
            trendValueList?.length &&
            (trendValueList[0].hasOwnProperty('filter1') ||
              trendValueList[0].hasOwnProperty('filter2'))
          ) {
            if (this.kpiSelectedFilterObj[kpi?.kpiId]) {
              this.kpiSelectedFilterObj[kpi?.kpiId]['filter' + event.index] = [
                eventValue,
              ];
            } else {
              this.kpiSelectedFilterObj[kpi?.kpiId] = {};
              this.kpiSelectedFilterObj[kpi?.kpiId]['filter' + event.index] = [
                eventValue,
              ];
            }
          } else {
            this.kpiSelectedFilterObj[kpi?.kpiId] = [eventValue];
          }
        } else {
          this.kpiSelectedFilterObj[kpi?.kpiId] = [];
          this.kpiSelectedFilterObj[kpi?.kpiId].push(event);
        }
      }

      this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);
      if (kpi?.kpiId === 'kpi171') {
        this.getkpi171Data(kpi?.kpiId);
      } else if (kpi?.kpiId === 'kpi202') {
        this.getkpi202Data(kpi?.kpiId);
      } else {
        this.getChartData(
          kpi?.kpiId,
          this.ifKpiExist(kpi?.kpiId),
          kpi?.kpiDetail?.aggregationCriteria,
          true,
        );
      }
    }
  }

  handleSelectedOptionOnRelease(event, kpi) {
    this.kpiSelectedFilterObj[kpi?.kpiId] = {};
    if (
      event &&
      Object.keys(event)?.length !== 0 &&
      typeof event === 'object'
    ) {
      for (const key in event) {
        if (event[key]?.length == 0) {
          delete event[key];
        }
      }
      this.kpiSelectedFilterObj[kpi?.kpiId] = event;
    } else {
      this.kpiSelectedFilterObj[kpi?.kpiId] = { filter1: [event] };
    }

    this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);

    this.getChartDataforRelease(kpi?.kpiId, this.ifKpiExist(kpi?.kpiId), true);
  }

  handleSelectedOptionOnBacklog(event, kpi) {
    const selectedFilterBackup = this.kpiSelectedFilterObj[kpi?.kpiId];
    this.kpiSelectedFilterObj[kpi?.kpiId] = {};
    /** When we have single dropdown */
    if (
      event &&
      Object.keys(event)?.length !== 0 &&
      typeof event === 'object' &&
      !Array.isArray(event) &&
      !selectedFilterBackup?.hasOwnProperty('filter2')
    ) {
      for (const key in event) {
        if (typeof event[key] === 'string') {
          this.kpiSelectedFilterObj[kpi?.kpiId][key] = [event[key]];
        } else {
          this.kpiSelectedFilterObj[kpi?.kpiId][key] = event[key];
        }
      }
      /** When we have multi dropdown */
    } else if (
      event &&
      Object.keys(event)?.length !== 0 &&
      typeof event === 'object' &&
      !Array.isArray(event) &&
      !Array.isArray(selectedFilterBackup) &&
      selectedFilterBackup.hasOwnProperty('filter2')
    ) {
      const selectedFilter = {};
      for (const key in event) {
        const updatedFilter =
          typeof event[key] === 'string' ? [event[key]] : [...event[key]];
        selectedFilter[key] = updatedFilter;
      }
      this.kpiSelectedFilterObj[kpi?.kpiId] = {
        ...selectedFilterBackup,
        ...selectedFilter,
      };
    } else {
      const updatedValue = Array.isArray(event) ? event : [event];
      this.kpiSelectedFilterObj[kpi?.kpiId] = { filter1: updatedValue };
    }

    this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);

    this.getChartDataForBacklog(
      kpi?.kpiId,
      this.ifKpiExist(kpi?.kpiId),
      kpi?.kpiDetail?.aggregationCriteria,
    );
  }

  handleSelectedOptionForCard(event, kpi) {
    if (
      event &&
      typeof event === 'object' &&
      !Array.isArray(event) &&
      Object.keys(event).length === 0
    ) {
      this.kpiSelectedFilterObj[kpi?.kpiId] = {};
    } else if (event && typeof event === 'object' && !Array.isArray(event)) {
      for (const key in event) {
        if (
          !event[key] ||
          (Array.isArray(event[key]) && event[key].length === 0)
        ) {
          delete event[key];
        }
      }
      this.kpiSelectedFilterObj[kpi?.kpiId] = event;
    } else {
      if (event === 'Overall') {
        this.kpiSelectedFilterObj[kpi?.kpiId] = {};
      } else {
        this.kpiSelectedFilterObj[kpi?.kpiId] = { filter1: [event] };
      }
    }

    this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);

    if (kpi?.kpiId === 'kpi138') {
      this.updateKPI138FilterOptions(kpi?.kpiId);
    }

    this.getChartDataForCard(kpi?.kpiId, this.ifKpiExist(kpi?.kpiId));
  }

  checkMaturity(item) {
    if (item) {
      let maturity = item.maturity;
      if (maturity == undefined) {
        return 'NA';
      }
      maturity = 'M' + maturity;
      return maturity;
    } else {
      return '';
    }
  }

  checkLatestAndTrendValue(kpiData, item) {
    let latest = '';
    let trend = '';
    let unit = '';

    // Filter out forecast data and null entries (used for right-alignment of sprint data)
    const validValues = item?.value?.filter((v) => v != null && !v.isForecast);

    if (validValues?.length > 0) {
      let tempVal;
      if (validValues[validValues?.length - 1]?.dataValue) {
        tempVal = validValues[validValues?.length - 1]?.dataValue.find(
          (d) => d.lineType === 'solid',
        )?.value;
      } else {
        tempVal = validValues[validValues?.length - 1]?.lineValue
          ? validValues[validValues?.length - 1]?.lineValue
          : validValues[validValues?.length - 1]?.value;
      }
      unit =
        kpiData?.kpiDetail?.kpiUnit?.toLowerCase() != 'number' &&
        kpiData?.kpiDetail?.kpiUnit?.toLowerCase() != 'stories' &&
        kpiData?.kpiDetail?.kpiUnit?.toLowerCase() != 'tickets'
          ? kpiData?.kpiDetail?.kpiUnit?.trim()
          : '';
      latest =
        tempVal > 0
          ? Math.round(tempVal * 10) / 10 + (unit ? ' ' + unit : '')
          : tempVal + (unit ? ' ' + unit : '');
    }
    if (validValues?.length > 0 && kpiData?.kpiDetail?.showTrend) {
      if (kpiData?.kpiDetail?.trendCalculative) {
        const lhsKey =
          kpiData?.kpiDetail?.trendCalculation?.length > 0
            ? kpiData?.kpiDetail?.trendCalculation[0]?.lhs
            : '';
        const rhsKey =
          kpiData?.kpiDetail?.trendCalculation?.length > 0
            ? kpiData?.kpiDetail?.trendCalculation[0]?.rhs
            : '';
        const lhs = validValues[validValues?.length - 1][lhsKey];
        const rhs = validValues[validValues?.length - 1][rhsKey];
        const operator = lhs < rhs ? '<' : lhs > rhs ? '>' : '=';
        const trendObj = kpiData?.kpiDetail?.trendCalculation?.find(
          (item) => item.operator == operator,
        );
        if (trendObj) {
          trend =
            trendObj['type']?.toLowerCase() == 'downwards'
              ? '-ve'
              : trendObj['type']?.toLowerCase() == 'upwards'
              ? '+ve'
              : '--';
        } else {
          trend = 'NA';
        }
      } else {
        let lastVal;
        let secondLastVal;
        if (validValues[validValues?.length - 1]?.dataValue) {
          lastVal = validValues[validValues?.length - 1]?.dataValue.find(
            (d) => d.lineType === 'solid',
          )?.value;
          secondLastVal = validValues[validValues?.length - 2]?.dataValue.find(
            (d) => d.lineType === 'solid',
          )?.value;
        } else {
          lastVal = validValues[validValues?.length - 1]?.value;
          secondLastVal = validValues[validValues?.length - 2]?.value;
        }
        const isPositive = kpiData?.kpiDetail?.isPositiveTrend;
        if (secondLastVal > lastVal && !isPositive) {
          trend = '+ve';
        } else if (secondLastVal < lastVal && !isPositive) {
          trend = '-ve';
        } else if (secondLastVal < lastVal && isPositive) {
          trend = '+ve';
        } else if (secondLastVal > lastVal && isPositive) {
          trend = '-ve';
        } else {
          trend = '--';
        }
      }
    } else {
      trend = 'NA';
    }
    return [latest, trend, unit];
  }

  createTrendsData(kpiId) {
    const enabledKpiObj = this.updatedConfigGlobalData?.filter(
      (x) => x.kpiId == kpiId,
    )[0];
    if (enabledKpiObj && Object.keys(enabledKpiObj)?.length != 0) {
      this.kpiTrendsObj[kpiId] = [];
      if (kpiId != 'kpi17') {
        for (let i = 0; i < this.kpiChartData[kpiId]?.length; i++) {
          if (this.kpiChartData[kpiId][i]?.value?.length > 0) {
            let trendObj = {};
            const [latest, trend, unit] = this.checkLatestAndTrendValue(
              enabledKpiObj,
              this.kpiChartData[kpiId][i],
            );
            this.kpiChartData[kpiId][i].trend = trend;
            if (isNaN(Number(this.kpiChartData[kpiId][i]?.data))) {
              let selectedNode;
              if (this.nonUniqueNames) {
                selectedNode = this.filterData.filter(
                  (x) =>
                    this.appendParent(x) === this.kpiChartData[kpiId][i]?.data,
                );
              } else {
                selectedNode = this.filterData.filter(
                  (x) =>
                    x.nodeDisplayName === this.kpiChartData[kpiId][i]?.data,
                );
              }
              // let selectedId = selectedNode.map((x) => x.nodeId);
              if (selectedNode) {
                trendObj = {
                  hierarchyName: this.kpiChartData[kpiId][i]?.data,
                  hierarchyId: selectedNode[0]?.nodeId,
                  value: latest,
                  trend,
                  maturity:
                    kpiId != 'kpi3' && kpiId != 'kpi53'
                      ? this.checkMaturity(this.kpiChartData[kpiId][i])
                      : 'M' + this.kpiChartData[kpiId][i]?.maturity,
                  maturityValue: this.kpiChartData[kpiId][i]?.maturityValue,
                  kpiUnit: unit,
                };

                if (kpiId === 'kpi997') {
                  trendObj['value'] = 'NA';
                }
                if (
                  !this.kpiTrendsObj[kpiId]
                    .map((x) => x.hierarchyId)
                    .includes(trendObj['hierarchyId'])
                ) {
                  this.kpiTrendsObj[kpiId]?.push(trendObj);
                }
              }
            }
          }
        }
      } else {
        const averageCoverageIdx = this.kpiChartData[kpiId]?.findIndex(
          (x) => x['filter']?.toLowerCase() == 'average coverage',
        );
        if (averageCoverageIdx > -1) {
          let trendObj = {};
          const [latest, trend, unit] = this.checkLatestAndTrendValue(
            enabledKpiObj,
            this.kpiChartData[kpiId][averageCoverageIdx],
          );
          this.kpiChartData[kpiId][averageCoverageIdx].trend = trend;
          const selectedNode = this.filterData.filter(
            (x) =>
              x.nodeDisplayName ===
              this.kpiChartData[kpiId][averageCoverageIdx]?.data,
          );
          const selectedId = selectedNode[0].nodeId;
          trendObj = {
            hierarchyName: this.kpiChartData[kpiId][averageCoverageIdx]?.data,
            hiearchyId: selectedId,
            value: latest,
            trend,
            maturity: this.checkMaturity(
              this.kpiChartData[kpiId][averageCoverageIdx],
            ),
            maturityValue:
              this.kpiChartData[kpiId][averageCoverageIdx]?.maturityValue,
            kpiUnit: unit,
          };
          this.kpiTrendsObj[kpiId]?.push(trendObj);
        }
      }
      const idx = this.allKpiArray.findIndex((x) => x.kpiId == kpiId);
      this.getTableData(kpiId, idx, enabledKpiObj);
    }
  }

  appendParent(node) {
    const completeHierarchyData = JSON.parse(
      localStorage.getItem('completeHierarchyData'),
    )[this.selectedtype];
    const parent = this.completeFilterData[
      completeHierarchyData.find((x) => x.level === node.level - 1)
        .hierarchyLevelName
    ].filter((x) => {
      return x.nodeId === node['parentId'];
    })[0];

    if (parent) {
      return node.nodeDisplayName + ' (' + parent.nodeDisplayName + ')';
    } else {
      return node.nodeDisplayName;
    }
  }

  fillKPIResponseCode(data) {
    Object.keys(data).forEach((key) => {
      this.kpiStatusCodeArr[key] = data[key].responseCode;
    });
  }

  checkSelectedNodeId(nodeId) {
    if (
      this.service
        .getSelectedTrends()
        .map((x) => x.nodeId)
        .includes(nodeId)
    ) {
      return true;
    } else {
      return false;
    }
  }

  getKpiCommentsCount(kpiId?) {
    const requestObj = {
      nodes: [...this.filterApplyData?.['selectedMap']['project']],
      level: this.filterApplyData?.level,
      nodeChildId: '',
      kpiIds: [],
    };
    if (kpiId) {
      requestObj['kpiIds'] = [kpiId];
      this.helperService.getKpiCommentsHttp(requestObj).then((res: object) => {
        this.kpiCommentsCountObj[kpiId] = res[kpiId];
      });
    } else {
      requestObj['kpiIds'] = this.updatedConfigGlobalData?.map(
        (item) => item.kpiId,
      );
      if (requestObj['kpiIds']?.length) {
        this.helperService
          .getKpiCommentsHttp(requestObj)
          .then((res: object) => {
            this.kpiCommentsCountObj = res;
          });
      }
    }
  }

  reloadKPI(event) {
    const idx = this.ifKpiExist(event?.kpiDetail?.kpiId);
    if (idx !== -1) {
      this.allKpiArray.splice(idx, 1);
    }
    // When kpi202 is reloaded (e.g. after field mapping save), reset the workflow
    // order fetch flag so the updated chip order is re-fetched and re-applied.
    if (event?.kpiDetail?.kpiId === 'kpi202') {
      this.kpi202WorkflowOrderFetched = false;
    }
    const currentKPIGroup = this.helperService.groupKpiFromMaster(
      event?.kpiDetail?.kpiSource,
      event?.kpiDetail?.kanban,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      [event?.kpiDetail?.kpiId],
      event.kpiDetail?.groupId,
      this.selectedTab,
    );
    this.kpiLoader.add(event?.kpiDetail?.kpiId);
    if (currentKPIGroup?.kpiList?.length > 0) {
      const kpiSource = event.kpiDetail?.kpiSource?.toLowerCase();
      let kpiIdsForCurrentBoard;
      if (this.service.getSelectedType().toLowerCase() === 'kanban') {
        kpiIdsForCurrentBoard = this.configGlobalData
          ?.filter((kpi) => kpi.kpiDetail.groupId === event.kpiDetail.groupId)
          .map((kpiDetails) => kpiDetails.kpiId);
        switch (kpiSource) {
          case 'sonar':
            this.groupSonarKanbanKpi(kpiIdsForCurrentBoard);
            break;
          case 'jenkins':
            this.groupJenkinsKanbanKpi(kpiIdsForCurrentBoard);
            break;
          case 'zypher':
            this.groupZypherKanbanKpi(kpiIdsForCurrentBoard);
            break;
          case 'bitbucket':
            this.groupBitBucketKanbanKpi(kpiIdsForCurrentBoard);
            break;
          default:
            this.groupJiraKanbanKpi(kpiIdsForCurrentBoard);
        }
      } else {
        switch (kpiSource) {
          case 'sonar':
            /** Temporary Fix,  sending all KPI in kpiList when refreshing kpi after field mapping change*/
            /** Todo : Need to rework when BE cache issue will be fixed */
            // this.postSonarKpi(currentKPIGroup, 'sonar');
            kpiIdsForCurrentBoard = this.configGlobalData
              ?.filter(
                (kpi) => kpi.kpiDetail.groupId === event.kpiDetail.groupId,
              )
              .map((kpiDetails) => kpiDetails.kpiId);
            this.groupSonarKpi(kpiIdsForCurrentBoard);
            break;
          case 'jenkins':
            /** Temporary Fix,  sending all KPI in kpiList when refreshing kpi after field mapping change*/
            /** Todo : Need to rework when BE cache issue will be fixed */
            // this.postJenkinsKpi(currentKPIGroup, 'jenkins');
            kpiIdsForCurrentBoard = this.configGlobalData
              ?.filter(
                (kpi) => kpi.kpiDetail.groupId === event.kpiDetail.groupId,
              )
              .map((kpiDetails) => kpiDetails.kpiId);
            this.groupJenkinsKpi(kpiIdsForCurrentBoard);
            break;
          case 'zypher':
            /** Temporary Fix,  sending all KPI in kpiList when refreshing kpi after field mapping change*/
            /** Todo : Need to rework when BE cache issue will be fixed */
            // this.postZypherKpi(currentKPIGroup, 'zypher');
            kpiIdsForCurrentBoard = this.configGlobalData
              ?.filter(
                (kpi) => kpi.kpiDetail.groupId === event.kpiDetail.groupId,
              )
              .map((kpiDetails) => kpiDetails.kpiId);
            this.groupZypherKpi(kpiIdsForCurrentBoard);
            break;
          case 'bitbucket':
            /** Temporary Fix,  sending all KPI in kpiList when refreshing kpi after field mapping change*/
            /** Todo : Need to rework when BE cache issue will be fixed */
            // this.postBitBucketKpi(currentKPIGroup, 'bitbucket');
            kpiIdsForCurrentBoard = this.configGlobalData
              ?.filter(
                (kpi) => kpi.kpiDetail.groupId === event.kpiDetail.groupId,
              )
              .map((kpiDetails) => kpiDetails.kpiId);
            this.groupBitBucketKpi(kpiIdsForCurrentBoard);
            break;
          default:
            /** Temporary Fix,  sending all KPI in kpiList when refreshing kpi after field mapping change*/
            /** Todo : Need to rework when BE cache issue will be fixed */
            // this.postJiraKpi(currentKPIGroup, 'jira');
            kpiIdsForCurrentBoard = this.configGlobalData
              ?.filter(
                (kpi) => kpi.kpiDetail.groupId === event.kpiDetail.groupId,
              )
              .map((kpiDetails) => kpiDetails.kpiId);
            this.groupJiraKpi(kpiIdsForCurrentBoard);
        }
      }
    }
  }

  handleMaturityTableLoader() {
    const currentMaturityTableKpiList = this.kpiTableDataObj[
      Object.keys(this.kpiTableDataObj)[0]
    ]?.map((data) => data.kpiId);
    let loader = true;
    this.maturityTableKpiList?.forEach((kpi) => {
      const idx = this.ifKpiExist(kpi);
      const idx2 = currentMaturityTableKpiList?.findIndex((kpi) => kpi === kpi);
      if (idx2 === -1 || idx === -1) {
        loader = false;
      }
    });
    if (
      currentMaturityTableKpiList &&
      currentMaturityTableKpiList.length > 0 &&
      loader
    ) {
      this.service.setMaturiyTableLoader(false);
    } else {
      this.service.setMaturiyTableLoader(true);
    }
  }

  coundMaxNoOfSprintSelectedForProject($event) {
    let maxSprints = 0;
    if ($event.filterApplyData?.selectedMap?.sprint?.length) {
      const sprintCount = new Map();
      $event.filterApplyData?.selectedMap?.sprint.forEach((node) => {
        const projectId = node.substring(node.lastIndexOf('_') + 1);
        sprintCount.set(projectId, (sprintCount.get(projectId) || 0) + 1);
      });
      maxSprints = Math.max(...sprintCount.values());
    } else {
      maxSprints = $event?.configDetails?.sprintCountForKpiCalculation;
    }
    return maxSprints;
  }

  /**
   * Calculates the number of business days between two Date objects, inclusive.
   * Business days are defined as weekdays (Monday to Friday), excluding weekends.
   * Returns 0 if the second date is earlier than the first date.
   *
   * @param dDate1 - The start date as a Date object.
   * @param dDate2 - The end date as a Date object.
   * @returns The number of business days between the two dates.
   * @throws Returns 0 if dDate2 is earlier than dDate1.
   */
  calcBusinessDays(dDate1, dDate2) {
    // input given as Date objects
    let iDateDiff;
    let iAdjust = 0;
    if (dDate2 < dDate1) {
      return 0;
    } // error code if dates transposed
    let iWeekday1 = new Date(dDate1).getDay(); // day of week
    let iWeekday2 = new Date(dDate2).getDay();
    iWeekday1 = iWeekday1 == 0 ? 7 : iWeekday1; // change Sunday from 0 to 7
    iWeekday2 = iWeekday2 == 0 ? 7 : iWeekday2;
    if (iWeekday1 > 5 && iWeekday2 > 5) {
      iAdjust = 1;
    } // adjustment if both days on weekend
    iWeekday1 = iWeekday1 > 5 ? 5 : iWeekday1; // only count weekdays
    iWeekday2 = iWeekday2 > 5 ? 5 : iWeekday2;

    // calculate differnece in weeks (1000mS * 60sec * 60min * 24hrs * 7 days = 604800000)
    const iWeeks = Math.floor(
      (new Date(dDate2).getTime() - new Date(dDate1).getTime()) / 604800000,
    );

    if (iWeekday1 <= iWeekday2) {
      //Equal to makes it reduce 5 days
      iDateDiff = iWeeks * 5 + (iWeekday2 - iWeekday1);
    } else {
      iDateDiff = (iWeeks + 1) * 5 - (iWeekday1 - iWeekday2);
    }

    iDateDiff -= iAdjust; // take into account both days on weekend
    const total = iDateDiff + 1; // add 1 because dates are inclusive (counting today date)
    return Math.max(0, total - 2); // need to exlcude today date and last date
  }

  /**
   * Checks the Y-axis label for a given KPI based on its trend data and selected filters.
   * @param {Object} kpi - The KPI object containing kpiId and other details.
   * @returns {string | undefined} - The Y-axis label if found; otherwise, the default Y-axis label from kpiDetail.
   */
  checkYAxis(kpi) {
    const kpiDataResponce = this.allKpiArray?.find(
      (de) => de.kpiId === kpi.kpiId,
    );
    const selectedFilterVal = this.kpiSelectedFilterObj[kpi?.kpiId];
    if (
      kpiDataResponce &&
      kpiDataResponce?.trendValueList &&
      Array.isArray(kpiDataResponce?.trendValueList) &&
      selectedFilterVal
    ) {
      const trendData = kpiDataResponce.trendValueList?.find((data) => {
        const kpiFIlter = data.filter || data.filter1;
        const selectedFilter = selectedFilterVal.filter1
          ? selectedFilterVal.filter1[0]
          : selectedFilterVal[0];
        return kpiFIlter === selectedFilter;
      });
      if (
        trendData &&
        Object.keys(trendData).length > 1 &&
        trendData?.yaxisLabel
      ) {
        return trendData.yaxisLabel;
      }
    }
    return kpi?.kpiDetail?.yaxisLabel;
  }

  /**
   * Determines the CSS class for column width based on the provided KPI width percentage.
   * Accepts specific width values and defaults to 50% if an unrecognized value is given.
   * @param kpiwidth - The width percentage (100, 50, 66, 33) to determine the column class.
   * @returns A string representing the corresponding CSS class for the column width.
   * No exceptions are thrown.
   */
  getkpiwidth(kpiwidth) {
    let retValue = '';

    switch (kpiwidth) {
      case 100:
        retValue = 'p-col-12';
        break;
      case 50:
        retValue = 'p-col-6';
        break;
      case 66:
        retValue = 'p-col-8';
        break;
      case 33:
        retValue = 'p-col-4';
        break;
      default:
        retValue = 'p-col-6';
        break;
    }

    return retValue;
  }

  checkKPIPresence(kpi) {
    if (this.tabsArr.size > 1) {
      return (
        this.selectedKPITab === kpi.kpiDetail?.kpiSubCategory &&
        kpi['isEnabled']
      );
    } else {
      return kpi['isEnabled'];
    }
  }

  getSprintGoalData() {
    const kpiJiraTest = this.helperService.groupKpiFromMaster(
      'Jira',
      false,
      this.updatedConfigGlobalData,
      this.filterApplyData,
      this.filterData,
      ['kpi189'],
      25,
      '',
    );
    kpiJiraTest.kpiList = [
      {
        kpiId: 'kpi189',
        kpiName: 'Sprint Goals',
        isDeleted: 'False',
        defaultOrder: 31,
        kpiUnit: '',
        showTrend: false,
        calculateMaturity: false,
        hideOverallFilter: false,
        kpiSource: 'Jira',
        combinedKpiSource: 'Jira/Azure',
        kanban: false,
        groupId: 32,
        kpiInfo: {
          details: [
            {
              type: 'paragraph',
              value: 'KPI for tracking Goals of project.',
            },
            {
              type: 'link',
              kpiLinkDetail: {
                text: 'Detailed Information at',
                link: 'https://knowhow.tools.publicis.sapient.com/wiki/kpi189-Sprint+Goals',
              },
            },
          ],
        },
        trendCalculative: false,
        isAdditionalFilterSupport: false,
        chartType: '',
      },
    ];
    if (
      this.selectedtype === 'scrum' &&
      ['my-knowhow', 'speed', 'quality'].includes(
        this.selectedTab?.toLocaleLowerCase(),
      )
    ) {
      this.postJiraKpi(kpiJiraTest, 'jira', false);
    }
  }

  stripTime(date) {
    if (date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } else {
      return date;
    }
  }

  utcToLocalUser(data, xAxis) {
    if (data && data?.length) {
      return this.helperService.getFormatedDateBasedOnType(data, xAxis);
    }
    return data;
  }

  private handlePageScrollOnSearch(searchValue) {
    if (searchValue) {
      this.scrollToHighlightedKpi(searchValue.value.kpiId);
    }
  }

  scrollToHighlightedKpi(kpiId) {
    const element = document.getElementById(kpiId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      this.renderer2.addClass(element, 'highlighted');

      setTimeout(() => {
        this.renderer2.removeClass(element, 'highlighted');
      }, 1500);
    }
  }

  goToRecommendation() {
    if (this.recommendationsComponent) {
      this.recommendationsComponent.nativeElement.children[0].firstChild.focus();
      // this.recommendationsComponent.nativeElement.scrollIntoView({
      //   behaviour: 'smooth',
      //   block: 'start',
      // });
    }
  }

  onFocusGoToRecommendation(event) {
    (event.target as HTMLElement).classList.remove('sr-only');
  }

  onBlurGoToRecommendation(event) {
    (event.target as HTMLElement).classList.add('sr-only');
  }

  private initializeUserDetails(): void {
    const currentUserDetails = localStorage.getItem('currentUserDetails');
    if (currentUserDetails) {
      const userDetails = JSON.parse(currentUserDetails);
      this.floatingRecommendation = [
        'ROLE_SUPERADMIN',
        'ROLE_PROJECT_ADMIN',
      ].some((role) => userDetails.authorities?.includes(role));
    }
  }

  transformJSONForSQVTable(data) {
    // Prepare columns and rows
    const cols: { header: string; field: string }[] = [];
    const rows: any[] = [];

    data?.forEach((projectEntry) => {
      const row: any = {};

      projectEntry.value.forEach((metric) => {
        const key = metric.subFilter;
        row[key] = metric.dataValue;
        row['sprojectName'] = metric.sprojectName;

        if (!cols.find((col) => col.field === key)) {
          cols.push({
            header: key,
            field: key,
          });
        }
      });

      rows.push(row);
    });

    return { data: rows, columnHeaders: cols };
  }

  getkpi171Data(kpiId) {
    let durationChanged = false;
    const duration = Array.isArray(this.durationFilter)
      ? this.durationFilter[0]
      : this.durationFilter;
    if (
      this.kpiSelectedFilterObj[kpiId].hasOwnProperty('filter1') &&
      this.kpiSelectedFilterObj[kpiId]['filter1'][0] !== duration
    ) {
      durationChanged = true;
      this.kpiChartData[kpiId] = [];
      this.durationFilter = JSON.parse(
        JSON.stringify(this.kpiSelectedFilterObj[kpiId]['filter1'][0]),
      );
      this.kpiSelectedFilterObj['durationFilter'] = this.durationFilter;
      this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);
    }

    // if duration filter (filter1) changes,  make an api call to fetch data
    if (durationChanged) {
      this.kpiSelectedFilterObj[kpiId]['filter2'] = null;
      const idx = this.ifKpiExist(kpiId);

      const gID = this.allKpiArray[idx].groupId;
      const kpi171Payload = this.updatedConfigGlobalData
        ?.filter((kpiDetails) => kpiDetails.kpiDetail.groupId === gID)
        .map((d) => d.kpiId);
      const groupIdSet = new Set();
      groupIdSet.add(gID);

      // sending requests after grouping the the KPIs according to group Id
      groupIdSet.forEach((groupId) => {
        if (groupId) {
          this.kpiJira = this.helperService.groupKpiFromMaster(
            'Jira',
            false,
            this.updatedConfigGlobalData,
            this.filterApplyData,
            this.filterData,
            kpi171Payload,
            groupId,
            '',
          );
          const kpi171 = this.kpiJira.kpiList.filter(
            (kpi) => kpi.kpiId === 'kpi171',
          )[0];
          if (kpi171) {
            kpi171['filterDuration'] = this.appendFilterDuratioKpi171();
            this.kpiJira.kpiList = [kpi171];
            this.kpiLoader.add('kpi171');

            this.httpService.postKpi(this.kpiJira, 'jira').subscribe((data) => {
              this.setupSearchQuerySubscription();
              const kpi171Data = data.find((kpi) => kpi.kpiId === kpiId);
              if (idx !== -1) {
                this.allKpiArray.splice(idx, 1);
              }
              this.allKpiArray.push(kpi171Data);
              this.getChartData(kpiId, this.ifKpiExist(kpiId), '');
              this.kpiLoader.delete('kpi171');
            });
          }
        }
      });
    } else {
      this.getChartData(kpiId, this.ifKpiExist(kpiId), '');
    }
  }

  appendFilterDuratioKpi171(): any {
    this.durationFilter =
      this.service.getKpiSubFilterObj()?.['durationFilter'] ||
      this.kpiSelectedFilterObj?.['kpi171']?.filter1 ||
      'Past 6 Months';
    const durationFilter = Array.isArray(this.durationFilter)
      ? this.durationFilter[0]
      : this.durationFilter;
    return {
      duration: durationFilter?.includes('Week') ? 'WEEKS' : 'MONTHS',
      value: !isNaN(+durationFilter.split(' ')[1])
        ? +durationFilter.split(' ')[1]
        : 1,
    };
  }

  onKpi202ViewChange(selectedView: string): void {
    this.kpi202Switching = true;
    // Yield one tick so Angular renders the skeleton before mounting the heavy chart
    setTimeout(() => {
      this.kpi202SelectedView = selectedView;
      this.kpi202Switching = false;
    }, 0);
  }

  getkpi202Data(kpiId) {
    let durationChanged = false;
    const duration = Array.isArray(this.durationFilterKpi202)
      ? this.durationFilterKpi202[0]
      : this.durationFilterKpi202;
    if (
      this.kpiSelectedFilterObj[kpiId].hasOwnProperty('filter1') &&
      this.kpiSelectedFilterObj[kpiId]['filter1'][0] !== duration
    ) {
      durationChanged = true;
      this.kpiChartData[kpiId] = [];
      this.durationFilterKpi202 = JSON.parse(
        JSON.stringify(this.kpiSelectedFilterObj[kpiId]['filter1'][0]),
      );
      this.kpiSelectedFilterObj['durationFilterKpi202'] =
        this.durationFilterKpi202;
      this.service.setKpiSubFilterObj(this.kpiSelectedFilterObj);
    }

    if (durationChanged) {
      this.kpiSelectedFilterObj[kpiId]['filter2'] = null;
      const idx = this.ifKpiExist(kpiId);

      const gID = this.allKpiArray[idx].groupId;
      const kpi202Payload = this.updatedConfigGlobalData
        ?.filter((kpiDetails) => kpiDetails.kpiDetail.groupId === gID)
        .map((d) => d.kpiId);
      const groupIdSet = new Set();
      groupIdSet.add(gID);

      groupIdSet.forEach((groupId) => {
        if (groupId) {
          this.kpiJira = this.helperService.groupKpiFromMaster(
            'Jira',
            false,
            this.updatedConfigGlobalData,
            this.filterApplyData,
            this.filterData,
            kpi202Payload,
            groupId,
            '',
          );
          const kpi202 = this.kpiJira.kpiList.filter(
            (kpi) => kpi.kpiId === 'kpi202',
          )[0];
          if (kpi202) {
            kpi202['filterDuration'] = this.appendFilterDurationKpi202();
            this.kpiJira.kpiList = [kpi202];
            this.kpiLoader.add('kpi202');

            this.httpService.postKpi(this.kpiJira, 'jira').subscribe((data) => {
              this.setupSearchQuerySubscription();
              const kpi202Data = data.find((kpi) => kpi.kpiId === kpiId);
              if (idx !== -1) {
                this.allKpiArray.splice(idx, 1);
              }
              this.allKpiArray.push(kpi202Data);
              this.kpiDropdowns[kpiId] = Object.values(kpi202Data?.filters);
              this.kpiSelectedFilterObj[kpiId]['filter2'] = this.kpiDropdowns[
                kpiId
              ][1]?.options?.length
                ? [this.kpiDropdowns[kpiId][1]?.options[0]]
                : [];
              this.getChartData(kpiId, this.ifKpiExist(kpiId), '');
              this.kpiLoader.delete('kpi202');
              // Recompute the aggregated line chart for the Cycle Time Workflows widget
              this.computeKpi202DuplicateChartData();
            });
          }
        }
      });
    } else {
      this.getChartData(kpiId, this.ifKpiExist(kpiId), '');
      // Recompute the aggregated line chart for the Cycle Time Workflows widget
      this.computeKpi202DuplicateChartData();
    }
  }

  /**
   * Fetches the saved workflow group order from field mapping for kpi202
   * and caches it in localStorage keyed by projectId.
   * Called once per project selection when kpi202 data first arrives.
   */
  fetchAndCacheKpi202WorkflowOrder(): void {
    const projectId =
      this.service.getSelectedTrends()?.[0]?.basicProjectConfigId;
    if (!projectId) return;

    const cacheKey = `kpi202_workflow_order_${projectId}`;

    // Restore from localStorage immediately so the chart can use it right away
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        this.kpi202WorkflowOrder = JSON.parse(cached);
      } catch {
        this.kpi202WorkflowOrder = [];
      }
    }

    // Always re-fetch from backend to stay in sync with latest saved order
    this.httpService
      .getKPIFieldMappingConfig(`${projectId}/kpi202`)
      .subscribe((configResp: any) => {
        if (!configResp?.success) return;
        const toolId = configResp.data?.projectToolConfigId;
        if (!toolId) return;

        this.httpService
          .getFieldMappingsWithHistory(toolId, 'kpi202', {
            releaseNodeId: null,
          })
          .subscribe((mappingResp: any) => {
            if (!mappingResp?.success) return;
            const responses: any[] =
              mappingResp.data?.fieldMappingResponses || [];

            // Find the field whose value is an array of { label, statuses } objects
            // This is the workflow groups trigger field
            const workflowField = responses.find(
              (f: any) =>
                Array.isArray(f.originalValue) &&
                f.originalValue.length > 0 &&
                f.originalValue[0]?.hasOwnProperty('label') &&
                f.originalValue[0]?.hasOwnProperty('statuses'),
            );

            if (workflowField?.originalValue?.length) {
              const order: string[] = workflowField.originalValue.map(
                (entry: any) => entry.label,
              );
              this.kpi202WorkflowOrder = order;
              localStorage.setItem(cacheKey, JSON.stringify(order));
              // Re-render the chart with the correct order
              this.computeKpi202DuplicateChartData();
            }
          });
      });
  }

  /**
   * Aggregates kpiChartData['kpi202'] into a line-chart-compatible format
   * for the 'Cycle Time Workflows' duplicate widget (kpi202_duplicate).
   *
   * Each data point on the line chart represents a workflow stage (e.g. DOR,
   * Development, QA). Its Y-value is the sum of all matching dataValue entries
   * across every story item in the currently filtered kpi202 data.
   */
  computeKpi202DuplicateChartData(): void {
    const kpi202Data = this.kpiChartData['kpi202'];
    if (!kpi202Data || !Array.isArray(kpi202Data) || kpi202Data.length === 0) {
      this.kpiChartData['kpi202_duplicate'] = [];
      return;
    }
    const filter2Arr = this.kpiSelectedFilterObj?.['kpi202']?.filter2;
    const filterTypeLabel =
      filter2Arr && filter2Arr.length > 0 ? filter2Arr[0] : 'Item';

    // Aggregate dataValue entries by workflow name
    const aggregatedMap = new Map<
      string,
      { total: number; count: number; filterType: string }
    >();
    kpi202Data.forEach((project: any) => {
      (project?.value || []).forEach((item: any) => {
        (item?.dataValue || []).forEach((dv: any) => {
          if (dv?.name) {
            const current = aggregatedMap.get(dv.name) || {
              total: 0,
              count: 0,
              filterType: filterTypeLabel,
            };
            aggregatedMap.set(dv.name, {
              total: current.total + (Number(dv.value) || 0),
              count: current.count + 1,
              filterType: filterTypeLabel,
            });
          }
        });
      });
    });
    // Build multiline-v2 compatible data structure
    const defaultColors = [
      '#3498db',
      '#2ecc71',
      '#e74c3c',
      '#f39c12',
      '#9b59b6',
      '#34495e',
    ];

    const lineValues = Array.from(aggregatedMap.entries()).map(
      ([name, data], index) => ({
        sSprintName: name,
        value: Math.round(data.total * 100) / 100,
        count: data.count,
        filterType: data.filterType,
        hoverValue: {},
        xOrder: name,
        xAxisTick: name,
        color: defaultColors[index % defaultColors.length],
      }),
    );

    // Apply saved workflow order if available
    if (this.kpi202WorkflowOrder?.length) {
      lineValues.sort((a, b) => {
        const ai = this.kpi202WorkflowOrder.indexOf(a.sSprintName);
        const bi = this.kpi202WorkflowOrder.indexOf(b.sSprintName);
        // Unknown names go to the end
        const aIdx = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const bIdx = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        return aIdx - bIdx;
      });
      // Re-assign colors after sorting so they stay consistent with position
      lineValues.forEach((v, i) => {
        v.color = defaultColors[i % defaultColors.length];
      });
    }
    this.kpiChartData['kpi202_duplicate'] = [
      {
        data: 'Cycle Time Workflows',
        value: lineValues,
      },
    ];
    this.kpiStatusCodeArr['kpi202_duplicate'] = '200';
  }

  appendFilterDurationKpi202(): any {
    this.durationFilterKpi202 =
      this.service.getKpiSubFilterObj()?.['durationFilterKpi202'] ||
      this.kpiSelectedFilterObj?.['kpi202']?.filter1 ||
      'Past 6 Months';
    const durationFilter = Array.isArray(this.durationFilterKpi202)
      ? this.durationFilterKpi202[0]
      : this.durationFilterKpi202;

    const match = durationFilter ? String(durationFilter).match(/\d+/) : null;
    const value = match ? parseInt(match[0], 10) : 1;

    return {
      duration: durationFilter?.toLowerCase().includes('week')
        ? 'WEEKS'
        : 'MONTHS',
      value: value,
    };
  }

  performanceSummary(postData) {
    const data = postData;
    data.kpiList = [];
    this.httpService.getPerformanceSummary(data).subscribe({
      next: (response) => {
        this.perfSummaryLoader = false;
        if (response && response.success) {
          this.allPerformanceSummaryData = response.data;
          this.filterPerformanceSummaryData();
        } else {
          this.allPerformanceSummaryData = [];
          this.filteredBranchData = [];
          console.error('Missing Configuration');
        }
      },
      error: (error) => {
        this.perfSummaryLoader = false;
        this.allPerformanceSummaryData = [];
        this.filteredBranchData = [];
        console.error('Error fetching performance summary', error);
      },
    });
  }

  private filterPerformanceSummaryData() {
    this.selectedDateFilterValue = this.service.getSelectedDateRange();
    if (this.currentBranch && this.allPerformanceSummaryData?.length) {
      this.filteredBranchData = this.allPerformanceSummaryData.find(
        (item) => item.label === this.currentBranch,
      );
    }
  }
}
