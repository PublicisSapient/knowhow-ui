# Component-Wise Quality Dashboard - Setup Guide

## Overview

The **Component-Wise Quality Dashboard** is an internal quality monitoring tool that integrates with SonarQube to provide component-level health visualization. Instead of just seeing "project passed" or "failed", you can now identify specific components (like the Slingshot Dashboard) with high code smell density or low test coverage before they reach a pull request.

## Features

✅ **Component-Level Health Scoring**: Automated health score (0-100) for each component based on:
- Bugs
- Vulnerabilities  
- Code Smells
- Code Coverage
- Code Duplication
- SonarQube Ratings (Reliability, Security, Maintainability)

✅ **Multiple View Modes**:
- **Grid View**: Card-based layout with visual health indicators
- **List View**: Sortable table with detailed metrics
- **Tree View**: Hierarchical component structure

✅ **Advanced Filtering**:
- Filter by health status (Excellent, Good, Fair, Poor, Critical)
- Search by component name or path
- Show only problematic components
- Sort by various metrics

✅ **Quality Gate Integration**: Real-time quality gate status from SonarQube

✅ **Export Functionality**: Export filtered data to CSV for reporting

✅ **Visual Health Distribution**: See at a glance how your components are distributed across health levels

## Architecture

### Files Created

```
src/
├── app/
│   ├── model/
│   │   └── sonarqube.model.ts                 # TypeScript interfaces and constants
│   ├── services/
│   │   └── sonarqube.service.ts               # SonarQube API integration service
│   └── dashboard/
│       └── quality-dashboard/
│           ├── quality-dashboard.component.ts  # Main component logic
│           ├── quality-dashboard.component.html # Template
│           ├── quality-dashboard.component.css  # Styles
│           └── quality-dashboard.component.spec.ts # Unit tests
```

### Health Scoring Algorithm

The health score is calculated out of 100 points with the following weights:

- **Bugs**: -20 points maximum (higher bugs = more penalty)
- **Vulnerabilities**: -25 points maximum (critical for security)
- **Code Smells**: -15 points maximum  
- **Code Coverage**: -20 points maximum (coverage below 80% penalized)
- **Duplication**: -10 points maximum
- **Ratings (Maintainability/Reliability/Security)**: -10 points maximum

**Health Status Classification**:
- **Excellent**: 90-100 points
- **Good**: 75-89 points
- **Fair**: 60-74 points
- **Poor**: 40-59 points
- **Critical**: 0-39 points

## Setup Instructions

### 1. Prerequisites

- SonarQube server running and accessible
- Project already analyzed by SonarQube (via `SonarQG.sh` and `sonar-project.properties`)
- SonarQube authentication token (optional but recommended)

### 2. Generate SonarQube Token

