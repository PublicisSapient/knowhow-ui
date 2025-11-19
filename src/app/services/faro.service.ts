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
import { environment } from '../../environments/environment';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class FaroService {
  private faro: any;
  private isInitialized = false;

  constructor() {}

  async init(): Promise<void> {
    if (this.isInitialized || !environment.analytics.faro.url) {
      return;
    }

    try {
      // Dynamically import Faro to avoid bundling if not used
      const { initializeFaro, getWebInstrumentations } = await import(
        '@grafana/faro-web-sdk'
      );

      this.faro = initializeFaro({
        url: environment.analytics.faro.url,
        app: {
          name: environment.analytics.faro.appName,
          version: environment.analytics.faro.appVersion,
        },
        instrumentations: [
          ...getWebInstrumentations({
            captureConsole: true,
            captureConsoleDisabledLevels: [],
          }),
        ],
        sessionTracking: {
          enabled: true,
          persistent: true,
        },
      });

      this.isInitialized = true;
      console.log('Grafana Faro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Grafana Faro:', error);
    }
  }

  setPageLoad(data: any): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushEvent('page_load', {
      page_name: data.url,
      user_role: data.userRole,
      ui_type: data.uiType,
      server_instance: window.location.origin,
      server_version: data.version,
    });
  }

  setLoginMethod(data: any, loginType: string): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushEvent('login', {
      authentication_method: loginType,
      user_id: data.user_id,
    });

    // Set user context for session tracking
    this.faro?.api?.setUser({
      id: data.user_id,
      attributes: {
        authentication_method: loginType,
      },
    });
  }

  setProjectData(data: any[]): void {
    if (!this.isInitialized || !data?.length) return;

    data.forEach((project) => {
      this.faro?.api?.pushEvent('project_viewed', project);
    });
  }

  setProjectToolsData(data: any): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushEvent('project_tools_configured', data);
  }

  setKpiData(data: any): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushEvent('kpi_viewed', data);
  }

  createProjectData(data: any): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushEvent('project_created', data);
  }

  setUIType(data: any): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushEvent('ui_type_changed', data);
  }

  // Additional Faro-specific methods
  captureError(error: Error, context?: any): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushError(error, {
      context: 'manual_error_capture',
      ...context,
    });
  }

  captureLog(
    message: string,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
    context?: any,
  ): void {
    if (!this.isInitialized) return;

    this.faro?.api?.pushLog([message], {
      level,
      context: 'manual_log_capture',
      ...context,
    });
  }

  captureWebVitals(): void {
    if (!this.isInitialized) return;

    // Faro automatically captures web vitals through its instrumentations
    // This method is here for consistency with other analytics providers
  }

  startTrace(name: string): any {
    if (!this.isInitialized) return null;

    return this.faro?.api?.createTrace?.(name);
  }

  endTrace(trace: any): void {
    if (!this.isInitialized || !trace) return;

    trace?.end?.();
  }
}
