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

interface MetricGroup {
  metricName: string;
  rows: any[];
  rowspan: number;
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
  @Input() baseColumnHeaderKey: string = '';
  @Input() baseColumnHeader2?: string;
  @Input() summary: any;

  @Input() metricsGroupedData!: MetricGroup[];
  @Input() currentSortField!: string;
  @Input() currentSortOrder!: 1 | -1;

  @Output() onProjectSettingsClick = new EventEmitter<string>();
  @Output() onSortGroupedData = new EventEmitter<string>();
  showToolTip = false;
  toolTipHtml = '';
  left = '';
  top = '';

  openProjectSettings(projectName: string): void {
    this.onProjectSettingsClick.emit(projectName);
  }

  get isMetricsLayout(): boolean {
    return (
      Array.isArray(this.projectHeaders) &&
      this.projectHeaders.length > 0 &&
      Array.isArray(this.subColumns) &&
      this.subColumns.length === 1 &&
      this.subColumns[0]?.label === ''
    );
  }

  onCustomSort(event: any): void {
    console.log(event);
    const meta =
      (Array.isArray(event?.multiSortMeta) && event.multiSortMeta[0]) || null;
    const field: string = meta?.field ?? event.field;
    const order: 1 | -1 = (meta?.order ?? event.order) as 1 | -1;

    if (!field || !this.tableData || this.tableData.length === 0) {
      return;
    }

    const isMetricsPerGroupTable = this.isMetricsLayout;

    const compare = (a: any, b: any): number => {
      const va = a?.[field];
      const vb = b?.[field];

      const toNumber = (value: any): number => {
        if (value === null || value === undefined)
          return Number.NEGATIVE_INFINITY;
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return Number.NEGATIVE_INFINITY;

        const trimmed = value.trim();
        if (trimmed.toUpperCase() === 'NA' || trimmed.toUpperCase() === 'N/A') {
          return Number.NEGATIVE_INFINITY;
        }

        const match = trimmed.match(/-?\d+(?:\.\d+)?/);
        if (match) {
          return parseFloat(match[0]);
        }
        return Number.NaN;
      };

      const na = toNumber(va);
      const nb = toNumber(vb);

      let result = 0;
      if (!Number.isNaN(na) && !Number.isNaN(nb)) {
        if (na < nb) result = -1;
        else if (na > nb) result = 1;
        else result = 0;
      } else {
        const sa = String(va ?? '');
        const sb = String(vb ?? '');
        result = sa.localeCompare(sb, undefined, {
          sensitivity: 'base',
          numeric: true,
        });
      }
      return result * order;
    };

    if (isMetricsPerGroupTable) {
      const groups: { label: string; rows: any[] }[] = [];
      let currentLabel = '';
      let currentGroup: any[] = [];

      const METRIC_COL = this.baseColumnHeader || 'Metrics';
      const NON_BREAKING_SPACE = '\u00A0';

      this.tableData.forEach((row) => {
        const label = row[METRIC_COL];
        const isNewGroup = label && label !== NON_BREAKING_SPACE;
        if (isNewGroup) {
          if (currentGroup.length) {
            groups.push({ label: currentLabel, rows: currentGroup });
          }
          currentLabel = label;
          currentGroup = [row];
        } else {
          currentGroup.push(row);
        }
      });
      if (currentGroup.length) {
        groups.push({ label: currentLabel, rows: currentGroup });
      }

      const sortedAll: any[] = [];
      groups.forEach((g) => {
        const cloned = g.rows.slice();
        cloned.sort(compare);

        cloned.forEach((r, idx) => {
          r[METRIC_COL] = idx === 0 ? g.label : NON_BREAKING_SPACE;
        });
        sortedAll.push(...cloned);
      });

      this.tableData = [...sortedAll];
    } else {
      const sorted = this.tableData.slice().sort(compare);
      this.tableData = [...sorted];
    }
  }

  mouseEnter(event, field, data) {
    if (field.cleanName === 'sprintName') {
      if (data?.hoverText?.length > 0) {
        data.hoverText.forEach((item) => {
          this.toolTipHtml += `<span>${item}</span><br/>`;
        });
        this.top = event.pageY + 'px';
        this.left = event.pageX + 'px';
        this.showToolTip = true;
      }
    }
  }

  mouseLeave() {
    this.showToolTip = false;
    this.toolTipHtml = '';
  }
}
