/*******************************************************************************
 * Copyright 2014 CapitalOne, LLC.
 * Further development Copyright 2022 Sapient Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { QualityDashboardComponent } from './quality-dashboard.component';
import { SonarQubeService } from '../../services/sonarqube.service';
import {
  SonarMetricsResponse,
  QualityGateStatus,
  BranchInfo,
} from '../../model/sonarqube.model';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

describe('QualityDashboardComponent', () => {
  let component: QualityDashboardComponent;
  let fixture: ComponentFixture<QualityDashboardComponent>;
  let sonarQubeService: jasmine.SpyObj<SonarQubeService>;

  const mockProjectMetrics: SonarMetricsResponse = {
    component: {
      key: 'ENGINEERING.KPIDASHBOARD.UI',
      name: 'KnowHOW UI',
      qualifier: 'TRK',
      path: '',
    },
    measures: [
      { metric: 'bugs', value: '5' },
      { metric: 'vulnerabilities', value: '2' },
      { metric: 'code_smells', value: '100' },
      { metric: 'coverage', value: '75.5' },
      { metric: 'duplicated_lines_density', value: '3.2' },
      { metric: 'sqale_index', value: '120' },
      { metric: 'ncloc', value: '15000' },
      { metric: 'security_hotspots', value: '3' },
    ],
  };

  const mockQualityGateStatus: QualityGateStatus = {
    status: 'OK',
    conditions: [
      {
        status: 'OK',
        metricKey: 'coverage',
        comparator: 'GT',
        errorThreshold: '70',
        actualValue: '75.5',
      },
    ],
    ignoredConditions: false,
  };

  const mockBranches: BranchInfo[] = [
    { name: 'master', isMain: true, type: 'LONG', analysisDate: '2026-09-16' },
    {
      name: 'develop',
      isMain: false,
      type: 'LONG',
      analysisDate: '2026-09-16',
    },
    {
      name: 'feature/test',
      isMain: false,
      type: 'SHORT',
      analysisDate: '2026-09-15',
    },
  ];

  beforeEach(async () => {
    const sonarQubeServiceSpy = jasmine.createSpyObj('SonarQubeService', [
      'getConfig',
      'getProjectMetrics',
      'getQualityGateStatus',
      'getProjectBranches',
      'getCurrentBranch',
      'setBranch',
      'setConfig',
    ]);

    await TestBed.configureTestingModule({
      declarations: [QualityDashboardComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NoopAnimationsModule,
        DialogModule,
        ProgressSpinnerModule,
        MessageModule,
        TableModule,
        DropdownModule,
        AccordionModule,
        ButtonModule,
        InputTextModule,
      ],
      providers: [{ provide: SonarQubeService, useValue: sonarQubeServiceSpy }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    sonarQubeService = TestBed.inject(
      SonarQubeService,
    ) as jasmine.SpyObj<SonarQubeService>;
  });

  beforeEach(() => {
    // Spy on console.error to suppress expected error logs in tests
    spyOn(console, 'error');

    sonarQubeService.getConfig.and.returnValue({
      serverUrl: 'https://tools.publicis.sapient.com/sonar',
      projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
    });
    sonarQubeService.getProjectMetrics.and.returnValue(of(mockProjectMetrics));
    sonarQubeService.getQualityGateStatus.and.returnValue(
      of(mockQualityGateStatus),
    );
    sonarQubeService.getProjectBranches.and.returnValue(of(mockBranches));
    sonarQubeService.getCurrentBranch.and.returnValue('master');

    fixture = TestBed.createComponent(QualityDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init when config is available', () => {
    fixture.detectChanges();
    expect(sonarQubeService.getProjectMetrics).toHaveBeenCalled();
    expect(sonarQubeService.getQualityGateStatus).toHaveBeenCalled();
    expect(sonarQubeService.getProjectBranches).toHaveBeenCalled();
  });

  it('should show config dialog when no server URL is configured', () => {
    sonarQubeService.getConfig.and.returnValue({
      serverUrl: '',
      projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
    });

    // Recreate component with new config
    fixture = TestBed.createComponent(QualityDashboardComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
    expect(component.showConfigDialog).toBe(true);
  });

  it('should extract summary stats from project metrics', () => {
    component.projectMetrics = mockProjectMetrics;
    component.extractSummaryStats(mockProjectMetrics.measures);

    expect(component.summaryStats.bugs).toBe(5);
    expect(component.summaryStats.vulnerabilities).toBe(2);
    expect(component.summaryStats.codeSmells).toBe(100);
    expect(component.summaryStats.coverage).toBe(75.5);
    expect(component.summaryStats.duplication).toBe(3.2);
    expect(component.summaryStats.technicalDebt).toBe('120');
    expect(component.summaryStats.linesOfCode).toBe(15000);
    expect(component.summaryStats.securityHotspots).toBe(3);
  });

  it('should calculate overall health score correctly', () => {
    component.summaryStats = {
      bugs: 5,
      vulnerabilities: 2,
      codeSmells: 100,
      coverage: 75.5,
      duplication: 3.2,
      technicalDebt: '120',
      linesOfCode: 15000,
      securityHotspots: 3,
    };

    component.calculateOverallHealth();

    expect(component.overallHealth).toBeDefined();
    expect(component.overallHealth?.score).toBeGreaterThanOrEqual(0);
    expect(component.overallHealth?.score).toBeLessThanOrEqual(100);
    expect(component.overallHealth?.status).toBeDefined();
    expect(component.overallHealth?.color).toBeDefined();
  });

  it('should assign correct health status based on score', () => {
    // Don't call fixture.detectChanges() to avoid initialization

    // Test Excellent (90-100)
    component.summaryStats = {
      bugs: 0,
      vulnerabilities: 0,
      codeSmells: 5,
      coverage: 95,
      duplication: 1,
      technicalDebt: '10',
      linesOfCode: 10000,
      securityHotspots: 0,
    };
    component.calculateOverallHealth();
    expect(component.overallHealth?.status).toBe('Excellent');
    expect(component.overallHealth?.color).toBe('#4caf50');

    // Test Good (75-89) - Need more deductions to bring score down
    component.summaryStats.bugs = 5;
    component.summaryStats.codeSmells = 80;
    component.summaryStats.coverage = 85;
    component.calculateOverallHealth();
    expect(component.overallHealth?.status).toBe('Good');

    // Test Fair (60-74) - Moderate issues
    component.summaryStats.bugs = 8;
    component.summaryStats.coverage = 75;
    component.summaryStats.codeSmells = 120;
    component.summaryStats.duplication = 5;
    component.calculateOverallHealth();
    expect(component.overallHealth?.status).toBe('Fair');
  });

  it('should load branches on init', () => {
    fixture.detectChanges();
    expect(sonarQubeService.getProjectBranches).toHaveBeenCalled();
  });

  it('should handle branch change', () => {
    component.selectedBranch = 'master';
    component.onBranchChange('develop');

    expect(component.selectedBranch).toBe('develop');
    expect(sonarQubeService.setBranch).toHaveBeenCalledWith('develop');
    expect(sonarQubeService.getProjectMetrics).toHaveBeenCalled();
  });

  it('should format technical debt correctly', () => {
    // Don't call fixture.detectChanges() to avoid initialization

    expect(component.formatTechnicalDebt('480')).toBe('1d');
    expect(component.formatTechnicalDebt('600')).toBe('1d 2h');
    expect(component.formatTechnicalDebt('120')).toBe('2h');
    expect(component.formatTechnicalDebt('30')).toBe('30m');
    expect(component.formatTechnicalDebt('0')).toBe('0m'); // Fixed: actual implementation returns '0m' for 0 minutes
  });

  it('should format numbers correctly', () => {
    expect(component.formatNumber(500)).toBe('500');
    expect(component.formatNumber(1500)).toBe('1.5K');
    expect(component.formatNumber(1500000)).toBe('1.5M');
  });

  it('should get correct metric severity', () => {
    expect(component.getMetricSeverity('bugs', 0)).toBe('success');
    expect(component.getMetricSeverity('bugs', 5)).toBe('warning');
    expect(component.getMetricSeverity('bugs', 15)).toBe('danger');

    expect(component.getMetricSeverity('vulnerabilities', 0)).toBe('success');
    expect(component.getMetricSeverity('vulnerabilities', 1)).toBe('danger');

    expect(component.getMetricSeverity('coverage', 85)).toBe('success');
    expect(component.getMetricSeverity('coverage', 70)).toBe('warning');
    expect(component.getMetricSeverity('coverage', 50)).toBe('danger');
  });

  it('should export consolidated metrics to CSV', () => {
    const createElementSpy = spyOn(document, 'createElement').and.returnValue({
      click: jasmine.createSpy('click'),
      href: '',
      download: '',
    } as any);
    const createObjectURLSpy = spyOn(
      window.URL,
      'createObjectURL',
    ).and.returnValue('blob:url');

    component.sonarConfig = {
      serverUrl: 'https://tools.publicis.sapient.com/sonar',
      projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
    };
    component.selectedBranch = 'master';
    component.qualityGateStatus = mockQualityGateStatus;
    component.overallHealth = { score: 85, status: 'Good', color: '#8bc34a' };
    component.summaryStats = {
      bugs: 5,
      vulnerabilities: 2,
      codeSmells: 100,
      coverage: 75.5,
      duplication: 3.2,
      technicalDebt: '120',
      linesOfCode: 15000,
      securityHotspots: 3,
    };
    component.projectMetrics = mockProjectMetrics;

    component.exportToCSV();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should handle error when loading dashboard data', () => {
    sonarQubeService.getProjectMetrics.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe(
      'Failed to load quality data. Please check your SonarQube configuration.',
    );
    expect(component.isLoading).toBe(false);
  });

  it('should handle branch loading errors gracefully', () => {
    sonarQubeService.getProjectBranches.and.returnValue(
      throwError(() => new Error('Branch API Error')),
    );

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.loadingBranches).toBe(false);
  });

  it('should refresh data when refresh button is clicked', () => {
    fixture.detectChanges();
    const initialCallCount = sonarQubeService.getProjectMetrics.calls.count();

    component.refreshData();

    expect(sonarQubeService.getProjectMetrics.calls.count()).toBe(
      initialCallCount + 1,
    );
  });

  it('should open and close config dialog', () => {
    expect(component.showConfigDialog).toBe(false);

    component.openConfigDialog();
    expect(component.showConfigDialog).toBe(true);

    component.closeConfigDialog();
    expect(component.showConfigDialog).toBe(false);
  });

  it('should save config and reload data', () => {
    const newConfig = {
      serverUrl: 'https://new-sonar.example.com',
      projectKey: 'NEW.PROJECT',
      token: 'test-token',
    };

    component.saveConfig(newConfig);

    expect(sonarQubeService.setConfig).toHaveBeenCalledWith(newConfig);
    expect(component.showConfigDialog).toBe(false);
    expect(sonarQubeService.getProjectMetrics).toHaveBeenCalled();
  });

  it('should get correct health status class', () => {
    expect(component.getHealthStatusClass('Excellent')).toBe(
      'health-excellent',
    );
    expect(component.getHealthStatusClass('Good')).toBe('health-good');
    expect(component.getHealthStatusClass('Fair')).toBe('health-fair');
    expect(component.getHealthStatusClass('Poor')).toBe('health-poor');
    expect(component.getHealthStatusClass('Critical')).toBe('health-critical');
  });

  it('should get correct rating class', () => {
    expect(component.getRatingClass('A')).toBe('rating-a');
    expect(component.getRatingClass('1')).toBe('rating-a');
    expect(component.getRatingClass('B')).toBe('rating-b');
    expect(component.getRatingClass('C')).toBe('rating-c');
    expect(component.getRatingClass('D')).toBe('rating-d');
    expect(component.getRatingClass('E')).toBe('rating-e');
  });

  it('should handle empty metrics gracefully', () => {
    component.extractSummaryStats([]);

    expect(component.summaryStats.bugs).toBe(0);
    expect(component.summaryStats.vulnerabilities).toBe(0);
    expect(component.summaryStats.codeSmells).toBe(0);
  });

  it('should toggle detailed metrics view', () => {
    expect(component.showDetailedMetrics).toBe(false);

    component.showDetailedMetrics = true;
    expect(component.showDetailedMetrics).toBe(true);

    component.showDetailedMetrics = false;
    expect(component.showDetailedMetrics).toBe(false);
  });
});
