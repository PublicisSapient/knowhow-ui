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

export interface AnalyticsConfig {
  grafanaRolloutPercentage: number;
  enableGoogleAnalytics: boolean;
  enableGrafanaAnalytics: boolean;
  selfHosted: {
    enabled: boolean;
    metricsEndpoint: string;
    appName: string;
    appVersion: string;
  };
}

export interface Environment {
  production: boolean;
  baseUrl: string;
  SSO_LOGIN: boolean;
  CENTRAL_LOGIN_URL: string;
  CENTRAL_API_URL: string;
  RESOURCE: string;
  AUTHENTICATION_SERVICE: boolean;
  SPEED_SUITE: boolean;
  MAP_URL: string;
  RETROS_URL: string;
  MCP_URL: string;
  analytics?: AnalyticsConfig;
}
