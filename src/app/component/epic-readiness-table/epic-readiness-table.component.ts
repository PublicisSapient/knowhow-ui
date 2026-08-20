import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-epic-readiness-table',
  templateUrl: './epic-readiness-table.component.html',
  styleUrls: ['./epic-readiness-table.component.css'],
})
export class EpicReadinessTableComponent implements OnInit, OnChanges {
  @Input() kpiChartData: any; // Can contain either trendValuelist or excelData
  @Input() trendBoxColorObj: any;
  @Input() maturityBlockData: any; // New input for maturity block data

  tableData: any[] = [];
  columnHeaders: any[] = [];

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['kpiChartData']) {
      this.processData();
    }
  }

  ngOnInit(): void {
    this.processData();
  }

  /**
   * Process the incoming KPI data to determine whether to use
   * trendValuelist or excelData property
   */
  processData() {
    if (!this.kpiChartData) {
      this.tableData = [];
      this.columnHeaders = [];
      return;
    }

    if (this.kpiChartData && Array.isArray(this.kpiChartData)) {
      this.processFromExcelData();
    } else {
      // No valid data source found
      this.tableData = [];
      this.columnHeaders = [];
    }
  }

  /**
   * Process data from excelData property
   */
  processFromExcelData() {
    const excelData = this.kpiChartData;

    if (!excelData || excelData.length === 0) {
      this.tableData = [];
      this.columnHeaders = [];
      return;
    }

    // Based on the image, the Epic Readiness Table should have these columns:
    // Epic ID, Epic name, Status, Business clarity, Scope definition,
    // Solution readiness, Dependency readiness, Risk readiness, Readiness score

    this.columnHeaders = [
      { field: 'epicId', header: 'Epic ID', width: '180px' },
      { field: 'epicName', header: 'Epic Name', width: '250px' },
      { field: 'status', header: 'Status', width: '150px' },
      { field: 'businessClarity', header: 'Business Clarity', width: '110px' },
      { field: 'scopeDefinition', header: 'Scope Definition', width: '110px' },
      {
        field: 'solutionReadiness',
        header: 'Solution Readiness',
        width: '120px',
      },
      {
        field: 'dependencyReadiness',
        header: 'Dependency Readiness',
        width: '130px',
      },
      { field: 'riskReadiness', header: 'Risk Readiness', width: '110px' },
      { field: 'readinessScore', header: 'Readiness Score', width: '110px' },
    ];

    console.log('Excel Data:', excelData);
    // Map the excelData to table format
    this.tableData = excelData.map((item) => {
      // Extract Epic ID and URL from the object
      // Epic ID object structure: { 'EPIC-123': 'https://url.com' }
      // Object.keys()[0] = Epic ID, Object.values()[0] = URL
      const epicIdObj = item['Epic ID'];
      const epicId =
        (epicIdObj && Object.keys(epicIdObj)[0]) || item['epicId'] || '';
      const epicUrl =
        (epicIdObj && (Object.values(epicIdObj)[0] as string)) ||
        item['epicUrl'] ||
        '';

      return {
        epicId: epicId,
        epicUrl: epicUrl,
        epicName: item['Epic Name'] || item['epicName'] || '',
        status: item['Status'] || item['status'] || '',
        businessClarity:
          item['Business Clarity'] || item['businessClarity'] || '',
        scopeDefinition:
          item['Scope Definition'] || item['scopeDefinition'] || '',
        solutionReadiness:
          item['Solution Readiness'] || item['solutionReadiness'] || '',
        dependencyReadiness:
          item['Dependency Readiness'] || item['dependencyReadiness'] || '',
        riskReadiness: item['Risk Readiness'] || item['riskReadiness'] || '',
        readinessScore: item['Readiness Score'] || item['readinessScore'] || '',
      };
    });
  }

  /**
   * Format header name for display
   */
  formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Get color for a specific row based on epic name or ID
   */
  getColorForRow(rowData: any): string {
    if (!this.trendBoxColorObj) return '';

    const epicName = rowData.epicName || rowData.epicId || '';
    const matchingKey: any = Object.values(this.trendBoxColorObj).find(
      (key: any) => key.nodeDisplayName === epicName,
    );

    return matchingKey ? matchingKey?.color : '';
  }

  /**
   * Get badge class for readiness score based on percentage thresholds:
   * ≥80% = Green (#28a745, white text)
   * ≥50% = Yellow (#fffc107, black text)
   * ≥30% = Orange (#fd7e14, white text)
   * <30% = Red (#dc3545, white text)
   */
  getReadinessScoreBadgeClass(score: string | number): string {
    const numericScore = this.getNumericScore(score);

    if (numericScore >= 80) {
      return 'badge-green';
    } else if (numericScore >= 50) {
      return 'badge-yellow';
    } else if (numericScore >= 30) {
      return 'badge-orange';
    } else {
      return 'badge-red';
    }
  }

  /**
   * Extract numeric score from string or number
   * Returns 0 if no valid score is found
   */
  getNumericScore(score: string | number): number {
    if (!score && score !== 0) {
      return 0;
    }

    const numericScore =
      typeof score === 'string' ? parseFloat(score.replace('%', '')) : score;

    return isNaN(numericScore) ? 0 : numericScore;
  }

  /**
   * Get formatted readiness score
   * Returns '0' if no score property exists
   */
  getFormattedReadinessScore(score: string | number): string {
    const numericScore = this.getNumericScore(score);
    return `${numericScore}%`;
  }

  /**
   * Format percentage values
   */
  formatPercentage(value: string | number): string {
    if (!value) return '';
    const stringValue = String(value);
    return stringValue.includes('%') ? stringValue : `${stringValue}%`;
  }
}
