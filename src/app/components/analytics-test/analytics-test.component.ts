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

import { Component } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-analytics-test',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, MessageModule],
  template: `
    <div class="analytics-test-container p-4">
      <p-card
        header="Analytics Testing Dashboard"
        [style]="{ width: '100%', 'max-width': '800px', margin: '0 auto' }">
        <!-- Provider Info -->
        <div class="provider-info mb-4">
          <h3>Current Configuration</h3>
          <p><strong>Provider:</strong> {{ providerInfo.provider }}</p>
          <p>
            <strong>In Rollout:</strong>
            {{ providerInfo.inRollout ? 'Yes' : 'No' }}
          </p>
          <p-message
            *ngIf="providerInfo.provider !== 'google'"
            severity="info"
            text="You are using the new analytics provider!">
          </p-message>
        </div>

        <!-- Test Buttons -->
        <div class="test-buttons">
          <h3>Test Analytics Events</h3>
          <div class="button-grid">
            <p-button
              label="Test Page View"
              icon="pi pi-eye"
              (onClick)="testPageView()"
              class="mb-2">
            </p-button>

            <p-button
              label="Test Login Event"
              icon="pi pi-sign-in"
              (onClick)="testLogin()"
              class="mb-2">
            </p-button>

            <p-button
              label="Test Project View"
              icon="pi pi-folder"
              (onClick)="testProjectView()"
              class="mb-2">
            </p-button>

            <p-button
              label="Test KPI View"
              icon="pi pi-chart-line"
              (onClick)="testKpiView()"
              class="mb-2">
            </p-button>

            <p-button
              label="Test Error Capture"
              icon="pi pi-exclamation-triangle"
              severity="warning"
              (onClick)="testErrorCapture()"
              class="mb-2">
            </p-button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions mt-4">
          <h3>Testing Instructions</h3>
          <ul>
            <li>
              <strong>Google Analytics:</strong> Check browser Network tab for
              Google Analytics requests
            </li>
            <li>
              <strong>Grafana/Prometheus:</strong> Check metrics at
              http://localhost:9092/metrics
            </li>
            <li>
              Open browser DevTools Console to see initialization and event logs
            </li>
          </ul>
        </div>
      </p-card>
    </div>
  `,
  styles: [
    `
      .analytics-test-container {
        min-height: 100vh;
        background-color: #f8f9fa;
      }

      .button-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }

      .provider-info {
        background-color: #f1f3f4;
        padding: 1rem;
        border-radius: 4px;
      }

      .instructions {
        background-color: #e8f5e8;
        padding: 1rem;
        border-radius: 4px;
      }

      .instructions ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }

      .instructions li {
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class AnalyticsTestComponent {
  providerInfo: any;

  constructor(private analytics: AnalyticsService) {
    this.providerInfo = this.analytics.getProviderInfo();
  }

  testPageView(): void {
    console.log('Testing page view event...');
    this.analytics.setPageLoad({
      url: '/analytics-test',
      userRole: 'admin',
      uiType: 'New',
      version: '14.0.0',
    });
    console.log('Page view event sent');
  }

  testLogin(): void {
    console.log('Testing login event...');
    this.analytics.setLoginMethod(
      {
        user_id: 'test-user-123',
      },
      'standard',
    );
    console.log('Login event sent');
  }

  testProjectView(): void {
    console.log('Testing project view event...');
    this.analytics.setProjectData([
      {
        projectId: 'test-project-123',
        projectName: 'Analytics Test Project',
        projectType: 'Scrum',
      },
    ]);
    console.log('Project view event sent');
  }

  testKpiView(): void {
    console.log('Testing KPI view event...');
    this.analytics.setKpiData({
      kpiId: 'test-kpi-123',
      kpiName: 'Test KPI',
      kpiCategory: 'Quality',
    });
    console.log('KPI view event sent');
  }

  testErrorCapture(): void {
    console.log('Testing error capture...');
    const testError = new Error('This is a test error for analytics');
    this.analytics.captureError(testError, {
      component: 'analytics-test',
      action: 'manual-test',
      severity: 'low',
    });
    console.log('Error capture event sent');
  }
}
