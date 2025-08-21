import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-conditional-input-v2',
  templateUrl: './conditional-input-v2.component.html',
  styleUrls: ['./conditional-input-v2.component.css'],
})
export class ConditionalInputV2Component implements OnChanges {
  @Input() id;
  @Input() fieldConfig;
  @Input() valueObj;
  @Output() conditionalInputChange = new EventEmitter();
  finalValue = [];
  templateData = [];
  templateLabels = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.fieldConfig);
    console.log(this.valueObj);
    if (changes.valueObj && this.valueObj.length) {
      this.templateLabels = this.templateLabelToLowercase(
        this.valueObj.map((val) => val.label),
      );
      this.templateData = this.fieldConfig.options.filter((opt) =>
        this.templateLabels.includes(opt.label),
      );
      this.finalValue = [...this.templateData];
      this.valueObj.forEach((element) => {
        const opt = this.fieldConfig.options.filter(
          (opt) => opt.label === element.label.toLowerCase(),
        )[0];
        if (opt) {
          opt['structuredValue']['sla'] = element.structuredValue.sla;
        }
      });
    }
  }

  templateLabelToLowercase = (arr: []) =>
    arr.map((val: any) => val.toLowerCase());

  setValue(event) {
    console.log(event);
    this.templateLabels = this.templateLabelToLowercase(
      event.value.map((val) => val.label),
    );
    this.templateData = this.fieldConfig.options.filter((opt) =>
      this.templateLabels.includes(opt.label),
    );
    const selectedOption = this.templateData.filter(
      (opt) => opt.label === event.itemValue.label,
    )[0];
    if (selectedOption) {
      selectedOption['structuredValue']['sla'] = selectedOption['minValue'];
    }
    this.setOutput();
  }

  setCounter(event, option) {
    if (
      !this.templateData.filter((opt) => opt.labelValue === option.labelValue)
        .length
    ) {
      const newOption = JSON.parse(JSON.stringify(option));
      newOption.structuredValue.sla = event.value;
      this.templateData.push(newOption);
    } else {
      this.templateData.filter(
        (opt) => opt.labelValue === option.labelValue,
      )[0].structuredValue.sla = event.value;
    }
    this.setOutput();
  }

  removeFocus(event) {
    event.target.blur();
  }

  setOutput() {
    this.conditionalInputChange.emit(this.finalValue);
  }
}
