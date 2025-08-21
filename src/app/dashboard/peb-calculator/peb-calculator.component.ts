import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-peb-calculator',
  templateUrl: './peb-calculator.component.html',
  styleUrls: ['./peb-calculator.component.css'],
})
export class PebCalculatorComponent implements OnInit {
  developers: number = 0;
  costPerDeveloper: number = 0;
  duration: string = 'Monthly';
  productivityGain: number = 0; // in percent, e.g. 20 for 20%
  annualPEB: number | null = null;

  constructor() {}

  ngOnInit(): void {}

  calculatePEB() {
    const prodGainFraction = this.productivityGain / 100;
    this.annualPEB = this.developers * this.costPerDeveloper * prodGainFraction;

    if (this.duration === 'Monthly') {
      this.annualPEB /= 12;
    } else if (this.duration === 'Quarterly') {
      this.annualPEB /= 4;
    } else if (this.duration === 'Half-yearly') {
      this.annualPEB /= 2;
    } else {
      this.annualPEB = this.annualPEB;
    }
  }
}
