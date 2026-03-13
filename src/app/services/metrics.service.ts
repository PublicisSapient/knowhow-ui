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
 *
 ******************************************************************************/

import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MetricsService implements OnDestroy {
  private metrics: Map<string, number> = new Map();
  private isDirty = false;
  private sendTimeout: any = null;

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }
  }

  increment(metricName: string, labels: Record<string, string> = {}): void {
    const key = this.buildMetricKey(metricName, labels);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
    this.markDirty();
  }

  set(
    metricName: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    const key = this.buildMetricKey(metricName, labels);
    this.metrics.set(key, value);
    this.markDirty();
  }

  getPrometheusMetrics(): string {
    let output = '';

    output += `# Generated at ${new Date().toISOString()}\n`;

    for (const [key, value] of this.metrics.entries()) {
      output += `${key} ${value}\n`;
    }

    return output;
  }

  private markDirty(): void {
    this.isDirty = true;

    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
    }

    this.sendTimeout = setTimeout(() => {
      if (this.isDirty) {
        this.sendMetricsToBackend();
      }
    }, 5000);
  }

  private buildMetricKey(
    metricName: string,
    labels: Record<string, string>,
  ): string {
    if (Object.keys(labels).length === 0) {
      return metricName;
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `${metricName}{${labelPairs}}`;
  }

  private stripQueryParams(url: string): string {
    if (!url) return 'unknown';
    return url.split('?')[0].split('#')[0];
  }

  // Track page view with rich data (equivalent to GA setPageLoad)
  trackPageView(page: string, userRole?: string, version?: string): void {
    this.increment('page_views_total', {
      page: this.stripQueryParams(page),
      user_role: userRole || 'unknown',
      version: version || 'unknown',
    });
  }

  // Track page load with full analytics data (GA equivalent)
  trackPageLoad(data: any): void {
    this.increment('page_views_total', {
      page: this.stripQueryParams(data.url || 'unknown'),
      user_role: data.userRole || 'unknown',
      version: data.version || 'unknown',
    });
  }

  // Track login with rich data (GA equivalent)
  trackLogin(method: string, success: boolean): void {
    this.increment('login_attempts_total', {
      method,
      success: success.toString(),
    });
  }

  // Track login method with full data (GA setLoginMethod equivalent)
  trackLoginMethod(data: any, loginType: string): void {
    this.increment('user_sessions_total', {
      login_type: loginType,
      user_role: data.userRole || 'unknown',
      user_id: data.user_id || 'anonymous',
    });
  }

  // Track dashboard view
  trackDashboardView(dashboardType: string): void {
    this.increment('dashboard_views_total', { type: dashboardType });
  }

  // Track KPI interaction
  trackKpiInteraction(kpiType: string, action: string): void {
    this.increment('kpi_interactions_total', { kpi_type: kpiType, action });
  }

  // Track project data (GA setProjectData equivalent)
  trackProjectData(data: any[]): void {
    this.increment('project_interactions_total', {
      action: 'selection',
      project_count: data?.length?.toString() || '0',
    });
  }

  // Track project tools data (GA setProjectToolsData equivalent)
  trackProjectToolsData(data: any): void {
    this.increment('project_tools_interactions_total', {
      action: 'configuration',
      tools_configured: Object.keys(data || {}).length.toString(),
    });
  }

  // Track KPI data with rich context (GA setKpiData equivalent)
  trackKpiData(data: any): void {
    this.increment('kpi_detailed_interactions_total', {
      kpi_id: data?.kpiId || 'unknown',
      kpi_name: data?.kpiName || 'unknown',
      action: 'view',
      user_role: data?.userRole || 'unknown',
    });
  }

  // Track project creation (GA createProjectData equivalent)
  trackCreateProjectData(data: any): void {
    this.increment('project_creation_total', {
      project_name: data?.projectName || 'unknown',
      project_type: data?.projectType || 'unknown',
      user_role: data?.userRole || 'unknown',
    });
  }

  // Track error
  trackError(errorType: string, page: string): void {
    this.increment('errors_total', { error_type: errorType, page });
  }

  // Track error with rich context (for global error handler)
  trackErrorWithContext(error: any, context?: Record<string, any>): void {
    const errorType = error?.name || error?.constructor?.name || 'UnknownError';
    const page = context?.url || window.location.pathname;
    const errorMessage = error?.message || String(error);

    this.increment('errors_total', {
      error_type: errorType,
      page: page,
      source: context?.source || 'unknown',
    });

    // Track error details for debugging
    if (context) {
      this.increment('error_details_total', {
        error_type: errorType,
        user_agent: context.userAgent || 'unknown',
        timestamp: context.timestamp || new Date().toISOString(),
      });
    }
  }

  // === USER JOURNEY & ENGAGEMENT TRACKING (GA-equivalent) ===

  // Track active user (replicate GA active users)
  trackActiveUser(
    userId: string,
    userRole: string,
    isNewUser: boolean = false,
  ): void {
    this.increment('active_users_total', {
      user_id: userId,
      user_role: userRole,
      user_type: isNewUser ? 'new' : 'returning',
    });

    if (isNewUser) {
      this.increment('new_users_total', { user_role: userRole });
    } else {
      this.increment('returning_users_total', { user_role: userRole });
    }
  }

  // Track session duration (replicate GA session duration)
  trackSessionDuration(
    userId: string,
    durationSeconds: number,
    pagesViewed: number,
  ): void {
    this.set('session_duration_seconds', durationSeconds, {
      user_id: userId,
      duration_bucket: this.getDurationBucket(durationSeconds),
    });

    this.set('session_pages_viewed_total', pagesViewed, {
      user_id: userId,
      pages_bucket: this.getPagesBucket(pagesViewed),
    });

    // Track engagement level
    const isEngaged = durationSeconds > 10 && pagesViewed > 1;
    if (isEngaged) {
      this.increment('engaged_sessions_total', { user_id: userId });
    } else {
      this.increment('bounce_rate_events_total', { user_id: userId });
    }
  }

  // Track login method usage (replicate GA login method pie chart)
  trackLoginMethodUsage(
    method: string,
    userId: string,
    userRole: string,
  ): void {
    this.increment('login_method_usage_total', {
      method: method, // SAML, LDAP, STANDARD
      user_id: userId,
      user_role: userRole,
    });
  }

  // Track project access patterns (replicate GA project sessions)
  trackProjectAccess(
    projectId: string,
    projectName: string,
    userId: string,
    userRole: string,
  ): void {
    this.increment('project_access_events_total', {
      project_id: projectId,
      project_name: projectName,
      user_id: userId,
      user_role: userRole,
    });
  }

  // Track tab navigation (replicate GA active tab tracking)
  trackTabNavigation(tabName: string, userId: string, userRole: string): void {
    this.increment('tab_navigation_events_total', {
      tab_name: tabName, // iteration, release, backlog, etc.
      user_id: userId,
      user_role: userRole,
    });
  }

  // Track sprint workflow events (KnowHow-specific)
  trackSprintWorkflow(
    workflowType: string,
    action: string,
    userId: string,
    userRole: string,
  ): void {
    this.increment('sprint_workflow_events_total', {
      workflow_type: workflowType, // planning, review, retrospective
      action: action, // start, participate, complete
      user_id: userId,
      user_role: userRole,
    });
  }

  // === AI FEATURE TRACKING ===

  // Track AI Insights button click (Speed -> Sprint Goals -> Summarize AI)
  trackAiInsightsOpen(): void {
    this.increment('ai_insights_modal_open_total', {
      feature: 'sprint_goals_summary',
    });
  }

  // Track Generate Report button in AI Insights modal
  trackAiGenerateReport(reportType: string): void {
    this.increment('ai_generate_report_total', {
      report_type: reportType,
    });
  }

  // Track Recommended Next Actions click (Home)
  trackRecommendedActionClick(actionType: string): void {
    this.increment('ai_recommended_action_click_total', {
      action_type: actionType,
    });
  }

  // Track AI Chat questions (Home)
  trackAiChatQuestion(): void {
    this.increment('ai_chat_questions_total', {});
  }

  // Track AI Recommendations button click (Speed -> KPI)
  trackAiKpiRecommendation(kpiId: string): void {
    this.increment('ai_kpi_recommendation_click_total', {
      kpi_id: kpiId,
    });
  }

  // === PEB (Potential Economic Benefits) TRACKING ===

  // Track PEB page view
  trackPebPageView(): void {
    this.increment('peb_page_views_total', {});
  }

  // Track PEB page scroll
  trackPebPageScroll(scrollPercentage: string): void {
    this.increment('peb_page_scroll_total', {
      scroll_percentage: scrollPercentage,
    });
  }

  // Track PEB active time on page
  trackPebActiveTime(durationSeconds: number): void {
    this.set('peb_active_time_seconds', durationSeconds, {
      duration_bucket: this.getDurationBucket(durationSeconds),
    });
  }

  // Track Calculate PEB button click
  trackPebCalculate(): void {
    this.increment('peb_calculate_total', {});
  }

  // Track organization level dropdown change
  trackPebOrganizationLevelChange(level: string): void {
    this.increment('peb_organization_level_change_total', {
      level: level,
    });
  }

  trackReportSelection(reportName: string): void {
    this.increment('report_selection_total', {
      report_name: reportName || 'unknown',
    });
  }

  trackReportPrint(reportName: string): void {
    this.increment('report_print_total', {
      report_name: reportName || 'unknown',
    });
  }

  // Helper methods for bucketing
  private getDurationBucket(seconds: number): string {
    if (seconds < 30) return '0-30s';
    if (seconds < 60) return '30-60s';
    if (seconds < 300) return '1-5min';
    if (seconds < 900) return '5-15min';
    if (seconds < 1800) return '15-30min';
    return '30min+';
  }

  private getPagesBucket(pages: number): string {
    if (pages === 1) return '1-page';
    if (pages <= 3) return '2-3-pages';
    if (pages <= 5) return '4-5-pages';
    if (pages <= 10) return '6-10-pages';
    return '10+-pages';
  }

  // Expose metrics endpoint (for development)
  exposeMetricsEndpoint(): void {
    // Log metrics to console for debugging
    setInterval(() => {}, 30000); // Every 30 seconds

    // Also expose via window object for external scraping
    (window as any).getKnowHowMetrics = () => {
      return this.getPrometheusMetrics();
    };
  }

  sendMetricsToBackend(): void {
    if (!this.isDirty) {
      return;
    }

    const metrics = this.getPrometheusMetrics();

    localStorage.setItem('knowhow_metrics', metrics);
    localStorage.setItem('knowhow_metrics_timestamp', Date.now().toString());

    this.sendToPushgateway(metrics);
    this.isDirty = false;
  }

  private async sendToPushgateway(metrics: string): Promise<void> {
    try {
      const response = await fetch('/api/metrics-proxy/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics: metrics }),
      });

      if (!response.ok) {
        console.error('[Metrics] Failed to send metrics:', response.statusText);
      }
    } catch (error) {
      console.error('[Metrics] Error sending metrics to Pushgateway:', error);
    }
  }
}
