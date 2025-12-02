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

import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    // Log to console first
    console.error('Global error caught:', error);

    try {
      // Get analytics service using injector to avoid circular dependency
      const analytics = this.injector.get(AnalyticsService, null);

      if (analytics) {
        // Capture error in analytics
        analytics.captureError(error, {
          source: 'global_error_handler',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      }
    } catch (analyticsError) {
      // Don't let analytics errors break the error handler
      console.warn('Failed to capture error in analytics:', analyticsError);
    }

    // Re-throw the error so it still appears in the console and other error handlers can process it
    throw error;
  }
}
