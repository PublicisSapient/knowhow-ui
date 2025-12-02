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

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import { GoogleAnalyticsService } from './google-analytics.service';
import { MetricsService } from './metrics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let googleAnalyticsSpy: jasmine.SpyObj<GoogleAnalyticsService>;
  let metricsSpy: jasmine.SpyObj<MetricsService>;

  beforeEach(() => {
    const googleSpy = jasmine.createSpyObj('GoogleAnalyticsService', [
      'setPageLoad',
      'setLoginMethod',
      'setProjectData',
      'setProjectToolsData',
      'setKpiData',
      'createProjectData',
      'setUIType',
    ]);

    const metricsSpyObj = jasmine.createSpyObj('MetricsService', [
      'increment',
      'set',
      'sendMetricsToBackend',
      'exposeMetricsEndpoint',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AnalyticsService,
        { provide: GoogleAnalyticsService, useValue: googleSpy },
        { provide: MetricsService, useValue: metricsSpyObj },
      ],
    });

    service = TestBed.inject(AnalyticsService);
    googleAnalyticsSpy = TestBed.inject(
      GoogleAnalyticsService,
    ) as jasmine.SpyObj<GoogleAnalyticsService>;
    metricsSpy = TestBed.inject(
      MetricsService,
    ) as jasmine.SpyObj<MetricsService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call setPageLoad on Google Analytics when enabled', () => {
    const testData = {
      url: '/test',
      userRole: 'admin',
      uiType: 'New',
      version: '1.0.0',
    };

    service.setPageLoad(testData);

    // Google Analytics should be called
    expect(googleAnalyticsSpy.setPageLoad).toHaveBeenCalled();
  });

  it('should handle errors gracefully', () => {
    googleAnalyticsSpy.setPageLoad.and.throwError('GA error');

    const testData = { url: '/test' };

    // Should not throw an error
    expect(() => service.setPageLoad(testData)).not.toThrow();
  });

  it('should call captureError', () => {
    const testError = new Error('Test error');
    const context = { component: 'test' };

    // Should not throw an error
    expect(() => service.captureError(testError, context)).not.toThrow();
  });
});
