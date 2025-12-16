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

import { Environment } from '../app/types/environment.types';

export const environment: Environment = {
  production: true,
  baseUrl: '//your-production-domain.com',
  SSO_LOGIN: true,
  CENTRAL_LOGIN_URL: 'https://your-central-login.com',
  CENTRAL_API_URL: 'https://your-central-api.com',
  RESOURCE: 'PSKnowHOW',
  AUTHENTICATION_SERVICE: true,
  SPEED_SUITE: true,
  MAP_URL: 'https://your-map-url.com',
  RETROS_URL: 'https://your-retros-url.com',

  // Analytics configuration - A/B Testing: GA + Self-hosted Grafana
  analytics: {
    // A/B Testing configuration - 10% rollout for production
    grafanaRolloutPercentage: 10, // 10% of users get Grafana analytics
    enableGoogleAnalytics: true, // Keep GA for 90% of users
    enableGrafanaAnalytics: true, // Enable self-hosted for 10%

    // Self-hosted analytics configuration
    selfHosted: {
      enabled: true,
      metricsEndpoint: '/api/metrics-proxy/send',
      appName: 'PSKnowHOW-Production',
      appVersion: '14.0.0',
    },
  },
};
