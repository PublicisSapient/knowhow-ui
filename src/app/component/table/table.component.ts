import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent implements OnInit, OnChanges {
  @Input() cols;
  @Input() data;
  @Input() showMarker = false;
  @Input() showMarkerColumnNumber;
  @Input() trendBoxColorObj;
  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    // only run when property "data" changed
    if (changes['data']) {
      this.data = this.sortAlphabetically(this.data);
    }
  }

  ngOnInit(): void {
    this.data = this.sortAlphabetically(this.data);
  }

  sortAlphabetically(objArray) {
    objArray?.sort((a, b) => a.name?.localeCompare(b.name));
    return objArray;
  }

  getColorForRow(rowName: string): string {
    if (!this.trendBoxColorObj) return '';
    const matchingKey: any = Object.values(this.trendBoxColorObj).find(
      (key: any) => key.nodeDisplayName === rowName,
    );
    return matchingKey ? matchingKey?.color : '';
  }

  renderObj(data) {
    // console.log('kpi_table', data);
    if (typeof data === 'object') {
      return `${data[0].value} ${data[0].name}/${data[1].value} ${data[1].name}`;
    } else {
      return data;
    }
  }
}
