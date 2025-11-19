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

import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class PostHogService {
  private posthog: any;
  private isInitialized = false;

  constructor(private ngZone: NgZone) {}

  async init(): Promise<void> {
    if (this.isInitialized || !environment.analytics.posthog.apiKey) {
      return;
    }

    try {
      // Dynamically import PostHog to avoid bundling if not used
      const { default: posthog } = await import('posthog-js');

      this.ngZone.runOutsideAngular(() => {
        posthog.init(environment.analytics.posthog.apiKey, {
          api_host: environment.analytics.posthog.host,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          session_recording: {
            maskAllInputs: true,
            maskTextSelector: '*',
          },
          autocapture: true,
          disable_web_experiments: false,
        });
      });

      this.posthog = posthog;
      this.isInitialized = true;
      console.log('PostHog initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  setPageLoad(data: any): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('$pageview', {
      $current_url: data.url,
      user_role: data.userRole,
      ui_type: data.uiType,
      server_instance: window.location.origin,
      server_version: data.version,
    });
  }

  setLoginMethod(data: any, loginType: string): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('login', {
      authentication_method: loginType,
      user_id: data.user_id,
    });

    // Identify the user for session tracking
    this.posthog?.identify(data.user_id, {
      authentication_method: loginType,
    });
  }

  setProjectData(data: any[]): void {
    if (!this.isInitialized || !data?.length) return;

    data.forEach((project) => {
      this.posthog?.capture('project_viewed', project);
    });
  }

  setProjectToolsData(data: any): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('project_tools_configured', data);
  }

  setKpiData(data: any): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('kpi_viewed', data);
  }

  createProjectData(data: any): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('project_created', data);
  }

  setUIType(data: any): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('ui_type_changed', data);
  }

  // Additional PostHog-specific methods
  captureError(error: Error, context?: any): void {
    if (!this.isInitialized) return;

    this.posthog?.capture('$exception', {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_stack_trace_raw: error.stack,
      ...context,
    });
  }

  startSessionRecording(): void {
    if (!this.isInitialized) return;

    this.posthog?.startSessionRecording();
  }

  stopSessionRecording(): void {
    if (!this.isInitialized) return;

    this.posthog?.stopSessionRecording();
  }

  captureWebVitals(): void {
    if (!this.isInitialized) return;

    // PostHog automatically captures web vitals when autocapture is enabled
    // This method is here for consistency with other analytics providers
  }
}
