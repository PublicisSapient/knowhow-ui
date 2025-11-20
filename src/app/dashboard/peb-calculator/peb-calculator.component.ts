import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Message } from 'primeng/api';
import { DatePipe } from '@angular/common';
import { distinctUntilChanged } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { SharedService } from 'src/app/services/shared.service';
import { DynamicCurrencyPipe } from 'src/app/shared-module/pipes/dynamic-currency/dynamic-currency.pipe';

interface categoryVariations {
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
export class PebCalculatorComponent implements OnInit {
  pebForm: FormGroup;
  durationOptions = [
    { label: 'Per Month', value: 'month' },
    { label: 'Per Quarter', value: 'quarter' },
    { label: 'Per Year', value: 'year' },
  ];

  aiBenefit = 29524;

  showResults: boolean = false;
  annualPEB: number = 0;

  messages: Message[] | undefined;
  @Input() showLoader: boolean = false;
  isError: boolean = false;
  errorMessage: String = '';
  items: any[] = [];
  // pebProductivityData: any = [];
  //require('src/assets/data/peb-productivity.json')['data'];
  pebProductivityTrendData: any = {};
  //require('src/assets/data/peb-productivity-details.json')['data'];

  performanceChartData: Array<object> = [];
  costSavingsChartData: Array<object> = [];
  subscription = [];
  selectedLevel: string = '';
  categoryVariations: categoryVariations;
  productivityGain: any = {};
  xAxisLabel: string = '';
  currency = 'EUR'; // or from config
  currencySymbol: string;

  constructor(
    private fb: FormBuilder,
    public sharedService: SharedService,
    public httpService: HttpService,
    private datePipe: DatePipe,
    private dynamicCurrencyPipe: DynamicCurrencyPipe,
  ) {
    this.pebForm = this.fb.group({
      devCountControl: [30],
      devCostControl: [100000],
      durationControl: ['year'],
    });
    const locale = navigator.language || 'en-US';
    this.currencySymbol = this.getCurrencySymbol(this.currency, locale);
  }

  /**
   * Initializes the component by setting up value change subscriptions for developer count and cost controls.
   * Sets up circular value updates for both controls while preventing infinite loops using emitEvent: false.
   * @memberof PebCalculatorComponent
   * @lifecycle Angular
   */
  ngOnInit() {
    this.pebForm.get('devCountControl')!.valueChanges.subscribe((v) => {
      this.pebForm.get('devCountControl')!.setValue(v, { emitEvent: false });
    });

    this.pebForm.get('devCostControl')!.valueChanges.subscribe((v) => {
      this.pebForm.get('devCostControl')!.setValue(v, { emitEvent: false });
    });
    this.subscription.push(
      this.sharedService.passDataToDashboard
        .pipe(distinctUntilChanged())
        .subscribe((sharedobject) => {
          if (sharedobject) {
            const stateFilters =
              this.sharedService.getBackupOfFilterSelectionState();
            this.selectedLevel = stateFilters?.parent_level;
            this.getPEBData();
            this.getPebProjectPerformanceData(this.selectedLevel);
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
  getPEBData() {
    this.showLoader = true;

    // IMPORTANT --> Added back just to unblock for demo. Will remove later.
    this.httpService
      .getPebProductivityData(this.selectedLevel?.toLowerCase())
      .subscribe({
        next: (response) => {
          if (response['success']) {
            this.showResults = true;
            this.productivityGain = response['data'];
            this.calculatePEB();
          } else {
            this.showLoader = false;
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
          this.showLoader = false;
          this.isError = true;
          this.errorMessage = err['message'];
        },
      });
  }

  calculatePEB() {
    this.showLoader = true;
    setTimeout(() => {
      const overallGain =
        this.productivityGain['summary']?.categoryScores['overall'];

      this.annualPEB = this.calculateMultipliedDetails(overallGain);
      this.annualPEB = this.annualPEB < 0 ? 0 : this.annualPEB;

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

      this.showLoader = false;
    }, 1000);
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
            );
          this.categoryVariations = JSON.parse(
            JSON.stringify(response['data']?.categoryVariations),
          ) as categoryVariations;
          this.xAxisLabel = response['data']?.temporalGrouping;
        } else {
          console.error(
            'Server returned unsuccessful response:',
            response['message'],
          );
        }
      },
      error: (err) => {
        console.error('Failed to fetch project performance data', err.message);
      },
    });
  }
  /**
   * Formats raw KPI data into the structure required by Chart
   */
  formatCategoryScoresForCumulativeChart(
    categoryScores: any[],
    showOverall?: boolean,
  ): any[] {
    if (!categoryScores || categoryScores.length === 0) return [];

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

    return [
      {
        dataGroup,
      },
    ];
  }

  calculateMultipliedDetails(value: number): any {
    const devCostControl = this.pebForm.get('devCostControl')?.value;
    const devCountControl = this.pebForm.get('devCountControl')?.value;
    const durationControl =
      this.pebForm.get('durationControl')?.value === 'month'
        ? 1 / 12
        : this.pebForm.get('durationControl')?.value === 'quarter'
        ? 1 / 4
        : 1;

    const multipliedDetails = Math.round(
      devCountControl * devCostControl * (value / 100) * durationControl,
    );
    return multipliedDetails;
  }

  getCurrencySymbol(currency: string, locale: string): string {
    return (0)
      .toLocaleString(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/[0-9.,\s]/g, '')
      .trim();
  }

  ngOnDestroy() {
    this.subscription.forEach((sub) => sub.unsubscribe()); // Ensure cleanup
  }
}
