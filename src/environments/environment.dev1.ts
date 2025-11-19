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
  production: false,
  baseUrl: '', // Your dev1 backend URL
  SSO_LOGIN: false,
  CENTRAL_LOGIN_URL: '', // Your dev1 SSO URL if applicable
  CENTRAL_API_URL: '', // Your dev1 API URL
  RESOURCE: 'PSKnowHOW',
  AUTHENTICATION_SERVICE: false,
  SPEED_SUITE: false,
  MAP_URL: '',
  RETROS_URL: '',
  // Analytics configuration for dev1 - PostHog testing
  analytics: {
    provider: 'posthog', // PostHog for PO evaluation
    rolloutPercentage: 100, // 100% for testing environment
    // PostHog configuration
    posthog: {
      apiKey: '${POSTHOG_API_KEY}', // Will be replaced by deployment
      host: '${POSTHOG_HOST}', // Will be replaced by deployment
    },
    // Grafana Faro configuration (for future testing)
    faro: {
      url: '${FARO_COLLECTOR_URL}',
      appName: 'PSKnowHOW-Dev1',
      appVersion: '14.0.0',
    },
  },
};
