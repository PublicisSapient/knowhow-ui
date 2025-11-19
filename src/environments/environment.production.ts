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
  baseUrl: '',
  SSO_LOGIN: false,
  CENTRAL_LOGIN_URL: '',
  CENTRAL_API_URL: '',
  RESOURCE: 'PSKnowHOW',
  AUTHENTICATION_SERVICE: false,
  SPEED_SUITE: false,
  MAP_URL: '',
  RETROS_URL: '',
  // Analytics configuration for production
  analytics: {
    provider: 'google', // 'google' | 'posthog' | 'faro' | 'disabled'
    rolloutPercentage: 10, // Percentage of users to include in new analytics
    // PostHog configuration
    posthog: {
      apiKey: '${POSTHOG_API_KEY}', // Set via environment variables
      host: '${POSTHOG_HOST}', // e.g., 'https://us.i.posthog.com'
    },
    // Grafana Faro configuration
    faro: {
      url: '${FARO_COLLECTOR_URL}', // Set via environment variables
      appName: 'PSKnowHOW',
      appVersion: '14.0.0',
    },
  },
};
