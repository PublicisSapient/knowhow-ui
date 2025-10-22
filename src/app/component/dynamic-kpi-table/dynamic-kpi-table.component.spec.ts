import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DynamicKpiTableComponent,
  ProjectHeader,
  SubColumn,
} from './dynamic-kpi-table.component';
import { DecimalPipe } from '@angular/common';
import { By } from '@angular/platform-browser';

// --- MOCK DATA ---
const simpleSubColumns: SubColumn[] = [
  {
    label: 'Metric Value',
    dataSuffix: 'value',
    pipe: '1.2-2',
    isSortable: true,
  },
  { label: 'Raw Count', dataSuffix: 'count', isSortable: false },
];

const simpleTableData = [
  { Sprint: 'Sprint 1', value: 123.456, count: 50 },
  { Sprint: 'Sprint 2', value: 789.012, count: 100 },
];

const complexProjectHeaders: ProjectHeader[] = [
  { name: 'Project A', cleanName: 'projA' },
  { name: 'Project B', cleanName: 'projB' },
  { name: 'Total', cleanName: 'total', isTotalColumn: true },
];

const complexAiUsageSubColumns: SubColumn[] = [
  {
    label: 'Efficiency',
    dataSuffix: '_efficiency',
    pipe: '1.0-0',
    isSortable: true,
    totalDataKey: 'totalEfficiency',
  },
  {
    label: 'Usage Count',
    dataSuffix: '_usageCount',
    isSortable: false,
    totalDataKey: 'totalUsageCount',
  },
];

const complexAiUsageTableData = [
  {
    'Usage Type': 'Feature 1',
    projA_efficiency: 0.85,
    projA_usageCount: 100,
    projB_efficiency: 0.6,
    projB_usageCount: 50,
    totalEfficiency: 0.75,
    totalUsageCount: 150,
  },
  {
    'Usage Type': 'Feature 2',
    projA_efficiency: 0.95,
    projA_usageCount: 200,
    projB_efficiency: 'N/A',
    projB_usageCount: 0,
    totalEfficiency: 0.95,
    totalUsageCount: 200,
  },
  {
    'Usage Type': 'Row Total',
    isTotalRow: true,
    projA_efficiency: 0.9,
    projA_usageCount: 300,
    projB_efficiency: 0.6,
    projB_usageCount: 50,
    totalEfficiency: 0.8,
    totalUsageCount: 350,
  },
];

const complexMetricSubColumns: SubColumn[] = [
  { label: '', dataSuffix: '_metricValue', isSortable: true },
];

const complexMetricTableData = [
  {
    'Metric Name': 'Cycle Time',
    projA_metricValue: 5,
    projB_metricValue: 7,
  },
];

