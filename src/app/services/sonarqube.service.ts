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

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import {
  SonarQubeConfig,
  SonarMetricsResponse,
  ComponentHealth,
  ComponentTreeNode,
  SONAR_METRICS,
  DEFAULT_METRIC_THRESHOLDS,
  QualityGateStatus,
  ComponentMeasures,
  BranchInfo,
} from '../model/sonarqube.model';

@Injectable({
  providedIn: 'root',
})
export class SonarQubeService {
  private config: SonarQubeConfig = {
    serverUrl: '',
    projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
  };

  constructor(private http: HttpClient) {
    this.loadConfigFromEnvironment();
  }

  private loadConfigFromEnvironment(): void {
    const storedConfig = localStorage.getItem('sonarQubeConfig');
    if (storedConfig) {
      this.config = JSON.parse(storedConfig);
    }
  }

  setConfig(config: SonarQubeConfig): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('sonarQubeConfig', JSON.stringify(this.config));
  }

  getConfig(): SonarQubeConfig {
    return { ...this.config };
  }

  private getApiUrl(): string {
    // Use proxy for development to avoid CORS issues
    // Proxy is configured in proxy.conf.json as /sonar/api/*
    if (this.config.serverUrl.includes('localhost')) {
      // Direct connection for localhost SonarQube
      return this.config.serverUrl;
    } else {
      // Use proxy for external SonarQube servers
      return '/sonar';
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (this.config.token) {
      const auth = btoa(`${this.config.token}:`);
      headers = headers.set('Authorization', `Basic ${auth}`);
    }

    return headers;
  }

  getQualityGateStatus(): Observable<QualityGateStatus> {
    const url = `${this.getApiUrl()}/api/qualitygates/project_status`;
    let params = new HttpParams().set('projectKey', this.config.projectKey);
    params = this.addBranchParam(params);

    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map((response) => response.projectStatus),
      catchError((error) => {
        console.error('Error fetching quality gate status:', error);
        return of(null);
      }),
    );
  }

  getProjectMetrics(): Observable<SonarMetricsResponse> {
    const url = `${this.getApiUrl()}/api/measures/component`;
    let params = new HttpParams()
      .set('component', this.config.projectKey)
      .set('metricKeys', SONAR_METRICS.join(','));
    params = this.addBranchParam(params);

    return this.http
      .get<SonarMetricsResponse>(url, { headers: this.getHeaders(), params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching project metrics:', error);
          return of(null);
        }),
      );
  }

  getComponentTree(
    baseComponentKey?: string,
    qualifier: string = 'DIR',
  ): Observable<ComponentMeasures[]> {
    const url = `${this.getApiUrl()}/api/measures/component_tree`;
    const component = baseComponentKey || this.config.projectKey;

    let params = new HttpParams()
      .set('component', component)
      .set('metricKeys', SONAR_METRICS.join(','))
      .set('strategy', 'children');

    if (qualifier) {
      params = params.set('qualifiers', qualifier);
    }

    params = this.addBranchParam(params);

    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map((response) => {
        if (response && response.components) {
          return response.components.map((comp) => ({
            component: comp,
            measures: comp.measures || [],
          }));
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching component tree:', error);
        return of([]);
      }),
    );
  }

  getAllComponents(): Observable<ComponentHealth[]> {
    const srcComponentKey = `${this.config.projectKey}:src`;

    return this.getComponentTree(srcComponentKey, 'DIR').pipe(
      switchMap((directories) => {
        const dirHealths = directories.map((dir) =>
          this.calculateComponentHealth(dir),
        );
        return of(dirHealths);
      }),
      catchError((error) => {
        console.error('Error fetching all components:', error);
        return of([]);
      }),
    );
  }

  buildComponentTree(components: ComponentHealth[]): ComponentTreeNode[] {
    const tree: ComponentTreeNode[] = [];
    const componentMap = new Map<string, ComponentTreeNode>();

    const sortedComponents = components.sort((a, b) => {
      const depthA = (a.component.path?.split('/') || []).length;
      const depthB = (b.component.path?.split('/') || []).length;
      return depthA - depthB;
    });

    sortedComponents.forEach((health) => {
      const node: ComponentTreeNode = {
        component: health,
        children: [],
        isExpanded: false,
      };

      componentMap.set(health.component.key, node);

      const path = health.component.path || '';
      const pathParts = path.split('/');

      if (pathParts.length <= 1 || !path.startsWith('src/')) {
        tree.push(node);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parentKey = `${this.config.projectKey}:${parentPath}`;
        const parent = componentMap.get(parentKey);

        if (parent) {
          parent.children.push(node);
        } else {
          tree.push(node);
        }
      }
    });

    return tree;
  }

  private calculateComponentHealth(
    componentMeasures: ComponentMeasures,
  ): ComponentHealth {
    const { component, measures } = componentMeasures;

    const getMetricValue = (metricKey: string): number => {
      const measure = measures.find((m) => m.metric === metricKey);
      return measure ? parseFloat(measure.value) || 0 : 0;
    };

    const getMetricString = (metricKey: string): string => {
      const measure = measures.find((m) => m.metric === metricKey);
      return measure ? measure.value : 'A';
    };

    const metrics = {
      bugs: getMetricValue('bugs'),
      vulnerabilities: getMetricValue('vulnerabilities'),
      codeSmells: getMetricValue('code_smells'),
      coverage: getMetricValue('coverage'),
      duplicatedLinesDensity: getMetricValue('duplicated_lines_density'),
      lines: getMetricValue('ncloc'),
      sqaleRating: getMetricString('sqale_rating'),
      reliabilityRating: getMetricString('reliability_rating'),
      securityRating: getMetricString('security_rating'),
      securityReviewRating: getMetricString('security_review_rating'),
      cognitiveComplexity: getMetricValue('cognitive_complexity'),
    };

    const healthScore = this.calculateHealthScore(metrics);
    const healthStatus = this.getHealthStatus(healthScore);

    return {
      component,
      metrics,
      healthScore,
      healthStatus,
    };
  }

  private calculateHealthScore(metrics: any): number {
    let score = 100;
    const thresholds = DEFAULT_METRIC_THRESHOLDS;

    if (metrics.bugs > thresholds.bugs.fair) {
      score -= Math.min(20, metrics.bugs * 2);
    } else if (metrics.bugs > thresholds.bugs.good) {
      score -= Math.min(10, metrics.bugs);
    }

    if (metrics.vulnerabilities > thresholds.vulnerabilities.fair) {
      score -= Math.min(25, metrics.vulnerabilities * 5);
    } else if (metrics.vulnerabilities > thresholds.vulnerabilities.good) {
      score -= Math.min(15, metrics.vulnerabilities * 3);
    }

    if (metrics.codeSmells > thresholds.codeSmells.fair) {
      score -= Math.min(15, metrics.codeSmells / 10);
    } else if (metrics.codeSmells > thresholds.codeSmells.good) {
      score -= Math.min(10, metrics.codeSmells / 20);
    }

    if (metrics.coverage < thresholds.coverage.fair) {
      score -= Math.min(20, (thresholds.coverage.fair - metrics.coverage) / 3);
    } else if (metrics.coverage < thresholds.coverage.good) {
      score -= Math.min(10, (thresholds.coverage.good - metrics.coverage) / 2);
    }

    if (
      metrics.duplicatedLinesDensity > thresholds.duplicatedLinesDensity.fair
    ) {
      score -= Math.min(10, metrics.duplicatedLinesDensity);
    } else if (
      metrics.duplicatedLinesDensity > thresholds.duplicatedLinesDensity.good
    ) {
      score -= Math.min(5, metrics.duplicatedLinesDensity / 2);
    }

    const ratingPenalty = this.getRatingPenalty([
      metrics.sqaleRating,
      metrics.reliabilityRating,
      metrics.securityRating,
    ]);
    score -= ratingPenalty;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private getRatingPenalty(ratings: string[]): number {
    const ratingValues = {
      A: 0,
      '1': 0,
      B: 2,
      '2': 2,
      C: 4,
      '3': 4,
      D: 6,
      '4': 6,
      E: 8,
      '5': 8,
    };
    return ratings.reduce((penalty, rating) => {
      return penalty + (ratingValues[rating] || 0);
    }, 0);
  }

  private getHealthStatus(
    score: number,
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  filterComponentsByHealth(
    components: ComponentHealth[],
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical',
  ): ComponentHealth[] {
    return components.filter((c) => c.healthStatus === status);
  }

  getProblematicComponents(
    components: ComponentHealth[],
    limit: number = 10,
  ): ComponentHealth[] {
    return components
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, limit);
  }

  // Branch-related methods
  getProjectBranches(): Observable<BranchInfo[]> {
    const url = `${this.getApiUrl()}/api/project_branches/list`;
    const params = new HttpParams().set('project', this.config.projectKey);

    return this.http.get<any>(url, { headers: this.getHeaders(), params }).pipe(
      map((response) => {
        if (response && response.branches) {
          return response.branches.map((branch: any) => ({
            name: branch.name,
            isMain: branch.isMain || false,
            type: branch.type || 'BRANCH',
            analysisDate: branch.analysisDate,
          }));
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching branches:', error);
        // Return a default branch if API fails
        return of([{ name: 'master', isMain: true, type: 'BRANCH' }]);
      }),
    );
  }

  setBranch(branch: string): void {
    this.config.branch = branch;
    localStorage.setItem('sonarQubeConfig', JSON.stringify(this.config));
  }

  getCurrentBranch(): string {
    return this.config.branch || 'master';
  }

  private addBranchParam(params: HttpParams): HttpParams {
    if (this.config.branch) {
      return params.set('branch', this.config.branch);
    }
    return params;
  }
}