1. Log into your SonarQube server
2. Navigate to: **User Account → Security → Generate Tokens**
3. Create a new token with name: `knowhow-quality-dashboard`
4. Copy the token (you won't see it again)

### 3. Configure the Dashboard

When you first open the Quality Dashboard, you'll see a configuration dialog.

**Required Fields**:
- **SonarQube Server URL**: Your SonarQube server URL (e.g., `https://sonarqube.example.com`)
- **Project Key**: Your project key (default: `ENGINEERING.KPIDASHBOARD.UI`)

**Optional Field**:
- **Authentication Token**: Your SonarQube token for secure API access

The configuration is stored in `localStorage` so you won't need to re-enter it.

### 4. Access the Dashboard

Navigate to: `/#/dashboard/Quality`

Or add it to your navigation menu.

## Usage Guide

### View Modes

#### Grid View (Default)
Displays components as cards with:
- Component name and path
- Health score badge
- Key metrics (Bugs, Vulnerabilities, Code Smells, Coverage, Duplication)
- Rating badges (Reliability, Security, Maintainability)

#### List View
Tabular view with:
- Sortable columns
- Visual coverage bar
- Compact rating display
- Better for scanning many components

#### Tree View
Hierarchical structure showing:
- Component parent-child relationships
- Health scores at each level
- Expandable/collapsible nodes

### Filtering and Search

**Filter by Health Status**:
```
All | Excellent | Good | Fair | Poor | Critical
```

**Search**:
Type component name or path fragment to filter results.

**Show Only Problematic**:
Checkbox to show only components with:
- Bugs > 0
- Vulnerabilities > 0  
- Code Smells > 10

### Exporting Data

Click the **Export to CSV** button to download filtered data including:
- Component name and path
- Health score and status
- All metrics (bugs, vulnerabilities, code smells, coverage, duplication, lines)

Filename format: `quality-dashboard-YYYY-MM-DD.csv`

## Integration with CI/CD

### Current Workflow
```bash
# 1. Run SonarQube analysis
npm run sonar

# 2. Check quality gate (existing SonarQG.sh)
./SonarQG.sh .sonar/report-task.txt

# 3. View component-level details in dashboard
# Navigate to: /#/dashboard/Quality
```

### Enhanced Workflow (Future)

You could enhance the CI/CD pipeline to:

1. **Fail builds on critical components**:
   ```bash
   # Parse component health from SonarQube API
   # Fail if any component has health score < 40
   ```

2. **Generate quality reports**:
   ```bash
   # Auto-export CSV after each build
   # Archive as build artifact
   ```

3. **Track quality trends**:
   ```bash
   # Store health scores over time
   # Alert on degrading components
   ```

## Customization

### Adjust Health Thresholds

Edit `src/app/model/sonarqube.model.ts`:

```typescript
export const DEFAULT_METRIC_THRESHOLDS: MetricThresholds = {
  bugs: { good: 0, fair: 5 },              // Adjust these values
  vulnerabilities: { good: 0, fair: 3 },
  codeSmells: { good: 10, fair: 50 },
  coverage: { good: 80, fair: 60 },
  duplicatedLinesDensity: { good: 3, fair: 10 }
};
```

### Modify Health Scoring

Edit `src/app/services/sonarqube.service.ts`:

Find the `calculateHealthScore()` method and adjust penalty weights.

### Add Custom Metrics

1. Add metric to `SONAR_METRICS` array in `sonarqube.model.ts`
2. Update `ComponentHealth` interface to include new metric
3. Modify `calculateComponentHealth()` to extract the metric
4. Update templates to display the new metric

## SonarQube API Reference

### Endpoints Used

1. **Quality Gate Status**
   ```
   GET /api/qualitygates/project_status?projectKey={key}
   ```

2. **Project Metrics**
   ```
   GET /api/measures/component?component={key}&metricKeys={metrics}
   ```

3. **Component Tree**
   ```
   GET /api/measures/component_tree?component={key}&metricKeys={metrics}&strategy=children&qualifiers=DIR
   ```

### Metrics Retrieved

- `bugs` - Number of bugs
- `vulnerabilities` - Number of vulnerabilities
- `code_smells` - Number of code smells
- `coverage` - Code coverage percentage
- `duplicated_lines_density` - Duplication percentage
- `ncloc` - Lines of code
- `sqale_rating` - Maintainability rating (A-E)
- `reliability_rating` - Reliability rating (A-E)
- `security_rating` - Security rating (A-E)
- `security_review_rating` - Security review rating (A-E)
- `cognitive_complexity` - Cognitive complexity

## Troubleshooting

### "Failed to load quality data"

**Possible Causes**:
1. SonarQube server URL is incorrect
2. Project key doesn't match
3. Network/CORS issues
4. Authentication required but token not provided

**Solutions**:
- Verify server URL is accessible: `curl <sonarqube-url>/api/system/status`
- Check project key in SonarQube UI
- Add CORS headers to SonarQube if needed
- Generate and add authentication token

### "No components found"

**Possible Causes**:
1. Project hasn't been analyzed by SonarQube yet
2. No `src/` directory in the project structure
3. Project key mismatch

**Solutions**:
- Run `npm run sonar` to analyze the project
- Verify `src/` directory exists and has been analyzed
- Check SonarQube UI for analyzed components

### CORS Errors

If accessing SonarQube from different domain:

**Option 1: Configure SonarQube CORS** (Recommended)
Add to `sonar.properties`:
```properties
sonar.web.cors.allowOrigin=*
sonar.web.cors.allowHeaders=*
```

**Option 2: Use Proxy**
Update `proxy.conf.json`:
```json
{
  "/sonar-api": {
    "target": "https://your-sonarqube-server.com",
    "secure": false,
    "pathRewrite": {
      "^/sonar-api": "/api"
    },
    "changeOrigin": true
  }
}
```

Then update service to use `/sonar-api` instead of full URL.

## Performance Considerations

### API Call Optimization

- Component data is fetched once on load
- Results are cached in component
- Filtering/sorting happens client-side
- No auto-refresh (user must click refresh button)

### Large Projects

For projects with 100+ components:
- Consider implementing pagination
- Add lazy loading for tree view
- Implement virtual scrolling for list view

## Security Considerations

### Token Storage

⚠️ **Warning**: The current implementation stores the SonarQube token in `localStorage`.

**For Production**:
1. Store tokens server-side
2. Use backend API proxy for SonarQube calls
3. Implement token encryption
4. Use short-lived tokens with refresh mechanism

### Recommended Architecture

```
Frontend → Backend API → SonarQube
```

Benefits:
- Tokens never exposed to client
- Better error handling
- Rate limiting
- Audit logging

## Future Enhancements

### Planned Features

1. **Historical Trends**
   - Track health scores over time
   - Show improvement/degradation graphs
   - Compare against previous versions

2. **Smart Alerts**
   - Email notifications for critical components
   - Slack/Teams integration
   - Threshold-based alerts

3. **Team Ownership**
   - Map components to teams
   - Team-specific dashboards
   - Ownership-based filtering

4. **AI Recommendations**
   - Suggest refactoring targets
   - Predict future quality issues
   - Prioritize technical debt

5. **Drill-Down Views**
   - File-level metrics
   - Class/function level analysis
   - Inline code viewer with issues highlighted

## Support

For issues or questions:
1. Check this documentation
2. Review SonarQube API documentation
3. Contact the development team

## License

Copyright 2014 CapitalOne, LLC.
Further development Copyright 2022 Sapient Corporation.

Licensed under the Apache License, Version 2.0.
