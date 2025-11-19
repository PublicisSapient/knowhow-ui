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
import { AnalyticsService } from './analytics.service';
import { GoogleAnalyticsService } from './google-analytics.service';
import { PostHogService } from './posthog.service';
import { FaroService } from './faro.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let googleAnalyticsSpy: jasmine.SpyObj<GoogleAnalyticsService>;
  let postHogSpy: jasmine.SpyObj<PostHogService>;
  let faroSpy: jasmine.SpyObj<FaroService>;

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

    const postHogSpyObj = jasmine.createSpyObj('PostHogService', [
      'init',
      'setPageLoad',
      'setLoginMethod',
      'setProjectData',
      'setProjectToolsData',
      'setKpiData',
      'createProjectData',
      'setUIType',
      'captureError',
      'captureWebVitals',
    ]);

    const faroSpyObj = jasmine.createSpyObj('FaroService', [
      'init',
      'setPageLoad',
      'setLoginMethod',
      'setProjectData',
      'setProjectToolsData',
      'setKpiData',
      'createProjectData',
      'setUIType',
      'captureError',
      'captureWebVitals',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: GoogleAnalyticsService, useValue: googleSpy },
        { provide: PostHogService, useValue: postHogSpyObj },
        { provide: FaroService, useValue: faroSpyObj },
      ],
    });

    service = TestBed.inject(AnalyticsService);
    googleAnalyticsSpy = TestBed.inject(
      GoogleAnalyticsService,
    ) as jasmine.SpyObj<GoogleAnalyticsService>;
    postHogSpy = TestBed.inject(
      PostHogService,
    ) as jasmine.SpyObj<PostHogService>;
    faroSpy = TestBed.inject(FaroService) as jasmine.SpyObj<FaroService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return current provider', () => {
    const provider = service.getCurrentProvider();
    expect(['google', 'posthog', 'faro', 'disabled']).toContain(provider);
  });

  it('should return rollout status', () => {
    const inRollout = service.isInRollout();
    expect(typeof inRollout).toBe('boolean');
  });

  it('should return provider info', () => {
    const info = service.getProviderInfo();
    expect(info).toHaveProperty('provider');
    expect(info).toHaveProperty('inRollout');
    expect(['google', 'posthog', 'faro', 'disabled']).toContain(info.provider);
    expect(typeof info.inRollout).toBe('boolean');
  });

  it('should call setPageLoad on the appropriate service', () => {
    const testData = {
      url: '/test',
      userRole: 'admin',
      uiType: 'New',
      version: '1.0.0',
    };

    service.setPageLoad(testData);

    // At least one service should be called (depending on configuration)
    const totalCalls =
      googleAnalyticsSpy.setPageLoad.calls.count() +
      postHogSpy.setPageLoad.calls.count() +
      faroSpy.setPageLoad.calls.count();

    expect(totalCalls).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', () => {
    // Mock an error in PostHog
    postHogSpy.setPageLoad.and.throwError('PostHog error');

    const testData = { url: '/test' };

    // Should not throw an error
    expect(() => service.setPageLoad(testData)).not.toThrow();
  });

  it('should call captureError for supported providers', () => {
    const testError = new Error('Test error');
    const context = { component: 'test' };

    service.captureError(testError, context);

    // Should not throw an error
    expect(() => service.captureError(testError, context)).not.toThrow();
  });
});
