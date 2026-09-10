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

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SonarQubeService } from '../../services/sonarqube.service';
import {
  ComponentHealth,
  ComponentTreeNode,
  QualityGateStatus,
  SonarQubeConfig,
  METRIC_LABELS,
  BranchInfo,
} from '../../model/sonarqube.model';

@Component({
  selector: 'app-quality-dashboard',
  templateUrl: './quality-dashboard.component.html',
  styleUrls: ['./quality-dashboard.component.css'],
})
export class QualityDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Configuration
  showConfigDialog = false;
  sonarConfig: SonarQubeConfig;

  // Branch selection
  branches: BranchInfo[] = [];
  selectedBranch: string = '';
  loadingBranches = false;

  // Data - Consolidated project-level metrics
  projectMetrics: any = null;
  qualityGateStatus: QualityGateStatus | null = null;
  overallHealth: {
    score: number;
    status: string;
    color: string;
  } | null = null;

  // Summary statistics
  summaryStats = {
    bugs: 0,
    vulnerabilities: 0,
    codeSmells: 0,
    coverage: 0,
    duplication: 0,
    technicalDebt: '',
    linesOfCode: 0,
    securityHotspots: 0,
  };

  // View options
  showDetailedMetrics = false;

  // Loading states
  isLoading = false;
  errorMessage = '';

  // Chart data
  healthDistribution: { status: string; count: number; color: string }[] = [];
  metricLabels = METRIC_LABELS;

  constructor(private sonarQubeService: SonarQubeService) {
    this.sonarConfig = this.sonarQubeService.getConfig();
  }

  ngOnInit(): void {
    if (this.sonarConfig.serverUrl) {
      this.selectedBranch = this.sonarQubeService.getCurrentBranch();
      this.loadBranches();
      this.loadDashboardData();
    } else {
      this.showConfigDialog = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load consolidated project-level metrics
    this.sonarQubeService
      .getProjectMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.measures) {
            this.projectMetrics = response;
            this.extractSummaryStats(response.measures);
            this.calculateOverallHealth();
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage =
            'Failed to load quality data. Please check your SonarQube configuration.';
          this.isLoading = false;
          console.error('Error loading dashboard data:', error);
        },
      });

    // Load quality gate status
    this.sonarQubeService
      .getQualityGateStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.qualityGateStatus = status;
        },
        error: (error) => {
          console.error('Error loading quality gate status:', error);
        },
      });
  }

  extractSummaryStats(measures: any[]): void {
    const getValue = (metric: string): number => {
      const measure = measures.find((m) => m.metric === metric);
      return measure ? parseFloat(measure.value) || 0 : 0;
    };

    const getStringValue = (metric: string): string => {
      const measure = measures.find((m) => m.metric === metric);
      return measure ? measure.value || '0' : '0';
    };

    this.summaryStats = {
      bugs: getValue('bugs'),
      vulnerabilities: getValue('vulnerabilities'),
      codeSmells: getValue('code_smells'),
      coverage: getValue('coverage'),
      duplication: getValue('duplicated_lines_density'),
      technicalDebt: getStringValue('sqale_index'),
      linesOfCode: getValue('ncloc'),
      securityHotspots: getValue('security_hotspots'),
    };
  }

  calculateOverallHealth(): void {
    // Calculate health score based on metrics (0-100)
    let score = 100;

    // Deduct points for bugs (severe impact)
    score -= Math.min(this.summaryStats.bugs * 2, 30);

    // Deduct points for vulnerabilities (severe impact)
    score -= Math.min(this.summaryStats.vulnerabilities * 3, 30);

    // Deduct points for code smells (moderate impact)
    score -= Math.min(this.summaryStats.codeSmells * 0.1, 20);

    // Deduct points for low coverage
    if (this.summaryStats.coverage < 80) {
      score -= (80 - this.summaryStats.coverage) * 0.5;
    }

    // Deduct points for high duplication
    if (this.summaryStats.duplication > 5) {
      score -= (this.summaryStats.duplication - 5) * 2;
    }

    // Ensure score is within 0-100 range
    score = Math.max(0, Math.min(100, score));

    // Determine status and color
    let status: string;
    let color: string;

    if (score >= 90) {
      status = 'Excellent';
      color = '#4caf50';
    } else if (score >= 75) {
      status = 'Good';
      color = '#8bc34a';
    } else if (score >= 60) {
      status = 'Fair';
      color = '#ffc107';
    } else if (score >= 40) {
      status = 'Poor';
      color = '#ff9800';
    } else {
      status = 'Critical';
      color = '#f44336';
    }

    this.overallHealth = { score: Math.round(score), status, color };
  }

  // Utility methods for formatting
  formatTechnicalDebt(minutes: string): string {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) return '0d';

    const days = Math.floor(mins / (8 * 60));
    const hours = Math.floor((mins % (8 * 60)) / 60);

    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getMetricSeverity(metric: string, value: number): string {
    switch (metric) {
      case 'bugs':
        return value === 0 ? 'success' : value < 10 ? 'warning' : 'danger';
      case 'vulnerabilities':
        return value === 0 ? 'success' : 'danger';
      case 'codeSmells':
        return value < 50 ? 'success' : value < 200 ? 'warning' : 'danger';
      case 'coverage':
        return value >= 80 ? 'success' : value >= 60 ? 'warning' : 'danger';
      case 'duplication':
        return value < 3 ? 'success' : value < 5 ? 'warning' : 'danger';
      default:
        return 'info';
    }
  }

  getHealthStatusClass(status: string): string {
    const classMap = {
      Excellent: 'health-excellent',
      Good: 'health-good',
      Fair: 'health-fair',
      Poor: 'health-poor',
      Critical: 'health-critical',
    };
    return classMap[status] || '';
  }

  getRatingClass(rating: string): string {
    const classMap = {
      A: 'rating-a',
      '1': 'rating-a',
      B: 'rating-b',
      '2': 'rating-b',
      C: 'rating-c',
      '3': 'rating-c',
      D: 'rating-d',
      '4': 'rating-d',
      E: 'rating-e',
      '5': 'rating-e',
    };
    return classMap[rating] || 'rating-unknown';
  }

  openConfigDialog(): void {
    this.showConfigDialog = true;
  }

  saveConfig(config: SonarQubeConfig): void {
    this.sonarQubeService.setConfig(config);
    this.sonarConfig = config;
    this.showConfigDialog = false;
    this.loadDashboardData();
  }

  closeConfigDialog(): void {
    this.showConfigDialog = false;
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  exportToCSV(): void {
    if (!this.projectMetrics) return;

    const projectName = this.sonarConfig.projectKey;
    const branch = this.selectedBranch || 'default';
    const timestamp = new Date().toISOString();

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Project', projectName],
      ['Branch', branch],
      ['Export Date', timestamp],
      ['Quality Gate', this.qualityGateStatus?.status || 'N/A'],
      ['Overall Health Score', this.overallHealth?.score.toString() || 'N/A'],
      ['Overall Health Status', this.overallHealth?.status || 'N/A'],
      ['Bugs', this.summaryStats.bugs.toString()],
      ['Vulnerabilities', this.summaryStats.vulnerabilities.toString()],
      ['Security Hotspots', this.summaryStats.securityHotspots.toString()],
      ['Code Smells', this.summaryStats.codeSmells.toString()],
      ['Coverage (%)', this.summaryStats.coverage.toFixed(2)],
      ['Duplication (%)', this.summaryStats.duplication.toFixed(2)],
      [
        'Technical Debt',
        this.formatTechnicalDebt(this.summaryStats.technicalDebt),
      ],
      ['Lines of Code', this.formatNumber(this.summaryStats.linesOfCode)],
    ];

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sonarqube-quality-report-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Branch-related methods
  loadBranches(): void {
    this.loadingBranches = true;
    this.sonarQubeService
      .getProjectBranches()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (branches) => {
          this.branches = branches;
          this.loadingBranches = false;
          // Set default branch if not set
          if (!this.selectedBranch && branches.length > 0) {
            const mainBranch = branches.find((b) => b.isMain);
            this.selectedBranch = mainBranch
              ? mainBranch.name
              : branches[0].name;
          }
        },
        (error) => {
          console.error('Error loading branches:', error);
          this.loadingBranches = false;
          // Set default branch on error
          if (!this.selectedBranch) {
            this.selectedBranch = 'master';
          }
        },
      );
  }

  onBranchChange(branch: string): void {
    this.selectedBranch = branch;
    this.sonarQubeService.setBranch(branch);
    this.loadDashboardData();
  }

  getCurrentBranchName(): string {
    return this.selectedBranch || 'master';
  }
}
