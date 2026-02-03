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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleAnalyticsService } from './google-analytics.service';
import { MetricsService } from './metrics.service';
import { environment } from '../../environments/environment';

interface AnalyticsData {
  url?: string;
  userRole?: string;
  uiType?: string;
  version?: string;
  user_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private useGrafanaAnalytics = false;
  private useGoogleAnalytics = false;
  private userId: string | null = null;
  private sessionStartTime: number | null = null;
  private pageViewCount = 0;

  constructor(
    private googleAnalytics: GoogleAnalyticsService,
    private metrics: MetricsService,
    private http: HttpClient,
  ) {
    this.initializeWithDefaults();
    this.loadAnalyticsConfig();
  }

  private loadAnalyticsConfig(): void {
    const configUrl = environment.baseUrl + '/api/configDetails';
    this.http.get<any>(configUrl).subscribe({
      next: (response) => {
        const config = response?.data?.analytics || response?.analytics;
        if (config) {
          this.initializeAnalytics(
            config.analyticsGrafanaRolloutPercentage || 0,
            config.isAnalyticsGoogleEnabled || false,
            config.isAnalyticsGrafanaEnabled || false,
          );
        }
      },
    });
  }

  private initializeWithDefaults(): void {
    this.initializeAnalytics(
      environment.analytics?.grafanaRolloutPercentage || 40,
      environment.analytics?.enableGoogleAnalytics || true,
      environment.analytics?.enableGrafanaAnalytics || true,
    );
  }

  private initializeAnalytics(
    rolloutPercentage: number,
    enableGoogle: boolean,
    enableGrafana: boolean,
  ): void {
    this.useGoogleAnalytics = enableGoogle;
    this.useGrafanaAnalytics = this.shouldUseGrafanaAnalytics(
      rolloutPercentage,
      enableGrafana,
    );

    console.debug('[Analytics] Initialized:', {
      grafanaAnalytics: this.useGrafanaAnalytics ? 'IN' : 'OUT',
      rolloutPercentage: rolloutPercentage,
    });

    if (this.useGrafanaAnalytics) {
      this.metrics.exposeMetricsEndpoint();
    }
  }

  private shouldUseGrafanaAnalytics(
    rolloutPercentage: number,
    enableGrafana: boolean,
  ): boolean {
    if (!enableGrafana) {
      return false;
    }

    if (!sessionStorage.getItem('grafana_analytics_rollout')) {
      // eslint-disable-next-line no-restricted-syntax
      const random = Math.random() * 100; // NOSONAR: S2245 - Math.random is acceptable for A/B testing rollout
      const inRollout = random < rolloutPercentage;
      sessionStorage.setItem('grafana_analytics_rollout', inRollout.toString());
      return inRollout;
    }

    const inRollout =
      sessionStorage.getItem('grafana_analytics_rollout') === 'true';
    return inRollout;
  }

  load(...scripts: string[]): Promise<any[]> {
    return this.googleAnalytics.load(...scripts);
  }

  setPageLoad(data: AnalyticsData): void {
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setPageLoad(data);
      } catch (error) {
        console.error('Google Analytics setPageLoad error:', error);
      }
    }

    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackPageLoad(data);
        this.pageViewCount++;
      } catch (error) {
        console.error('Grafana Analytics setPageLoad error:', error);
      }
    }
  }

  setLoginMethod(data: AnalyticsData, loginType: string): void {
    this.userId = data.user_id || null;

    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setLoginMethod(data, loginType);
      } catch (error) {
        console.error('Google Analytics setLoginMethod error:', error);
      }
    }

    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackLoginMethod(data, loginType);

        if (data.user_id) {
          this.metrics.trackActiveUser(
            data.user_id,
            data.userRole || localStorage.getItem('user_role') || 'unknown',
            false,
          );

          this.sessionStartTime = Date.now();
          this.pageViewCount = 0;
          window.addEventListener('beforeunload', () => this.trackSessionEnd());
        }
      } catch (error) {
        console.error('Grafana Analytics setLoginMethod error:', error);
      }
    }
  }

  setProjectData(data: any[]): void {
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setProjectData(data);
      } catch (error) {
        console.error('Google Analytics setProjectData error:', error);
      }
    }

    if (this.useGrafanaAnalytics && data?.length) {
      try {
        this.metrics.trackProjectData(data);

        if (this.userId) {
          data.forEach((project: any) => {
            this.metrics.trackProjectAccess(
              project.id || project.projectId || 'unknown',
              project.projectName || project.name || 'unknown',
              this.userId!,
              localStorage.getItem('user_role') || 'unknown',
            );
          });
        }
      } catch (error) {
        console.error('Grafana Analytics setProjectData error:', error);
      }
    }
  }

  setProjectToolsData(data: any): void {
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setProjectToolsData(data);
      } catch (error) {
        console.error('Google Analytics setProjectToolsData error:', error);
      }
    }

    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackProjectToolsData(data);
      } catch (error) {
        console.error('Grafana Analytics setProjectToolsData error:', error);
      }
    }
  }

  setKpiData(data: any): void {
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setKpiData(data);
      } catch (error) {
        console.error('Google Analytics setKpiData error:', error);
      }
    }

    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackKpiData(data);
      } catch (error) {
        console.error('Grafana Analytics setKpiData error:', error);
      }
    }
  }

  createProjectData(data: any): void {
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.createProjectData(data);
      } catch (error) {
        console.error('Google Analytics createProjectData error:', error);
      }
    }

    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackCreateProjectData(data);
      } catch (error) {
        console.error('Grafana Analytics createProjectData error:', error);
      }
    }
  }

  trackTabNavigation(tabName: string): void {
    if (this.useGrafanaAnalytics && this.userId) {
      try {
        this.metrics.trackTabNavigation(
          tabName,
          this.userId,
          localStorage.getItem('user_role') || 'unknown',
        );
      } catch (error) {
        console.error('Grafana Analytics trackTabNavigation error:', error);
      }
    }
  }

  private trackSessionEnd(): void {
    if (this.useGrafanaAnalytics && this.userId && this.sessionStartTime) {
      try {
        const durationSeconds = Math.floor(
          (Date.now() - this.sessionStartTime) / 1000,
        );
        this.metrics.trackSessionDuration(
          this.userId,
          durationSeconds,
          this.pageViewCount,
        );
      } catch (error) {
        console.error('Grafana Analytics trackSessionEnd error:', error);
      }
    }
  }

  captureError(error: any, context?: Record<string, any>): void {
    if (this.useGoogleAnalytics) {
      try {
        console.debug('Error captured for Google Analytics:', error);
      } catch (gaError) {
        console.error('Google Analytics captureError error:', gaError);
      }
    }

    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackErrorWithContext(error, context);
      } catch (metricsError) {
        console.error('Grafana Analytics captureError error:', metricsError);
      }
    }
  }

  getProviderInfo(): any {
    return {
      useGoogleAnalytics: this.useGoogleAnalytics,
      useGrafanaAnalytics: this.useGrafanaAnalytics,
      userId: this.userId,
    };
  }
}
