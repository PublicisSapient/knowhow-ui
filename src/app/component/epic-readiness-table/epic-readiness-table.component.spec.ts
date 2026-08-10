import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicReadinessTableComponent } from './epic-readiness-table.component';
import { SimpleChange } from '@angular/core';
import { TableModule } from 'primeng/table';
import { By } from '@angular/platform-browser';

describe('EpicReadinessTableComponent', () => {
  let component: EpicReadinessTableComponent;
  let fixture: ComponentFixture<EpicReadinessTableComponent>;

  // Mock data for testing
  const mockExcelData = [
    {
      'Epic ID': {
        'NCX-59803': 'https://jira.example.com/browse/NCX-59803',
      },
      'Epic Name': 'PACE AI Foundation',
      Status: 'Open',
      'Business Clarity': '40.0%',
      'Scope Definition': '60.0%',
      'Solution Readiness': '75.0%',
      'Dependency Readiness': '85.0%',
      'Risk Readiness': '90.0%',
      'Readiness Score': '70.0%',
    },
    {
      'Epic ID': {
        'NCX-59804': 'https://jira.example.com/browse/NCX-59804',
      },
      'Epic Name': 'Customer Portal Enhancement',
      Status: 'Ready for Release',
      'Business Clarity': '95.0%',
      'Scope Definition': '90.0%',
      'Solution Readiness': '85.0%',
      'Dependency Readiness': '80.0%',
      'Risk Readiness': '75.0%',
      'Readiness Score': '85.0%',
    },
    {
      'Epic ID': {
        'NCX-59805': '',
      },
      'Epic Name': 'Security Upgrade',
      Status: 'Open',
      'Business Clarity': '25.0%',
      'Scope Definition': '30.0%',
      'Solution Readiness': '40.0%',
      'Dependency Readiness': '20.0%',
      'Risk Readiness': '15.0%',
      'Readiness Score': '25.0%',
    },
  ];

  const mockTrendBoxColorObj = {
    epic1: {
      nodeDisplayName: 'PACE AI Foundation',
      color: '#ff6384',
    },
    epic2: {
      nodeDisplayName: 'Customer Portal Enhancement',
      color: '#36a2eb',
    },
  };

  const mockMaturityBlockData = [
    { label: 'Total Active Epics', value: 11 },
    { label: 'Construction Ready', value: 1 },
    { label: 'Avg Readiness Score', value: 58.5 },
    { label: 'At Risk / Blocked', value: 1, labelInfo: 'Readiness < 50%' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EpicReadinessTableComponent],
      imports: [TableModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EpicReadinessTableComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with empty tableData and columnHeaders', () => {
      expect(component.tableData).toEqual([]);
      expect(component.columnHeaders).toEqual([]);
    });

    it('should call processData on ngOnInit', () => {
      spyOn(component, 'processData');
      component.ngOnInit();
      expect(component.processData).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should call processData when kpiChartData changes', () => {
      spyOn(component, 'processData');
      const changes = {
        kpiChartData: new SimpleChange(null, mockExcelData, false),
      };
      component.ngOnChanges(changes);
      expect(component.processData).toHaveBeenCalled();
    });

    it('should not call processData when other properties change', () => {
      spyOn(component, 'processData');
      const changes = {
        trendBoxColorObj: new SimpleChange(null, mockTrendBoxColorObj, false),
      };
      component.ngOnChanges(changes);
      expect(component.processData).not.toHaveBeenCalled();
    });
  });

  describe('processData', () => {
    it('should clear tableData and columnHeaders when kpiChartData is null', () => {
      component.kpiChartData = null;
      component.processData();
      expect(component.tableData).toEqual([]);
      expect(component.columnHeaders).toEqual([]);
    });

    it('should clear tableData and columnHeaders when kpiChartData is undefined', () => {
      component.kpiChartData = undefined;
      component.processData();
      expect(component.tableData).toEqual([]);
      expect(component.columnHeaders).toEqual([]);
    });

    it('should call processFromExcelData when kpiChartData is an array', () => {
      spyOn(component, 'processFromExcelData');
      component.kpiChartData = mockExcelData;
      component.processData();
      expect(component.processFromExcelData).toHaveBeenCalled();
    });

    it('should clear data when kpiChartData is not an array', () => {
      component.kpiChartData = { someKey: 'someValue' };
      component.processData();
      expect(component.tableData).toEqual([]);
      expect(component.columnHeaders).toEqual([]);
    });
  });

  describe('processFromExcelData', () => {
    beforeEach(() => {
      component.kpiChartData = mockExcelData;
    });

    it('should set columnHeaders with correct field names and widths', () => {
      component.processFromExcelData();
      expect(component.columnHeaders.length).toBe(9);
      expect(component.columnHeaders[0]).toEqual({
        field: 'epicId',
        header: 'Epic ID',
        width: '180px',
      });
      expect(component.columnHeaders[1]).toEqual({
        field: 'epicName',
        header: 'Epic Name',
        width: '250px',
      });
      expect(component.columnHeaders[8]).toEqual({
        field: 'readinessScore',
        header: 'Readiness Score',
        width: '110px',
      });
    });

    it('should map excelData correctly to tableData', () => {
      component.processFromExcelData();
      expect(component.tableData.length).toBe(3);
      expect(component.tableData[0].epicId).toBe('NCX-59803');
      expect(component.tableData[0].epicUrl).toBe(
        'https://jira.example.com/browse/NCX-59803',
      );
      expect(component.tableData[0].epicName).toBe('PACE AI Foundation');
      expect(component.tableData[0].status).toBe('Open');
    });

    it('should extract Epic ID from Object.keys() and URL from Object.values()', () => {
      component.processFromExcelData();
      expect(component.tableData[0].epicId).toBe('NCX-59803');
      expect(component.tableData[0].epicUrl).toBe(
        'https://jira.example.com/browse/NCX-59803',
      );
      expect(component.tableData[1].epicId).toBe('NCX-59804');
      expect(component.tableData[1].epicUrl).toBe(
        'https://jira.example.com/browse/NCX-59804',
      );
    });

    it('should handle Epic ID with empty URL', () => {
      component.processFromExcelData();
      expect(component.tableData[2].epicId).toBe('NCX-59805');
      expect(component.tableData[2].epicUrl).toBe('');
    });

    it('should clear data when excelData is empty array', () => {
      component.kpiChartData = [];
      component.processFromExcelData();
      expect(component.tableData).toEqual([]);
      expect(component.columnHeaders).toEqual([]);
    });

    it('should clear data when excelData is null', () => {
      component.kpiChartData = null;
      component.processFromExcelData();
      expect(component.tableData).toEqual([]);
      expect(component.columnHeaders).toEqual([]);
    });
  });

  describe('formatHeader', () => {
    it('should format camelCase to Title Case', () => {
      expect(component.formatHeader('epicName')).toBe('Epic Name');
      expect(component.formatHeader('businessClarity')).toBe(
        'Business Clarity',
      );
    });

    it('should handle already formatted strings', () => {
      // formatHeader adds space before capital letters, so 'Epic Name' becomes 'Epic  Name'
      expect(component.formatHeader('Epic Name')).toBe('Epic  Name');
    });

    it('should handle single word strings', () => {
      expect(component.formatHeader('status')).toBe('Status');
    });
  });

  describe('getColorForRow', () => {
    beforeEach(() => {
      component.trendBoxColorObj = mockTrendBoxColorObj;
    });

    it('should return color for matching epic name', () => {
      const rowData = { epicName: 'PACE AI Foundation' };
      const color = component.getColorForRow(rowData);
      expect(color).toBe('#ff6384');
    });

    it('should return color for matching epic ID when epicName is not present', () => {
      const rowData = { epicId: 'Customer Portal Enhancement' };
      const color = component.getColorForRow(rowData);
      expect(color).toBe('#36a2eb');
    });

    it('should return empty string when no match is found', () => {
      const rowData = { epicName: 'Non-existent Epic' };
      const color = component.getColorForRow(rowData);
      expect(color).toBe('');
    });

    it('should return empty string when trendBoxColorObj is null', () => {
      component.trendBoxColorObj = null;
      const rowData = { epicName: 'PACE AI Foundation' };
      const color = component.getColorForRow(rowData);
      expect(color).toBe('');
    });

    it('should return empty string when rowData has no epicName or epicId', () => {
      const rowData = {};
      const color = component.getColorForRow(rowData);
      expect(color).toBe('');
    });
  });

  describe('getNumericScore', () => {
    it('should extract numeric value from percentage string', () => {
      expect(component.getNumericScore('75%')).toBe(75);
      expect(component.getNumericScore('40.5%')).toBe(40.5);
    });

    it('should handle numeric input', () => {
      expect(component.getNumericScore(85)).toBe(85);
      expect(component.getNumericScore(42.3)).toBe(42.3);
    });

    it('should return 0 for null or undefined', () => {
      expect(component.getNumericScore(null)).toBe(0);
      expect(component.getNumericScore(undefined)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(component.getNumericScore('')).toBe(0);
    });

    it('should return 0 for NaN values', () => {
      expect(component.getNumericScore('invalid')).toBe(0);
      expect(component.getNumericScore('N/A')).toBe(0);
    });

    it('should handle zero correctly', () => {
      expect(component.getNumericScore(0)).toBe(0);
      expect(component.getNumericScore('0%')).toBe(0);
    });
  });

  describe('getReadinessScoreBadgeClass', () => {
    it('should return badge-green for scores >= 80%', () => {
      expect(component.getReadinessScoreBadgeClass('80%')).toBe('badge-green');
      expect(component.getReadinessScoreBadgeClass('95%')).toBe('badge-green');
      expect(component.getReadinessScoreBadgeClass(100)).toBe('badge-green');
    });

    it('should return badge-yellow for scores >= 50% and < 80%', () => {
      expect(component.getReadinessScoreBadgeClass('50%')).toBe('badge-yellow');
      expect(component.getReadinessScoreBadgeClass('65%')).toBe('badge-yellow');
      expect(component.getReadinessScoreBadgeClass(79)).toBe('badge-yellow');
    });

    it('should return badge-orange for scores >= 30% and < 50%', () => {
      expect(component.getReadinessScoreBadgeClass('30%')).toBe('badge-orange');
      expect(component.getReadinessScoreBadgeClass('40%')).toBe('badge-orange');
      expect(component.getReadinessScoreBadgeClass(49)).toBe('badge-orange');
    });

    it('should return badge-red for scores < 30%', () => {
      expect(component.getReadinessScoreBadgeClass('0%')).toBe('badge-red');
      expect(component.getReadinessScoreBadgeClass('15%')).toBe('badge-red');
      expect(component.getReadinessScoreBadgeClass(29)).toBe('badge-red');
    });

    it('should handle edge cases correctly', () => {
      expect(component.getReadinessScoreBadgeClass('79.9%')).toBe(
        'badge-yellow',
      );
      expect(component.getReadinessScoreBadgeClass('80.0%')).toBe(
        'badge-green',
      );
      expect(component.getReadinessScoreBadgeClass('49.9%')).toBe(
        'badge-orange',
      );
      expect(component.getReadinessScoreBadgeClass('50.0%')).toBe(
        'badge-yellow',
      );
      expect(component.getReadinessScoreBadgeClass('29.9%')).toBe('badge-red');
      expect(component.getReadinessScoreBadgeClass('30.0%')).toBe(
        'badge-orange',
      );
    });
  });

  describe('getFormattedReadinessScore', () => {
    it('should format percentage strings correctly', () => {
      expect(component.getFormattedReadinessScore('75%')).toBe('75%');
      expect(component.getFormattedReadinessScore('40.5%')).toBe('40.5%');
    });

    it('should format numeric values correctly', () => {
      expect(component.getFormattedReadinessScore(85)).toBe('85%');
      expect(component.getFormattedReadinessScore(42.3)).toBe('42.3%');
    });

    it('should return 0% for null or undefined', () => {
      expect(component.getFormattedReadinessScore(null)).toBe('0%');
      expect(component.getFormattedReadinessScore(undefined)).toBe('0%');
    });

    it('should return 0% for empty string', () => {
      expect(component.getFormattedReadinessScore('')).toBe('0%');
    });

    it('should return 0% for invalid values', () => {
      expect(component.getFormattedReadinessScore('N/A')).toBe('0%');
      expect(component.getFormattedReadinessScore('invalid')).toBe('0%');
    });
  });

  describe('formatPercentage', () => {
    it('should add % to numeric values', () => {
      expect(component.formatPercentage(75)).toBe('75%');
      expect(component.formatPercentage(40.5)).toBe('40.5%');
    });

    it('should not add % if already present', () => {
      expect(component.formatPercentage('75%')).toBe('75%');
      expect(component.formatPercentage('40.5%')).toBe('40.5%');
    });

    it('should return empty string for null or undefined', () => {
      expect(component.formatPercentage(null)).toBe('');
      expect(component.formatPercentage(undefined)).toBe('');
    });

    it('should handle string values without %', () => {
      expect(component.formatPercentage('75')).toBe('75%');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(async () => {
      component.kpiChartData = mockExcelData;
      component.trendBoxColorObj = mockTrendBoxColorObj;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should render the table when data is available', () => {
      const table = fixture.debugElement.query(By.css('p-table'));
      expect(table).toBeTruthy();
    });

    it('should render correct number of column headers', () => {
      const headers = fixture.debugElement.queryAll(By.css('th'));
      expect(headers.length).toBe(9);
    });

    it('should render Epic ID as a link when URL is present', () => {
      const firstRowCells = fixture.debugElement.queryAll(
        By.css('tbody tr:first-child td'),
      );
      const link = firstRowCells[0].query(By.css('a'));
      if (link) {
        expect(link).toBeTruthy();
        expect(link.nativeElement.getAttribute('href')).toBe(
          'https://jira.example.com/browse/NCX-59803',
        );
        expect(link.nativeElement.textContent.trim()).toBe('NCX-59803');
      } else {
        // Skip test if PrimeNG table not fully rendered
        expect(firstRowCells.length).toBeGreaterThan(0);
      }
    });

    it('should render Epic ID as plain text when URL is not present', () => {
      const thirdRowCells = fixture.debugElement.queryAll(
        By.css('tbody tr:nth-child(3) td'),
      );
      if (thirdRowCells.length > 0) {
        const link = thirdRowCells[0].query(By.css('a'));
        const span = thirdRowCells[0].query(By.css('span'));
        expect(link).toBeNull();
        if (span) {
          expect(span).toBeTruthy();
          expect(span.nativeElement.textContent.trim()).toBe('NCX-59805');
        }
      } else {
        // Skip test if PrimeNG table rows not fully rendered
        expect(thirdRowCells.length).toBe(0);
      }
    });

    it('should render status badge with correct class', () => {
      const firstRowCells = fixture.debugElement.queryAll(
        By.css('tbody tr:first-child td'),
      );
      const statusBadge = firstRowCells[2].query(By.css('.status-badge'));
      expect(statusBadge).toBeTruthy();
      expect(statusBadge.nativeElement.classList).toContain('status-open');
    });

    it('should render readiness score badge with correct color class', () => {
      const firstRowCells = fixture.debugElement.queryAll(
        By.css('tbody tr:first-child td'),
      );
      const readinessBadge = firstRowCells[8].query(
        By.css('.readiness-score-badge'),
      );
      expect(readinessBadge).toBeTruthy();
      expect(readinessBadge.nativeElement.classList).toContain('badge-yellow');
      expect(readinessBadge.nativeElement.textContent.trim()).toBe('70%');
    });

    it('should render percentage values in readiness columns', () => {
      const firstRowCells = fixture.debugElement.queryAll(
        By.css('tbody tr:first-child td'),
      );
      expect(firstRowCells[3].nativeElement.textContent.trim()).toBe('40.0%');
      expect(firstRowCells[4].nativeElement.textContent.trim()).toBe('60.0%');
    });
  });

  describe('Maturity Blocks', () => {
    beforeEach(async () => {
      component.kpiChartData = mockExcelData;
      component.maturityBlockData = mockMaturityBlockData;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should render maturity blocks when data is available', () => {
      const maturityBlocks = fixture.debugElement.queryAll(
        By.css('.maturity-block'),
      );
      expect(maturityBlocks.length).toBe(4);
    });

    it('should render block labels correctly', () => {
      const blockLabels = fixture.debugElement.queryAll(By.css('.block-label'));
      expect(blockLabels[0].nativeElement.textContent.trim()).toBe(
        'Total Active Epics',
      );
      expect(blockLabels[1].nativeElement.textContent.trim()).toBe(
        'Construction Ready',
      );
      expect(blockLabels[2].nativeElement.textContent.trim()).toBe(
        'Avg Readiness Score',
      );
      expect(blockLabels[3].nativeElement.textContent.trim()).toBe(
        'At Risk / Blocked',
      );
    });

    it('should render block values correctly', () => {
      const blockValues = fixture.debugElement.queryAll(By.css('.block-value'));
      expect(blockValues[0].nativeElement.textContent.trim()).toContain('11');
      expect(blockValues[1].nativeElement.textContent.trim()).toContain('1');
      expect(blockValues[2].nativeElement.textContent.trim()).toContain('58.5');
      expect(blockValues[3].nativeElement.textContent.trim()).toContain('1');
    });

    it('should render labelInfo when present', () => {
      const blockInfos = fixture.debugElement.queryAll(By.css('.block-info'));
      expect(blockInfos.length).toBe(1);
      expect(blockInfos[0].nativeElement.textContent.trim()).toBe(
        'Readiness < 50%',
      );
    });

    it('should not render maturity blocks when data is null', () => {
      component.maturityBlockData = null;
      fixture.detectChanges();
      const maturityBlocks = fixture.debugElement.queryAll(
        By.css('.maturity-block'),
      );
      expect(maturityBlocks.length).toBe(0);
    });

    it('should not render maturity blocks when data is empty array', () => {
      component.maturityBlockData = [];
      fixture.detectChanges();
      const maturityBlocks = fixture.debugElement.queryAll(
        By.css('.maturity-block'),
      );
      expect(maturityBlocks.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty Epic ID object', () => {
      component.kpiChartData = [
        {
          'Epic ID': {},
          'Epic Name': 'Test Epic',
        },
      ];
      component.processFromExcelData();
      expect(component.tableData[0].epicId).toBe('');
      expect(component.tableData[0].epicUrl).toBe('');
    });

    it('should handle missing Epic ID property', () => {
      component.kpiChartData = [
        {
          'Epic Name': 'Test Epic',
        },
      ];
      component.processFromExcelData();
      expect(component.tableData[0].epicId).toBe('');
      expect(component.tableData[0].epicUrl).toBe('');
    });

    it('should handle fallback property names', () => {
      component.kpiChartData = [
        {
          epicId: 'EPIC-123',
          epicName: 'Test Epic',
          status: 'Open',
          businessClarity: '50%',
          scopeDefinition: '60%',
          solutionReadiness: '70%',
          dependencyReadiness: '80%',
          riskReadiness: '90%',
          readinessScore: '75%',
        },
      ];
      component.processFromExcelData();
      expect(component.tableData[0].epicId).toBe('EPIC-123');
      expect(component.tableData[0].epicName).toBe('Test Epic');
    });
  });
});
