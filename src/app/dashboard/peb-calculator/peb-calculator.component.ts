import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Message } from 'primeng/api';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-peb-calculator',
  templateUrl: './peb-calculator.component.html',
  styleUrls: ['./peb-calculator.component.css'],
})
export class PebCalculatorComponent implements OnInit {
  pebForm: FormGroup;
  durationOptions = [
    { label: 'Per Month', value: 'month' },
    { label: 'Per Quarter', value: 'quarter' },
    { label: 'Per Year', value: 'year' },
  ];

  roiMetrics = [
    {
      label: 'Speed',
      percent: 0,
      value: 0,
      icon: 'pi pi-bolt',
      color: '#d4fbdf',
      elemColor: '#15ba40',
      estValueSavingsLabel: 'Estd. Value from Faster Delivery',
    },
    {
      label: 'Efficiency',
      percent: 0,
      value: 0,
      icon: 'pi pi-chart-line',
      color: '#dee8fc',
      elemColor: '#2f76ff',
      estValueSavingsLabel: 'Estd. Savings from Reduced Rework',
    },
    {
      label: 'Quality',
      percent: 0,
      value: 0,
      icon: 'pi pi-shield',
      color: '#dce7fc',
      elemColor: '#8980ed',
      estValueSavingsLabel: 'Estd. Savings from Better Quality',
    },
    {
      label: 'Productivity',
      percent: 0,
      value: 0,
      icon: 'pi pi-bullseye',
      color: '#ffecdf',
      elemColor: '#f68605',
      estValueSavingsLabel: 'Estd. Savings from Higher Throughput',
    },
  ];

  aiBenefit = 29524;

  showResults: boolean = false;
  annualPEB: number = 0;

  messages: Message[] | undefined;
  @Input() showLoader: boolean = false;
  isError: boolean = false;
  loading: boolean;

  @Output() retryCalcCall = new EventEmitter<boolean>();

  constructor(private fb: FormBuilder, public sharedService: SharedService) {
    this.pebForm = this.fb.group({
      devCountControl: [30],
      devCostControl: [100000],
      durationControl: ['year'],
    });
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
  calculatePEB() {
    const completeHierarchyData = JSON.parse(
        localStorage.getItem('completeHierarchyData'),
      ),
      selectedLevelName =
        this.sharedService.getDataForSprintGoal()?.selectedLevel.nodeName,
      reqPayload = {
        label: '',
        level: '',
        parentId: '',
      },
      typeOfSelectedTrend = this.sharedService.getSelectedType();

    completeHierarchyData[typeOfSelectedTrend]?.forEach((item) => {
      if (item.hierarchyLevelName === selectedLevelName) {
        reqPayload.label = item.hierarchyLevelId;
        reqPayload.level = item.level;
      }
    });

    this.showLoader = true;
    const productivityGainData = this.sharedService.getPEBData();
    console.log('productivityGainData', productivityGainData);
    if (Object.keys(productivityGainData).length > 0) {
      this.showLoader = false;
      this.showResults = true;
      const productivityGain =
        productivityGainData['categorizedProductivityGain'];
      const overallGain = productivityGain && productivityGain['overall'];

      this.annualPEB = Math.round(
        this.pebForm.get('devCountControl')!.value *
          this.pebForm.get('devCostControl')!.value *
          (overallGain / 100) *
          (this.pebForm.get('durationControl')!.value === 'month'
            ? 1 / 12
            : this.pebForm.get('durationControl')!.value === 'quarter'
            ? 1 / 4
            : 1),
      );
      this.annualPEB = this.annualPEB < 0 ? 0 : this.annualPEB;

      this.roiMetrics = this.roiMetrics.map((metric) => {
        const key = metric.label.toLowerCase();
        const percent = productivityGain[key]; // CHANGE: Calculate percent directly
        const value = Math.round((percent / 100) * this.annualPEB); // CHANGE: Calculate value directly
        return {
          ...metric,
          percent,
          value: value <= 0 ? 0 : value,
        };
      });
    } else {
      this.showLoader = false;
      this.isError = true;
      console.error('Failed to fetch productivity gain data');
    }
  }

  retryCalculatorCall() {
    console.log('Retrying PEB calculation...');
    this.loading = true;
    this.showLoader = true;
    this.isError = false;
    this.retryCalcCall.emit(true);
    this.calculatePEB();
  }
}