describe('DynamicKpiTableComponent', () => {
  let component: DynamicKpiTableComponent;
  let fixture: ComponentFixture<DynamicKpiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicKpiTableComponent],
      providers: [DecimalPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicKpiTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Simple Mode (No Project Groupings)', () => {
    beforeEach(() => {
      component.tableData = simpleTableData;
      component.subColumns = simpleSubColumns;
      component.baseColumnHeader = 'Sprint';
      fixture.detectChanges();
    });

    it('should render the correct number of header columns', () => {
      const headers = fixture.debugElement.queryAll(By.css('th'));
      expect(headers.length).toBe(1 + simpleSubColumns.length);
      expect(headers[0].nativeElement.textContent).toContain('Sprint');
      expect(headers[1].nativeElement.textContent).toContain('Metric Value');
      expect(headers[2].nativeElement.textContent).toContain('Raw Count');
    });

    it('should apply the number pipe to sortable metric columns', () => {
      const firstRowCells = fixture.debugElement
        .query(By.css('tbody tr:first-child'))
        .queryAll(By.css('td'));

      expect(firstRowCells[0].nativeElement.textContent.trim()).toBe(
        'Sprint 1',
      );
      expect(firstRowCells[1].nativeElement.textContent.trim()).toBe('123.46');
      expect(firstRowCells[2].nativeElement.textContent.trim()).toBe('50');
    });
  });

  describe('Complex Mode: AI Usage Case (Two-Level Header)', () => {
    beforeEach(() => {
      component.tableData = complexAiUsageTableData;
      component.projectHeaders = complexProjectHeaders;
      component.subColumns = complexAiUsageSubColumns;
      component.baseColumnHeader = 'Usage Type';
      fixture.detectChanges();
    });

    it('should render the two-level header structure', () => {
      const headerRows = fixture.debugElement.queryAll(By.css('thead tr'));
      expect(headerRows.length).toBe(2);

      const level1Headers = headerRows[0].queryAll(By.css('th'));
      expect(level1Headers.length).toBe(4);
      expect(level1Headers[0].nativeElement.getAttribute('rowspan')).toBe('2');

      const level2Headers = headerRows[1].queryAll(By.css('th'));
      expect(level2Headers.length).toBe(6);
      expect(level2Headers[0].nativeElement.textContent.trim()).toBe(
        'Efficiency',
      );
      expect(level2Headers[1].nativeElement.textContent.trim()).toBe(
        'Usage Count',
      );
    });

    it('should emit onProjectSettingsClick when the gear icon is clicked (non-Total column)', () => {
      spyOn(component.onProjectSettingsClick, 'emit');

      const projASettingsIcon = fixture.debugElement.query(
        By.css('th i.fa-cog'),
      );

      projASettingsIcon.triggerEventHandler('click', null);

      expect(component.onProjectSettingsClick.emit).toHaveBeenCalledWith(
        'Project A',
      );
    });

    it('should display "N/A" correctly and apply the pipe to total columns', () => {
      const row2Cells = fixture.debugElement
        .queryAll(By.css('tbody tr'))[1]
        .queryAll(By.css('td'));

      expect(row2Cells[3].nativeElement.textContent.trim()).toBe('N/A');
      expect(row2Cells[5].nativeElement.textContent.trim()).toBe('1');
    });

    it('should style the total row and total column correctly', () => {
      const totalRow = fixture.debugElement.queryAll(By.css('tbody tr'))[2];
      expect(totalRow.nativeElement.classList).toContain('total-row-bg');

      const totalRowCells = totalRow.queryAll(By.css('td'));
      expect(totalRowCells[2].nativeElement.classList).toContain('p-text-bold');
      expect(totalRowCells[6].nativeElement.classList).toContain(
        'total-column-bg',
      );
    });
  });

  describe('Complex Mode: Metrics Case (Single Header Row)', () => {
    beforeEach(() => {
      component.tableData = complexMetricTableData;
      component.projectHeaders = complexProjectHeaders.filter(
        (h) => h.name !== 'Total',
      );
      component.subColumns = complexMetricSubColumns;
      component.baseColumnHeader = 'Metric Name';
      fixture.detectChanges();
    });

    it('should render the single header row structure for Metrics Case', () => {
      const headerRows = fixture.debugElement.queryAll(By.css('thead tr'));
      expect(headerRows.length).toBe(1);

      const headers = headerRows[0].queryAll(By.css('th'));
      expect(headers.length).toBe(1 + component.projectHeaders.length);
      expect(headers[0].nativeElement.textContent.trim()).toBe('Metric Name');
      expect(headers[1].nativeElement.textContent.trim()).toBe('Project A');
      expect(headers[2].nativeElement.textContent.trim()).toBe('Project B');
    });

    it('should render data without applying a pipe', () => {
      const row1Cells = fixture.debugElement
        .query(By.css('tbody tr:first-child'))
        .queryAll(By.css('td'));

      expect(row1Cells[0].nativeElement.textContent.trim()).toBe('Cycle Time');
      expect(row1Cells[1].nativeElement.textContent.trim()).toBe('5');
    });
  });
});
