import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Message } from 'primeng/api';
import { DatePipe, Location } from '@angular/common';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { SharedService } from 'src/app/services/shared.service';
import { MetricsService } from 'src/app/services/metrics.service';
import { DynamicCurrencyPipe } from 'src/app/shared-module/pipes/dynamic-currency/dynamic-currency.pipe';
import { ActivatedRoute } from '@angular/router';

interface CategoryVariations {
  speed: number;
  quality: number;
  efficiency: number;
  productivity: number;
}
@Component({
  selector: 'app-peb-calculator',
  templateUrl: './peb-calculator.component.html',
  styleUrls: ['./peb-calculator.component.css'],
  providers: [DatePipe, DynamicCurrencyPipe],
})
export class PebCalculatorComponent implements OnInit, OnDestroy {
  pebForm: FormGroup;
  durationOptions = [
    { label: 'Per Month', value: 'per month' },
    { label: 'Per Quarter', value: 'per quarter' },
    { label: 'Per Year', value: 'per year' },
  ];

  aiBenefit = 29524;

  showResults: boolean = false;
  annualPEB: number = 0;

  messages: Message[] | undefined;
  @Input() showLoader: boolean = false;
  isError: boolean = false;
  errorMessage: string = '';
  items: any[] = [];
  pebProductivityTrendData: any = {};
  tableColumnData: any = {};
  tableColumnForm: any = {};
  filteredColumn: string = '';

  performanceChartData: Array<object> = [];
  costSavingsChartData: Array<object> = [];
  subscription = [];
  selectedLevel: string = '';
  categoryVariations: CategoryVariations | null = null;
  isLoadingPebData: boolean = true;
  private pendingApiCalls: number = 0;
  productivityGain: any = {};
  xAxisLabel: string = '';
  userCurrency = '';
  userLocale = navigator.language || 'en-US';
  sub$: Subscription;
  queryParamsSubscription!: Subscription;
  selectedTab = '';
  appConfig: any;

  constructor(
    private fb: FormBuilder,
    public sharedService: SharedService,
    public httpService: HttpService,
    private datePipe: DatePipe,
    private dynamicCurrencyPipe: DynamicCurrencyPipe,
    private route: ActivatedRoute,
    private location: Location,
    private cdr: ChangeDetectorRef,
    private metricsService: MetricsService,
  ) {
    this.userCurrency = 'EUR'; // Default to EUR, but keep detectCurrency for future use
    this.appConfig = this.sharedService.getConfigurationDetails();

    this.pebForm = this.fb.group({
      devCountControl: [this.appConfig?.totalTeamSize || 30],
      devCostControl: [this.appConfig?.avgCostPerTeamMember || 10000],
      durationControl: [
        this.appConfig?.timeDuration?.toLowerCase() || 'per year',
      ],
    });
  }

  /**
   * Initializes the component by setting up value change subscriptions for developer count and cost controls.
   * Sets up circular value updates for both controls while preventing infinite loops using emitEvent: false.
   * @memberof PebCalculatorComponent
   * @lifecycle Angular
   */

  ngOnInit() {
    this.metricsService.trackPebPageView();
    this.setupPebTracking();
    this.queryParamsSubscription = this.route.queryParams
      // .pipe(first())
      .subscribe((params) => {
        // let stateFiltersParam = params['stateFilters'];
        // const kpiFiltersParam = params['kpiFilters'];
        const tabParam = params['selectedTab'];
        if (!tabParam) {
          if (!this.sharedService.getSelectedTab()) {
            let selectedTab = decodeURIComponent(this.location.path());
            selectedTab = selectedTab?.split('/')[2]
              ? selectedTab?.split('/')[2]
              : 'iteration';
            selectedTab = selectedTab?.split(' ').join('-').toLowerCase();
            this.selectedTab = selectedTab.split('?statefilters=')[0];
            this.sharedService.setSelectedBoard(this.selectedTab);
          } else {
            this.selectedTab = this.sharedService.getSelectedTab();
            this.sharedService.setSelectedBoard(this.selectedTab);
          }
        } else {
          this.selectedTab = tabParam;
          this.sharedService.setSelectedBoard(this.selectedTab);
        }
      });

    this.subscription.push(
      this.sharedService.passDataToDashboard
        .pipe(
          distinctUntilChanged(
            (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr),
          ),
        )
        .subscribe((sharedobject) => {
          if (sharedobject) {
            const stateFilters =
              this.sharedService.getBackupOfFilterSelectionState();
            this.appConfig = this.sharedService.getConfigurationDetails();
            this.pebForm = this.fb.group({
              devCountControl: [this.appConfig?.totalTeamSize || 30],
              devCostControl: [this.appConfig?.avgCostPerTeamMember || 10000],
              durationControl: [
                this.appConfig?.timeDuration?.toLowerCase() || 'per year',
              ],
            });
            this.selectedLevel = stateFilters?.parent_level;
            this.startLoading();
            this.getPEBData();
            this.getPebProjectPerformanceData(this.selectedLevel);
            this.getAiUasgestatsDetails(this.selectedLevel);
          }
        }),
    );
  }

