import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

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
      percent: 25,
      value: 33550,
      icon: 'pi pi-bolt',
      color: '#d4fbdf',
      elemColor: '#15ba40',
      estValueSavingsLabel: 'Estimated Value from Faster Delivery',
    },
    {
      label: 'Efficiency',
      percent: 30,
      value: 46970,
      icon: 'pi pi-chart-line',
      color: '#dee8fc',
      elemColor: '#2f76ff',
      estValueSavingsLabel: 'Estimated Savings from Reduced Rework',
    },
    {
      label: 'Quality',
      percent: 20,
      value: 26840,
      icon: 'pi pi-shield',
      color: '#dce7fc',
      elemColor: '#8980ed',
      estValueSavingsLabel: 'Estimated Savings from Better Quality',
    },
    {
      label: 'Productivity',
      percent: 25,
      value: 26840,
      icon: 'pi pi-bullseye',
      color: '#ffecdf',
      elemColor: '#f68605',
      estValueSavingsLabel: 'Estimated Savings from Higher Throughput',
    },
  ];

  totalBenefit = 134200;
  aiBenefit = 29524;

  constructor(private fb: FormBuilder) {
    this.pebForm = this.fb.group({
      devCountControl: [14],
      devCostControl: [1000],
      durationControl: ['month'],
    });
  }

  ngOnInit() {
    this.pebForm.get('devCountControl')!.valueChanges.subscribe((v) => {
      this.pebForm.get('devCountControl')!.setValue(v, { emitEvent: false });
    });

    this.pebForm.get('devCostControl')!.valueChanges.subscribe((v) => {
      this.pebForm.get('devCostControl')!.setValue(v, { emitEvent: false });
    });
  }

  calculatePEB() {
    // Calculation logic goes here. Set .value properties for each ROI metric and totalBenefit.
    //     const prodGainFraction = this.productivityGain / 100;
    //     this.annualPEB = this.developers * this.costPerDeveloper * prodGainFraction;
    //     if (this.duration === 'Monthly') {
    //       this.annualPEB /= 12;
    //     } else if (this.duration === 'Quarterly') {
    //       this.annualPEB /= 4;
    //     } else {
    //       this.annualPEB = this.annualPEB;
    //     }
  }
}
