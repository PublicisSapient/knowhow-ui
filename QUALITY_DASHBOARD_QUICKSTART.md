# Quality Dashboard - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run SonarQube Analysis
```bash
npm run sonar
```

This analyzes your code and sends metrics to SonarQube.

### Step 2: Access the Dashboard

Navigate to: **`http://localhost:4300/#/dashboard/Quality`**

Or start the app if not running:
```bash
npm start
```

### Step 3: Configure SonarQube Connection

On first visit, you'll see a configuration dialog:

1. **SonarQube Server URL**: `https://your-sonarqube-server.com`
2. **Project Key**: `ENGINEERING.KPIDASHBOARD.UI` (default)
3. **Token** (optional): Your SonarQube authentication token

Click **Save** and the dashboard will load!

---

## 📊 What You'll See

### Summary Cards
- **Total Components**: Number of analyzed directories
- **Average Health Score**: Overall codebase health (0-100)
- **Total Bugs**: All bugs across components
- **Total Vulnerabilities**: Security issues found
- **Average Coverage**: Mean test coverage percentage

### Health Distribution Bar
Visual breakdown of components by health status:
- 🜢 **Green**: Excellent (90-100)
- 🟢 **Light Green**: Good (75-89)
- 🟡 **Yellow**: Fair (60-74)
- 🟠 **Orange**: Poor (40-59)
- 🔴 **Red**: Critical (0-39)

### Component Cards/List
Each component shows:
- Name and path
- Health score
- Bugs, Vulnerabilities, Code Smells
- Test Coverage %
- Code Duplication %
- Quality Ratings (A-E)

---

## 🔍 Finding Problematic Code

### Filter by Health Status
```
Filter: Critical
```
Shows only components needing immediate attention.

### Search by Name
```
Search: "dashboard"
```
Finds all dashboard-related components.

### Show Only Problematic
```
☑️ Show Only Problematic
```
Displays components with:
- Bugs > 0
- Vulnerabilities > 0
- Code Smells > 10

---

## 💾 Exporting Reports

Click **Download** icon to export current view to CSV:
- Filename: `quality-dashboard-2026-09-09.csv`
- Includes all visible components with full metrics
- Great for sharing with team or tracking over time

---

## 🛠️ Advanced Usage

### Generate Quality Report (CLI)
```bash
npm run sonar:report
```

Outputs:
```
📊 Generating Quality Report...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HEALTH SCORE: 82/100 (Good)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Metrics:
  🐛 Bugs: 3
  🛡️  Vulnerabilities: 1
  💩 Code Smells: 42
  ✅ Coverage: 78.5%
  📋 Duplication: 4.2%
  📏 Lines of Code: 15234

⭐ Ratings:
  Maintainability: B
  Reliability: A
  Security: A

💾 Report saved to: quality-reports/quality-report-2026-09-09.json
```

### Check Health Threshold (CI/CD)
```bash
npm run sonar:check
```

Exits with:
- **Code 0**: Health score ≥ 75 (passes)
- **Code 1**: Health score < 75 (fails)

Perfect for CI/CD quality gates!

---

## ❓ Common Issues

### "Failed to load quality data"

**Fix**: Check SonarQube server URL is correct and accessible.

```bash
curl https://your-sonarqube-server.com/api/system/status
```

Should return: `{"status":"UP"}`

### "No components found"

**Fix**: Run SonarQube analysis first.

```bash
npm run sonar
```

### CORS Errors

**Fix**: Add CORS headers to SonarQube or use proxy (see full setup guide).

---

## 🔗 Next Steps

1. **Read Full Documentation**: [`QUALITY_DASHBOARD_SETUP.md`](./QUALITY_DASHBOARD_SETUP.md)
2. **Customize Thresholds**: Edit `src/app/model/sonarqube.model.ts`
3. **Integrate with CI/CD**: Use `npm run sonar:check` in your pipeline
4. **Schedule Regular Scans**: Run `npm run sonar` nightly

---

## 📝 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run sonar` | Run SonarQube analysis |
| `npm run sonar:report` | Generate quality report |
| `npm run sonar:check` | Check if health ≥ threshold |
| `npm start` | Start dev server |

---

## 👥 Support

Questions? Check:
1. [Full Setup Guide](./QUALITY_DASHBOARD_SETUP.md)
2. [SonarQube API Docs](https://docs.sonarqube.org/latest/extend/web-api/)
3. Contact your team lead

---

**Built with ❤️ for better code quality!**
