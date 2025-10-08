import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe, NgClass, NgForOf, NgIf, NgStyle } from '@angular/common';
import { TableModule } from 'primeng/table';

export interface ProjectHeader {
  name: string;
  cleanName: string;
  isTotalColumn?: boolean;
}

export interface SubColumn {
  label: string; // displayed name (ex: 'Efficiency gain')
  dataSuffix: string; //  ex: '_efficiencyGain'
  pipe?: string | undefined;
  isSortable: boolean;
  totalDataKey?: string; // Total key used to display Total on the row.
  // Ex: for '_efficiencyGain', total key will be 'totalEfficiencyGain'.
}

@Component({
  selector: 'app-dynamic-kpi-table',
  standalone: true,
  imports: [NgClass, NgIf, NgForOf, NgStyle, TableModule, DecimalPipe],
  templateUrl: './dynamic-kpi-table.component.html',
  styleUrl: './dynamic-kpi-table.component.css',
})
export class DynamicKpiTableComponent {
  @Input() tableData: any[] = [];
  @Input() projectHeaders: ProjectHeader[] = [];
  @Input() subColumns: SubColumn[] = [];
  @Input() baseColumnHeader: string = '';
  @Input() baseColumnHeader2?: string;
  @Input() summary: any;
  @Output() onProjectSettingsClick = new EventEmitter<string>();

  openProjectSettings(projectName: string): void {
    this.onProjectSettingsClick.emit(projectName);
  }
}