  /**
   * Calculates the Productivity Economic Benefit (PEB) based on form inputs and hierarchy data.
   *
   * This method performs the following operations:
   * 1. Retrieves hierarchy data and selected level from localStorage
   * 2. Constructs request payload with label, level and parentId
   * 3. Gets response data after home component initializes (where the HTTP call is happening) to get productivity gain data
   * 4. Calculates ROI metrics and annual PEB based on the response
   *
   * The calculation considers:
   * - Developer count
   * - Developer cost
   * - Duration (month/quarter/year)
   * - Productivity gain percentages for different metrics
   *
   * Shows loading and error messages during the process.
   * Updates the roiMetrics array and annualPEB property with calculated values.
   *
   * @throws Will display an error message if productivity gain data fetch fails
   */
  private pebStartTime: number = 0;
  private scrollTracked: Set<string> = new Set();

  private setupPebTracking(): void {
    this.pebStartTime = Date.now();

    // Track scroll
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleScroll(): void {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    const thresholds = ['25', '50', '75', '100'];
    for (const threshold of thresholds) {
      if (
        scrollPercent >= parseInt(threshold) &&
        !this.scrollTracked.has(threshold)
      ) {
        this.scrollTracked.add(threshold);
        this.metricsService.trackPebPageScroll(threshold);
      }
    }
  }

  private startLoading(): void {
    this.pendingApiCalls = 3;
    this.isLoadingPebData = true;
  }

  private completeApiCall(): void {
    this.pendingApiCalls--;
    if (this.pendingApiCalls <= 0) {
      this.isLoadingPebData = false;
    }
  }

  getPEBData() {
    // IMPORTANT --> Added back just to unblock for demo. Will remove later.
    this.httpService
      .getPebProductivityData(this.selectedLevel?.toLowerCase())
      .subscribe({
        next: (response) => {
          if (response['success']) {
            this.showResults = true;
            this.productivityGain = response['data'];
            this.calculatePEB();
            this.errorMessage = '';
            this.completeApiCall();
          } else {
            this.completeApiCall();
            this.isError = true;
            console.error(
              'Server returned unsuccessful response:',
              response['message'],
            );
            this.errorMessage = response['message'];
            return;
          }
        },
        error: (err) => {
          console.error('Failed to fetch productivity gain data', err.message);
          this.completeApiCall();
          this.isError = true;
          this.errorMessage = err['message'];
        },
      });
  }

  calculatePEB() {
    this.metricsService.trackPebCalculate();
    const overallGain = this.productivityGain['details']?.reduce((a, b) => {
      return a + (b['categoryScores']['overall'] || 0);
    }, 0);

    this.annualPEB = this.calculateMultipliedDetails(overallGain);

    const details = this.productivityGain?.details;
    this.items = details.map((item) => ({
      ...item,
      categoryScores: Object.fromEntries(
        Object.entries(item.categoryScores).map(([key, value]) => [
          key,
          this.calculateMultipliedDetails(value as number),
        ]),
      ),
    }));

    // Generate filter data for the table
    this.generateColumnFilterData();
  }

  getPebProjectPerformanceData(level) {
    this.httpService.getPebProductivityDetailsData(level).subscribe({
      next: (response) => {
        // const response = require('src/assets/data/peb-productivity-details.json');
        if (response['success']) {
          this.performanceChartData =
            this.formatCategoryScoresForCumulativeChart(
              response['data']['categoryScores'],
            );
          this.costSavingsChartData =
            this.formatCategoryScoresForCumulativeChart(
              response['data']['categoryScores'],
              true,
              response['data']?.forecasts,
            );

          // Handle case where API returns success but no categoryVariations data
          if (response['data']?.categoryVariations) {
            this.categoryVariations = JSON.parse(
              JSON.stringify(response['data'].categoryVariations),
            ) as CategoryVariations;
          } else {
            this.categoryVariations = null;
            console.warn('No categoryVariations data received from API');
          }
          this.xAxisLabel = response['data']?.temporalGrouping || 'week';
          this.completeApiCall();
        } else {
          console.error(
            'Server returned unsuccessful response:',
            response['message'],
          );
          this.categoryVariations = null;
          this.completeApiCall();
        }
      },
      error: (err) => {
        console.error('Failed to fetch project performance data', err.message);
        this.categoryVariations = null;
        this.completeApiCall();
      },
    });
  }
  /**
   * Formats raw KPI data into the structure required by Chart
   */
  formatCategoryScoresForCumulativeChart(
    categoryScores: any[],
    showOverall?: boolean,
    forecasts?: any[],
  ): any[] {
    if (!categoryScores || categoryScores.length === 0) {
      return [];
    }

    // Find all metric names except the date
    var metrics = [];
    if (showOverall) {
      metrics.push('overall');
    } else {
      metrics = Object.keys(categoryScores[0]).filter(
        (key) => key !== 'temporalGroupingStartDate' && key !== 'overall',
      );
    }

    // Build dataGroup for the chart
    const dataGroup = categoryScores.map((entry) => {
      const values = metrics.map((metric) => ({
        kpiGroup: metric,
        value: entry[metric],
        hoverValue: {
          Metric: metric.toUpperCase(),
          Value: this.dynamicCurrencyPipe.transform(
            this.calculateMultipliedDetails(entry[metric]),
          ),
          Date: this.datePipe.transform(
            entry.temporalGroupingStartDate,
            'dd/MM/yyyy',
          ),
        },
      }));

      return {
        filter: entry.temporalGroupingStartDate, // X-axis value
        value: values,
      };
    });

    const normalizedForecasts = Array.isArray(forecasts) ? forecasts : [];

    const formattedForecasts = normalizedForecasts
      .map((forecast: any) => {
        const value = Number(forecast?.value);

        if (!Number.isFinite(value)) return null;

        return {
          kpiGroup: forecast?.category ?? metrics[0],
          value,
          isForecast: true,
        };
      })
      .filter(Boolean);

    return [
      {
        dataGroup,
        ...(formattedForecasts.length ? { forecasts: formattedForecasts } : {}),
      },
    ];
  }

  calculateMultipliedDetails(value: number): any {
    const devCostControl = this.pebForm.get('devCostControl')?.value;
    const devCountControl = this.pebForm.get('devCountControl')?.value;
    const durationControl =
      this.pebForm.get('durationControl')?.value === 'per month'
        ? 1 / 12
        : this.pebForm.get('durationControl')?.value === 'per quarter'
        ? 1 / 4
        : 1;

    const multipliedDetails = Math.round(
      devCountControl * devCostControl * (value / 100) * durationControl,
    );
    return multipliedDetails;
  }

  getAiUasgestatsDetails(selectedLevel: string): void {
    this.sub$ = this.httpService
      .getAiUsagaStatsDetails(selectedLevel)
      .subscribe({
        next: (res: any) => {
          const summary = res?.data?.summary?.usageSummary;

          const userCount = summary?.userCount;

          if (userCount != null) {
            this.pebForm.patchValue({
              devCountControl: userCount,
            });
          }
          this.completeApiCall();
        },
        error: (err: any) => {
          console.error('Failed to fetch user count', err.message);
          this.completeApiCall();
        },
      });
  }

  detectCurrency(locale: string): string {
    const country = locale.split('-')[1]?.toUpperCase();
    const currencyMap: any = {
      US: 'USD',
      DE: 'EUR',
      FR: 'EUR',
      IN: 'INR',
      GB: 'GBP',
      JP: 'JPY',
      // add more as needed
    };

    return currencyMap[country] || 'USD';
  }

  resetForm() {
    this.pebForm.patchValue({
      devCountControl: this.appConfig?.totalTeamSize || 30,
      devCostControl: this.appConfig?.avgCostPerTeamMember || 10000,
      durationControl:
        this.appConfig?.timeDuration?.toLowerCase() || 'per year',
    });
    this.calculatePEB();
  }

  generateColumnFilterData() {
    if (this.items.length > 0) {
      this.tableColumnData = {};
      this.tableColumnForm = {};

      // Generate filter data for organizationEntityName
      const entityNames = new Map();
      this.items.forEach((item) => {
        const key = item.organizationEntityName;
        if (!entityNames.has(key)) {
          entityNames.set(key, {
            name: key,
            value: key,
          });
        }
      });
      this.tableColumnData['organizationEntityName'] = Array.from(
        entityNames.values(),
      );
      this.tableColumnForm['organizationEntityName'] = [];

      // Generate filter data for categoryScores.overall
      const savingsValues = new Map();
      this.items.forEach((item) => {
        const key = item.categoryScores.overall;
        const displayValue = this.dynamicCurrencyPipe.transform(key, 'value');
        if (!savingsValues.has(key)) {
          savingsValues.set(key, {
            name: displayValue,
            value: key,
          });
        }
      });
      this.tableColumnData['categoryScores.overall'] = Array.from(
        savingsValues.values(),
      );
      this.tableColumnForm['categoryScores.overall'] = [];
    }
  }

  onFilterClick(columnName: string) {
    this.filteredColumn = columnName;
  }

  onFilterBlur(columnName: string) {
    this.filteredColumn =
      this.filteredColumn === columnName ? '' : this.filteredColumn;
  }

  ngOnDestroy() {
    const durationSeconds = Math.floor((Date.now() - this.pebStartTime) / 1000);
    if (durationSeconds > 0) {
      this.metricsService.trackPebActiveTime(durationSeconds);
    }

    window.removeEventListener('scroll', this.handleScroll.bind(this));

    this.subscription.forEach((sub) => sub.unsubscribe()); // Ensure cleanup
    this.sub$?.unsubscribe();
  }
}
