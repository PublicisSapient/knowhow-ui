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
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BackendAnalyticsService {
  private baseUrl = environment.baseUrl || 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  // Track page view
  trackPageView(page: string, userRole: string = 'unknown'): void {
    const metric = {
      page: page,
      userRole: userRole,
      timestamp: Date.now(),
    };

    this.http
      .post(`${this.baseUrl}/metrics-collection/page-view`, metric)
      .subscribe({
        next: () => console.log('✅ Page view tracked:', page),
        error: (error) => console.error('❌ Error tracking page view:', error),
      });
  }

  // Track user session
  trackUserSession(userRole: string, sessionType: string = 'active'): void {
    const metric = {
      userRole: userRole,
      sessionType: sessionType,
      timestamp: Date.now(),
    };

    this.http
      .post(`${this.baseUrl}/metrics-collection/user-session`, metric)
      .subscribe({
        next: () => console.log('✅ User session tracked:', userRole),
        error: (error) =>
          console.error('❌ Error tracking user session:', error),
      });
  }

  // Track dashboard interaction
  trackDashboardInteraction(
    dashboardType: string,
    action: string,
    userRole: string = 'unknown',
  ): void {
    const metric = {
      dashboardType: dashboardType,
      action: action,
      userRole: userRole,
      timestamp: Date.now(),
    };

    this.http
      .post(`${this.baseUrl}/metrics-collection/dashboard-interaction`, metric)
      .subscribe({
        next: () =>
          console.log(
            '✅ Dashboard interaction tracked:',
            dashboardType,
            action,
          ),
        error: (error) =>
          console.error('❌ Error tracking dashboard interaction:', error),
      });
  }

  // Track performance
  trackPerformance(
    page: string,
    loadTime: number,
    userRole: string = 'unknown',
  ): void {
    const metric = {
      page: page,
      loadTime: loadTime,
      userRole: userRole,
      timestamp: Date.now(),
    };

    this.http
      .post(`${this.baseUrl}/metrics-collection/performance`, metric)
      .subscribe({
        next: () =>
          console.log('✅ Performance tracked:', page, loadTime + 'ms'),
        error: (error) =>
          console.error('❌ Error tracking performance:', error),
      });
  }

  // Track error
  trackError(
    errorType: string,
    page: string,
    errorMessage: string,
    userRole: string = 'unknown',
  ): void {
    const metric = {
      errorType: errorType,
      page: page,
      errorMessage: errorMessage,
      userRole: userRole,
      timestamp: Date.now(),
    };

    this.http
      .post(`${this.baseUrl}/metrics-collection/error`, metric)
      .subscribe({
        next: () => console.log('✅ Error tracked:', errorType),
        error: (error) => console.error('❌ Error tracking error:', error),
      });
  }
}
