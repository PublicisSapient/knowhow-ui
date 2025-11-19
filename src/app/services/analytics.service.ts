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
import { PostHogService } from './posthog.service';
import { FaroService } from './faro.service';
import { environment } from '../../environments/environment';
import { AnalyticsProvider } from '../types/environment.types';

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
  private currentProvider: AnalyticsProvider = 'google';
  private isUserInRollout = false;
  private userId: string | null = null;

  constructor(
    private googleAnalytics: GoogleAnalyticsService,
    private postHog: PostHogService,
    private faro: FaroService,
  ) {
    this.initializeProvider();
  }

  private initializeProvider(): void {
    this.currentProvider =
      (environment.analytics?.provider as AnalyticsProvider) || 'google';

    // Determine if user should be in rollout for new analytics
    if (
      this.currentProvider !== 'google' &&
      this.currentProvider !== 'disabled'
    ) {
      this.isUserInRollout = this.shouldIncludeUserInRollout();
    }

    // Initialize the appropriate service
    this.initializeServices();
  }

  private shouldIncludeUserInRollout(): boolean {
    // Use a deterministic approach based on session or user ID
    // For now, use a simple random approach that's consistent per session
    if (!sessionStorage.getItem('analytics_rollout_decision')) {
      const random = Math.random() * 100;
      const inRollout =
        random < (environment.analytics?.rolloutPercentage || 0);
      sessionStorage.setItem(
        'analytics_rollout_decision',
        inRollout.toString(),
      );
      return inRollout;
    }
    return sessionStorage.getItem('analytics_rollout_decision') === 'true';
  }

  private async initializeServices(): Promise<void> {
    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        await this.postHog.init();
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        await this.faro.init();
      }
      // Google Analytics is already initialized via the existing mechanism
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
      // Fallback to Google Analytics
      this.currentProvider = 'google';
      this.isUserInRollout = false;
    }
  }

  setPageLoad(data: AnalyticsData): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.setPageLoad(data);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.setPageLoad(data);
      } else {
        // Default to Google Analytics
        this.googleAnalytics.setPageLoad(data);
      }
    } catch (error) {
      console.error('Analytics setPageLoad error:', error);
      // Fallback to Google Analytics
      this.googleAnalytics.setPageLoad(data);
    }
  }

  setLoginMethod(data: AnalyticsData, loginType: string): void {
    if (this.currentProvider === 'disabled') return;

    this.userId = data.user_id || null;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.setLoginMethod(data, loginType);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.setLoginMethod(data, loginType);
      } else {
        this.googleAnalytics.setLoginMethod(data, loginType);
      }
    } catch (error) {
      console.error('Analytics setLoginMethod error:', error);
      this.googleAnalytics.setLoginMethod(data, loginType);
    }
  }

  setProjectData(data: any[]): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.setProjectData(data);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.setProjectData(data);
      } else {
        this.googleAnalytics.setProjectData(data);
      }
    } catch (error) {
      console.error('Analytics setProjectData error:', error);
      this.googleAnalytics.setProjectData(data);
    }
  }

  setProjectToolsData(data: any): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.setProjectToolsData(data);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.setProjectToolsData(data);
      } else {
        this.googleAnalytics.setProjectToolsData(data);
      }
    } catch (error) {
      console.error('Analytics setProjectToolsData error:', error);
      this.googleAnalytics.setProjectToolsData(data);
    }
  }

  setKpiData(data: any): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.setKpiData(data);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.setKpiData(data);
      } else {
        this.googleAnalytics.setKpiData(data);
      }
    } catch (error) {
      console.error('Analytics setKpiData error:', error);
      this.googleAnalytics.setKpiData(data);
    }
  }

  createProjectData(data: any): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.createProjectData(data);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.createProjectData(data);
      } else {
        this.googleAnalytics.createProjectData(data);
      }
    } catch (error) {
      console.error('Analytics createProjectData error:', error);
      this.googleAnalytics.createProjectData(data);
    }
  }

  setUIType(data: any): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.setUIType(data);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.setUIType(data);
      } else {
        this.googleAnalytics.setUIType(data);
      }
    } catch (error) {
      console.error('Analytics setUIType error:', error);
      this.googleAnalytics.setUIType(data);
    }
  }

  // Additional methods for new analytics providers
  captureError(error: Error, context?: any): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.captureError(error, context);
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.captureError(error, context);
      }
      // Google Analytics doesn't have a direct error capture method
    } catch (captureError) {
      console.error('Analytics captureError failed:', captureError);
    }
  }

  captureWebVitals(): void {
    if (this.currentProvider === 'disabled') return;

    try {
      if (this.currentProvider === 'posthog' && this.isUserInRollout) {
        this.postHog.captureWebVitals();
      } else if (this.currentProvider === 'faro' && this.isUserInRollout) {
        this.faro.captureWebVitals();
      }
      // Google Analytics web vitals would need separate implementation
    } catch (error) {
      console.error('Analytics captureWebVitals error:', error);
    }
  }

  // Utility methods
  getCurrentProvider(): AnalyticsProvider {
    return this.currentProvider;
  }

  isInRollout(): boolean {
    return this.isUserInRollout;
  }

  getProviderInfo(): { provider: AnalyticsProvider; inRollout: boolean } {
    return {
      provider: this.currentProvider,
      inRollout: this.isUserInRollout,
    };
  }
}
