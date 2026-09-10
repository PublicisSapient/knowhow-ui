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
 *******************************************************************************/

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SonarQubeService } from './sonarqube.service';
import { SonarQubeConfig, ComponentHealth } from '../model/sonarqube.model';

describe('SonarQubeService', () => {
  let service: SonarQubeService;
  let httpMock: HttpTestingController;

  const mockConfig: SonarQubeConfig = {
    serverUrl: 'https://sonarqube.test.com',
    projectKey: 'TEST.PROJECT',
    token: 'test-token',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SonarQubeService],
    });

    service = TestBed.inject(SonarQubeService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration Management', () => {
    it('should set and get config', () => {
      service.setConfig(mockConfig);
      const config = service.getConfig();
      expect(config.serverUrl).toBe(mockConfig.serverUrl);
      expect(config.projectKey).toBe(mockConfig.projectKey);
    });

    it('should persist config to localStorage', () => {
      service.setConfig(mockConfig);
      const stored = localStorage.getItem('sonarQubeConfig');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.serverUrl).toBe(mockConfig.serverUrl);
    });

    it('should load config from localStorage on init', () => {
      localStorage.setItem('sonarQubeConfig', JSON.stringify(mockConfig));
      const newService = new SonarQubeService(
        TestBed.inject(HttpClientTestingModule) as any,
      );
      const config = newService.getConfig();
      expect(config.serverUrl).toBe(mockConfig.serverUrl);
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      service.setConfig(mockConfig);
    });

    it('should fetch quality gate status', () => {
      const mockResponse = {
        projectStatus: {
          status: 'OK',
          conditions: [],
          ignoredConditions: false,
        },
      };

      service.getQualityGateStatus().subscribe((status) => {
        expect(status).toEqual(mockResponse.projectStatus);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/qualitygates/project_status'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch project metrics', () => {
      const mockResponse = {
        component: {
          key: 'TEST.PROJECT',
          name: 'Test Project',
          qualifier: 'TRK',
          path: '',
        },
        measures: [
          { metric: 'bugs', value: '5' },
          { metric: 'vulnerabilities', value: '2' },
          { metric: 'coverage', value: '85.5' },
        ],
      };

      service.getProjectMetrics().subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.measures.length).toBe(3);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/measures/component'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch component tree', () => {
      const mockResponse = {
        components: [
          {
            key: 'TEST.PROJECT:src/app',
            name: 'app',
            qualifier: 'DIR',
            path: 'src/app',
            measures: [
              { metric: 'bugs', value: '2' },
              { metric: 'coverage', value: '75.0' },
            ],
          },
        ],
      };

      service.getComponentTree('TEST.PROJECT:src').subscribe((components) => {
        expect(components.length).toBe(1);
        expect(components[0].component.name).toBe('app');
        expect(components[0].measures.length).toBe(2);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/measures/component_tree'),
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include authorization header when token is provided', () => {
      service.getProjectMetrics().subscribe();

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/measures/component'),
      );

      expect(req.request.headers.has('Authorization')).toBe(true);
      const authHeader = req.request.headers.get('Authorization');
      expect(authHeader).toContain('Basic');

      req.flush({ component: {}, measures: [] });
    });

    it('should handle API errors gracefully', () => {
      service.getQualityGateStatus().subscribe({
        next: (status) => {
          expect(status).toBeNull();
        },
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/api/qualitygates/project_status'),
      );
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Health Calculation', () => {
    it('should calculate excellent health for clean component', () => {
      const componentMeasures = {
        component: {
          key: 'TEST:src/clean',
          name: 'clean',
          qualifier: 'DIR',
          path: 'src/clean',
        },
        measures: [
          { metric: 'bugs', value: '0' },
          { metric: 'vulnerabilities', value: '0' },
          { metric: 'code_smells', value: '5' },
          { metric: 'coverage', value: '90' },
          { metric: 'duplicated_lines_density', value: '1' },
          { metric: 'ncloc', value: '100' },
          { metric: 'sqale_rating', value: 'A' },
          { metric: 'reliability_rating', value: 'A' },
          { metric: 'security_rating', value: 'A' },
        ],
      };

      const health = (service as any).calculateComponentHealth(
        componentMeasures,
      );
      expect(health.healthScore).toBeGreaterThanOrEqual(90);
      expect(health.healthStatus).toBe('excellent');
    });

    it('should calculate critical health for problematic component', () => {
      const componentMeasures = {
        component: {
          key: 'TEST:src/bad',
          name: 'bad',
          qualifier: 'DIR',
          path: 'src/bad',
        },
        measures: [
          { metric: 'bugs', value: '15' },
          { metric: 'vulnerabilities', value: '8' },
          { metric: 'code_smells', value: '100' },
          { metric: 'coverage', value: '20' },
          { metric: 'duplicated_lines_density', value: '25' },
          { metric: 'ncloc', value: '500' },
          { metric: 'sqale_rating', value: 'E' },
          { metric: 'reliability_rating', value: 'E' },
          { metric: 'security_rating', value: 'E' },
        ],
      };

      const health = (service as any).calculateComponentHealth(
        componentMeasures,
      );
      expect(health.healthScore).toBeLessThan(40);
      expect(health.healthStatus).toBe('critical');
    });
  });

  describe('Component Tree Building', () => {
    it('should build hierarchical component tree', () => {
      const components: ComponentHealth[] = [
        {
          component: {
            key: 'TEST:src',
            name: 'src',
            qualifier: 'DIR',
            path: 'src',
          },
          metrics: {} as any,
          healthScore: 85,
          healthStatus: 'good',
        },
        {
          component: {
            key: 'TEST:src/app',
            name: 'app',
            qualifier: 'DIR',
            path: 'src/app',
          },
          metrics: {} as any,
          healthScore: 80,
          healthStatus: 'good',
        },
      ];

      const tree = service.buildComponentTree(components);
      expect(tree.length).toBeGreaterThan(0);
      expect(tree[0].component).toEqual(components[0]);
    });
  });

  describe('Filtering and Sorting', () => {
    const mockComponents: ComponentHealth[] = [
      {
        component: {
          key: '1',
          name: 'comp1',
          qualifier: 'DIR',
          path: 'src/comp1',
        },
        metrics: {
          bugs: 0,
          vulnerabilities: 0,
          codeSmells: 5,
          coverage: 95,
          duplicatedLinesDensity: 1,
        } as any,
        healthScore: 95,
        healthStatus: 'excellent',
      },
      {
        component: {
          key: '2',
          name: 'comp2',
          qualifier: 'DIR',
          path: 'src/comp2',
        },
        metrics: {
          bugs: 10,
          vulnerabilities: 5,
          codeSmells: 50,
          coverage: 40,
          duplicatedLinesDensity: 15,
        } as any,
        healthScore: 35,
        healthStatus: 'critical',
      },
      {
        component: {
          key: '3',
          name: 'comp3',
          qualifier: 'DIR',
          path: 'src/comp3',
        },
        metrics: {
          bugs: 2,
          vulnerabilities: 1,
          codeSmells: 20,
          coverage: 75,
          duplicatedLinesDensity: 5,
        } as any,
        healthScore: 70,
        healthStatus: 'fair',
      },
    ];

    it('should filter components by health status', () => {
      const excellentComponents = service.filterComponentsByHealth(
        mockComponents,
        'excellent',
      );
      expect(excellentComponents.length).toBe(1);
      expect(excellentComponents[0].healthStatus).toBe('excellent');
    });

    it('should get problematic components', () => {
      const problematic = service.getProblematicComponents(mockComponents, 2);
      expect(problematic.length).toBe(2);
      expect(problematic[0].healthScore).toBeLessThanOrEqual(
        problematic[1].healthScore,
      );
    });
  });
});
