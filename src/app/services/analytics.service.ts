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
  ) {
    this.initializeAnalytics();

    // Start metrics collection only if user is in Grafana rollout
    if (this.useGrafanaAnalytics) {
      console.log(
        '[Analytics] 🚀 Grafana analytics enabled - metrics will be sent automatically when changed',
      );
      this.metrics.exposeMetricsEndpoint();
    } else {
      console.log('[Analytics] Grafana analytics disabled for this session');
    }
  }

  private initializeAnalytics(): void {
    // A/B Testing: Determine which analytics systems to use
    this.useGoogleAnalytics =
      environment.analytics?.enableGoogleAnalytics || false;

    // Determine if user should get Grafana analytics (A/B test)
    this.useGrafanaAnalytics = this.shouldUseGrafanaAnalytics();

    console.log('[Analytics] Initialized:', {
      googleAnalytics: this.useGoogleAnalytics,
      grafanaAnalytics: this.useGrafanaAnalytics,
      rolloutPercentage: environment.analytics?.grafanaRolloutPercentage,
    });
  }

  private shouldUseGrafanaAnalytics(): boolean {
    if (!environment.analytics?.enableGrafanaAnalytics) {
      console.log('[Analytics] Grafana analytics disabled in environment');
      return false;
    }

    // Use consistent rollout decision per session
    if (!sessionStorage.getItem('grafana_analytics_rollout')) {
      // eslint-disable-next-line no-restricted-syntax
      const random = Math.random() * 100; // NOSONAR: S2245 - Math.random is acceptable for A/B testing rollout
      const rolloutPercentage =
        environment.analytics?.grafanaRolloutPercentage || 0;
      const inRollout = random < rolloutPercentage;
      sessionStorage.setItem('grafana_analytics_rollout', inRollout.toString());
      console.log(
        `[Analytics] A/B Test: ${
          inRollout ? 'IN' : 'OUT'
        } of rollout (${random.toFixed(2)}% vs ${rolloutPercentage}%)`,
      );
      return inRollout;
    }

    const inRollout =
      sessionStorage.getItem('grafana_analytics_rollout') === 'true';
    console.log(
      `[Analytics] Using cached rollout decision: ${inRollout ? 'IN' : 'OUT'}`,
    );
    return inRollout;
  }

  setPageLoad(data: AnalyticsData): void {
    // A/B Testing: Send to appropriate analytics systems

    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setPageLoad(data);
      } catch (error) {
        console.error('Google Analytics setPageLoad error:', error);
      }
    }

    // Send to Grafana analytics if user is in rollout
    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackPageLoad(data); // Now uses same rich data as GA

        // Track page view count for session duration
        this.pageViewCount++;
      } catch (error) {
        console.error('Grafana Analytics setPageLoad error:', error);
      }
    }
  }

  setLoginMethod(data: AnalyticsData, loginType: string): void {
    this.userId = data.user_id || null;

    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setLoginMethod(data, loginType);
      } catch (error) {
        console.error('Google Analytics setLoginMethod error:', error);
      }
    }

    // Send to Grafana analytics if user is in rollout
    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackLoginMethod(data, loginType); // Now uses same rich data as GA

        // Track active user
        if (data.user_id) {
          this.metrics.trackActiveUser(
            data.user_id,
            data.userRole || localStorage.getItem('user_role') || 'unknown',
            false, // Not tracking new vs returning yet
          );

          // Start session timer
          this.sessionStartTime = Date.now();
          this.pageViewCount = 0;

          // Track session end on page unload
          window.addEventListener('beforeunload', () => this.trackSessionEnd());
        }
      } catch (error) {
        console.error('Grafana Analytics setLoginMethod error:', error);
      }
    }
  }

  setProjectData(data: any[]): void {
    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setProjectData(data);
      } catch (error) {
        console.error('Google Analytics setProjectData error:', error);
      }
    }

    // Send to Grafana analytics if user is in rollout
    if (this.useGrafanaAnalytics && data?.length) {
      try {
        this.metrics.trackProjectData(data); // Track selection pattern (how many projects)

        // Track individual project access for Top 5 Projects
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
    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setProjectToolsData(data);
      } catch (error) {
        console.error('Google Analytics setProjectToolsData error:', error);
      }
    }

    // Send to Grafana analytics if user is in rollout
    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackProjectToolsData(data); // Now uses same rich data as GA
      } catch (error) {
        console.error('Grafana Analytics setProjectToolsData error:', error);
      }
    }
  }

  setKpiData(data: any): void {
    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.setKpiData(data);
      } catch (error) {
        console.error('Google Analytics setKpiData error:', error);
      }
    }

    // Send to Grafana analytics if user is in rollout
    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackKpiData(data); // Now uses same rich data as GA
      } catch (error) {
        console.error('Grafana Analytics setKpiData error:', error);
      }
    }
  }

  createProjectData(data: any): void {
    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        this.googleAnalytics.createProjectData(data);
      } catch (error) {
        console.error('Google Analytics createProjectData error:', error);
      }
    }

    // Send to Grafana analytics if user is in rollout
    if (this.useGrafanaAnalytics) {
      try {
        this.metrics.trackCreateProjectData(data); // Now uses same rich data as GA
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
    // Send to Google Analytics if enabled
    if (this.useGoogleAnalytics) {
      try {
        // Google Analytics doesn't have built-in error tracking in our implementation
        // Could be extended to use GA4 exception tracking if needed
        console.debug('Error captured for Google Analytics:', error);
      } catch (gaError) {
        console.error('Google Analytics captureError error:', gaError);
      }
    }

    // Send to Grafana analytics if user is in rollout
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
