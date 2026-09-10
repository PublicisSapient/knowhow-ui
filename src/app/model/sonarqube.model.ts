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

/**
 * SonarQube Component Quality Metrics
 */
export interface SonarComponent {
  key: string;
  name: string;
  qualifier: string;
  path: string;
  language?: string;
  branch?: string;
}

export interface SonarMeasure {
  metric: string;
  value: string;
  bestValue?: boolean;
}

export interface ComponentMeasures {
  component: SonarComponent;
  measures: SonarMeasure[];
}

export interface SonarMetricsResponse {
  component: SonarComponent;
  measures: SonarMeasure[];
}

export interface QualityGateStatus {
  status: string;
  conditions: QualityGateCondition[];
  ignoredConditions: boolean;
}

export interface QualityGateCondition {
  status: string;
  metricKey: string;
  comparator: string;
  errorThreshold: string;
  actualValue: string;
}

export interface ComponentHealth {
  component: SonarComponent;
  metrics: {
    bugs: number;
    vulnerabilities: number;
    codeSmells: number;
    coverage: number;
    duplicatedLinesDensity: number;
    lines: number;
    sqaleRating: string;
    reliabilityRating: string;
    securityRating: string;
    securityReviewRating?: string;
    cognitiveComplexity?: number;
  };
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface ComponentTreeNode {
  component: ComponentHealth;
  children: ComponentTreeNode[];
  isExpanded?: boolean;
}

export interface SonarQubeConfig {
  serverUrl: string;
  projectKey: string;
  token?: string;
  branch?: string;
}

export interface BranchInfo {
  name: string;
  isMain: boolean;
  type: string;
  analysisDate?: string;
}

export interface MetricThresholds {
  bugs: { good: number; fair: number };
  vulnerabilities: { good: number; fair: number };
  codeSmells: { good: number; fair: number };
  coverage: { good: number; fair: number };
  duplicatedLinesDensity: { good: number; fair: number };
}

export const DEFAULT_METRIC_THRESHOLDS: MetricThresholds = {
  bugs: { good: 0, fair: 5 },
  vulnerabilities: { good: 0, fair: 3 },
  codeSmells: { good: 10, fair: 50 },
  coverage: { good: 80, fair: 60 },
  duplicatedLinesDensity: { good: 3, fair: 10 },
};

export const SONAR_METRICS = [
  'bugs',
  'vulnerabilities',
  'code_smells',
  'coverage',
  'duplicated_lines_density',
  'ncloc',
  'sqale_rating',
  'reliability_rating',
  'security_rating',
  'security_review_rating',
  'complexity',
  'cognitive_complexity',
];

export const METRIC_LABELS: { [key: string]: string } = {
  bugs: 'Bugs',
  vulnerabilities: 'Vulnerabilities',
  code_smells: 'Code Smells',
  coverage: 'Code Coverage',
  duplicated_lines_density: 'Duplicated Lines',
  ncloc: 'Lines of Code',
  sqale_rating: 'Maintainability',
  reliability_rating: 'Reliability',
  security_rating: 'Security',
  security_review_rating: 'Security Review',
  complexity: 'Complexity',
  cognitive_complexity: 'Cognitive Complexity',
};
