#!/usr/bin/env node

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
 * SonarQube Helper Script
 * 
 * This script helps extract and analyze SonarQube quality metrics.
 * It can be run as part of CI/CD to generate quality reports.
 * 
 * Usage:
 *   node scripts/sonarqube-helper.js --mode=report
 *   node scripts/sonarqube-helper.js --mode=check --threshold=75
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  reportTaskPath: '.sonar/report-task.txt',
  outputDir: 'quality-reports',
  healthThreshold: 75, // Minimum acceptable health score
};

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value || true;
  return acc;
}, {});

const mode = args.mode || 'report';
const threshold = parseInt(args.threshold) || CONFIG.healthThreshold;

/**
 * Read SonarQube report task file
 */
function readReportTask() {
  try {
    const content = fs.readFileSync(CONFIG.reportTaskPath, 'utf-8');
    const data = {};
    
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        data[key] = value.trim();
      }
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error reading report-task.txt:', error.message);
    console.log('💡 Make sure to run "npm run sonar" first');
    process.exit(1);
  }
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: token ? {
        'Authorization': `Basic ${Buffer.from(token + ':').toString('base64')}`
      } : {}
    };
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

/**
 * Calculate health score based on metrics
 */
function calculateHealthScore(metrics) {
  let score = 100;
  
  // Bugs penalty (max -20)
  if (metrics.bugs > 5) score -= Math.min(20, metrics.bugs * 2);
  else if (metrics.bugs > 0) score -= Math.min(10, metrics.bugs);
  
  // Vulnerabilities penalty (max -25)
  if (metrics.vulnerabilities > 3) score -= Math.min(25, metrics.vulnerabilities * 5);
  else if (metrics.vulnerabilities > 0) score -= Math.min(15, metrics.vulnerabilities * 3);
  
  // Code smells penalty (max -15)
  if (metrics.codeSmells > 50) score -= Math.min(15, metrics.codeSmells / 10);
  else if (metrics.codeSmells > 10) score -= Math.min(10, metrics.codeSmells / 20);
  
  // Coverage penalty (max -20)
  if (metrics.coverage < 60) score -= Math.min(20, (60 - metrics.coverage) / 3);
  else if (metrics.coverage < 80) score -= Math.min(10, (80 - metrics.coverage) / 2);
  
  // Duplication penalty (max -10)
  if (metrics.duplication > 10) score -= Math.min(10, metrics.duplication);
  else if (metrics.duplication > 3) score -= Math.min(5, metrics.duplication / 2);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fetch project metrics from SonarQube
 */
async function fetchProjectMetrics(serverUrl, projectKey, token) {
  const metricsUrl = `${serverUrl}/api/measures/component?component=${projectKey}&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,ncloc,sqale_rating,reliability_rating,security_rating`;
  
  try {
    const response = await makeRequest(metricsUrl, token);
    
    if (!response.component || !response.component.measures) {
      throw new Error('Invalid metrics response');
    }
    
    const measures = response.component.measures.reduce((acc, measure) => {
      acc[measure.metric] = parseFloat(measure.value) || measure.value;
      return acc;
    }, {});
    
    return {
      bugs: measures.bugs || 0,
      vulnerabilities: measures.vulnerabilities || 0,
      codeSmells: measures.code_smells || 0,
      coverage: measures.coverage || 0,
      duplication: measures.duplicated_lines_density || 0,
      lines: measures.ncloc || 0,
      maintainability: measures.sqale_rating || 'A',
      reliability: measures.reliability_rating || 'A',
      security: measures.security_rating || 'A'
    };
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    throw error;
  }
}

/**
 * Generate quality report
 */
async function generateReport() {
  console.log('📊 Generating Quality Report...\n');
  
  const reportTask = readReportTask();
  const serverUrl = reportTask.serverUrl;
  const projectKey = reportTask.projectKey;
  const token = process.env.SONAR_TOKEN;
  
  console.log(`🔍 Server: ${serverUrl}`);
  console.log(`📦 Project: ${projectKey}\n`);
  
  const metrics = await fetchProjectMetrics(serverUrl, projectKey, token);
  const healthScore = calculateHealthScore(metrics);
  
  // Determine health status
  let status = 'Critical';
  if (healthScore >= 90) status = 'Excellent';
  else if (healthScore >= 75) status = 'Good';
  else if (healthScore >= 60) status = 'Fair';
  else if (healthScore >= 40) status = 'Poor';
  
  // Print report
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  HEALTH SCORE: ${healthScore}/100 (${status})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📋 Metrics:');
  console.log(`  🐛 Bugs:             ${metrics.bugs}`);
  console.log(`  🛡️  Vulnerabilities:  ${metrics.vulnerabilities}`);
  console.log(`  💩 Code Smells:      ${metrics.codeSmells}`);
  console.log(`  ✅ Coverage:         ${metrics.coverage.toFixed(1)}%`);
  console.log(`  📋 Duplication:      ${metrics.duplication.toFixed(1)}%`);
  console.log(`  📏 Lines of Code:    ${metrics.lines}\n`);
  
  console.log('⭐ Ratings:');
  console.log(`  Maintainability:     ${metrics.maintainability}`);
  console.log(`  Reliability:         ${metrics.reliability}`);
  console.log(`  Security:            ${metrics.security}\n`);
  
  // Save report to file
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(CONFIG.outputDir, `quality-report-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    healthScore,
    status,
    metrics,
    serverUrl,
    projectKey
  }, null, 2));
  
  console.log(`💾 Report saved to: ${reportPath}`);
  
  return { healthScore, status, metrics };
}

/**
 * Check if health score meets threshold
 */
async function checkThreshold() {
  console.log(`🔍 Checking Health Threshold (${threshold})...\n`);
  
  const { healthScore, status } = await generateReport();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (healthScore >= threshold) {
    console.log(`✅ PASSED: Health score ${healthScore} meets threshold ${threshold}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } else {
    console.log(`❌ FAILED: Health score ${healthScore} below threshold ${threshold}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 View detailed metrics at: /#/dashboard/Quality');
    process.exit(1);
  }
}

/**
 * Main execution
 */
(async function main() {
  try {
    if (mode === 'report') {
      await generateReport();
    } else if (mode === 'check') {
      await checkThreshold();
    } else {
      console.error('❌ Invalid mode. Use --mode=report or --mode=check');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
