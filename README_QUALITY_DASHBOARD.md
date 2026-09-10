# 🛡️ Component-Wise Quality Dashboard

> **Transform SonarQube from a pass/fail gate into actionable component-level insights**

[![Angular](https://img.shields.io/badge/Angular-17.3-red)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![SonarQube](https://img.shields.io/badge/SonarQube-API-orange)](https://www.sonarqube.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green)](LICENSE)

---

## 🎯 Problem Solved

**Before**: Your CI/CD shows "SonarQube: PASSED" but you don't know:
- Which components have the most bugs?
- Where is test coverage lowest?
- Which new features introduce technical debt?

**After**: See at a glance:
- 🟢 Slingshot Dashboard: **95/100** (Excellent)
- 🟡 Authentication Module: **68/100** (Fair) - 12 code smells, 65% coverage
- 🔴 Legacy Reports: **32/100** (Critical) - 8 bugs, 4 vulnerabilities, 15% duplication

---

## ✨ Features

### 📊 Component Health Scoring
Automated 0-100 health score based on:
- 🐛 Bugs
- 🛡️ Vulnerabilities
- 💩 Code Smells
- ✅ Test Coverage
- 🔁 Code Duplication
- ⭐ SonarQube Ratings (A-E)

### 📱 Multiple Views
```
📊 Grid View    →  Visual cards with health badges
📊 List View    →  Sortable table with metrics
🌳 Tree View    →  Hierarchical component structure
```

### 🔍 Advanced Filtering
- Filter by health status (Excellent → Critical)
- Search by component name/path
- Show only problematic components
- Multi-column sorting

### 💾 Export & Reporting
- Export to CSV
- CLI quality reports
- CI/CD health checks
- JSON output for automation

---

## 🚀 Quick Start

### 1. Run Analysis
```bash
npm run sonar
```

### 2. View Dashboard
```
http://localhost:4300/#/dashboard/Quality
```

### 3. Configure (First Time)
```
SonarQube Server: https://your-sonarqube.com
Project Key:      ENGINEERING.KPIDASHBOARD.UI
Token:            (optional) your-auth-token
```

**That's it!** 🎉

---

## 📸 Screenshots

### Dashboard Overview
```
┌──────────────────────────────────────────────────────────────┐
│ 🛡️  Component-Wise Quality Dashboard                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Quality Gate: OK                                        │
│                                                              │
│  📋 Summary                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   42        │  │   82        │  │    8        │  │
│  │ Components │  │ Avg Health │  │   Bugs      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                              │
│  🟢🟢🟢🟡🟡🟠🔴 Health Distribution                         │
│  15 Excellent  |  18 Good  |  6 Fair  |  2 Poor  |  1 Critical│
│                                                              │
│  📋 Components                                              │
│  ┌────────────────────────────────────────────────┐  │
│  │ 🟢 dashboard/executive-v2           95  A  A  A  │  │
│  │ 🟢 component/charts                 92  A  A  B  │  │
│  │ 🟡 services/api                     68  B  B  A  │  │
│  │ 🔴 dashboard/legacy-reports         32  D  C  E  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Architecture

```
┌───────────────────────────────────────────────────────┐
│                   Browser (Angular App)                     │
│                                                               │
│  ┌──────────────────────────────────────────────┐  │
│  │      QualityDashboardComponent              │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  - View Mode Management            │  │  │
│  │  │  - Filtering & Search              │  │  │
│  │  │  - Export to CSV                   │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
│                          │                                  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────┐  │
│  │         SonarQubeService                   │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  - API Integration                 │  │  │
│  │  │  - Health Calculation              │  │  │
│  │  │  - Component Tree Building         │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
                          │
                          ↓ HTTP/HTTPS
┌───────────────────────────────────────────────────────┐
│                  SonarQube Server                          │
│                                                               │
│  🔍 /api/qualitygates/project_status                     │
│  📊 /api/measures/component                              │
│  🌳 /api/measures/component_tree                         │
└───────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Quick Start Guide](QUALITY_DASHBOARD_QUICKSTART.md)** | Get started in 5 minutes |
| **[Setup Guide](QUALITY_DASHBOARD_SETUP.md)** | Comprehensive setup and configuration |
| **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** | Technical details and architecture |

---

## 💻 CLI Tools

### Generate Quality Report
```bash
npm run sonar:report
```
Outputs console report + saves JSON to `quality-reports/`

### Check Health Threshold (CI/CD)
```bash
npm run sonar:check
```
Exit code 0 if health ≥ 75, otherwise 1

### Custom Threshold
```bash
node scripts/sonarqube-helper.js --mode=check --threshold=80
```

---

## 🛠️ Technology Stack

- **Frontend**: Angular 17.3
- **UI Library**: PrimeNG 17.18
- **Language**: TypeScript 5.4
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS 7.8
- **Integration**: SonarQube Web API

---

## 📈 Metrics Tracked

| Metric | Description | Weight |
|--------|-------------|--------|
| Bugs | Number of bugs | High |
| Vulnerabilities | Security issues | Very High |
| Code Smells | Maintainability issues | Medium |
| Coverage | Test coverage % | High |
| Duplication | Code duplication % | Medium |
| Maintainability | SonarQube rating A-E | Low |
| Reliability | SonarQube rating A-E | Low |
| Security | SonarQube rating A-E | Low |

---

## ❓ FAQ

<details>
<summary><strong>Can I use this without SonarQube Cloud?</strong></summary>
<br>
Yes! Works with both SonarQube Server (self-hosted) and SonarCloud.
</details>

<details>
<summary><strong>Do I need a SonarQube token?</strong></summary>
<br>
Optional but recommended. Public instances may work without a token, but private/enterprise instances require authentication.
</details>

<details>
<summary><strong>Can I customize the health scoring?</strong></summary>
<br>
Yes! Edit <code>src/app/model/sonarqube.model.ts</code> to adjust thresholds and <code>src/app/services/sonarqube.service.ts</code> to modify the scoring algorithm.
</details>

<details>
<summary><strong>Does this work for non-Angular projects?</strong></summary>
<br>
The dashboard is Angular-specific, but the <code>sonarqube-helper.js</code> CLI tool works with any SonarQube project.
</details>

---

## 🚀 Roadmap

- [ ] Historical trend tracking
- [ ] Email/Slack alerts for critical components
- [ ] Team ownership mapping
- [ ] AI-powered refactoring suggestions
- [ ] File-level drill-down views
- [ ] GitHub Actions integration
- [ ] Docker image for standalone deployment

---

## 🤝 Contributing

Contributions welcome! Please:
1. Read the setup guide
2. Follow existing code style
3. Add unit tests
4. Update documentation

---

## 📜 License

```
Copyright 2014 CapitalOne, LLC.
Further development Copyright 2022 Sapient Corporation.

Licensed under the Apache License, Version 2.0
```

---

## 👏 Credits

**Built by**: Sapient Engineering Team  
**For**: KnowHOW Platform  
**Purpose**: Making Code Quality Visible  

---

**⭐ Star this project if you find it useful!**

**🐛 Found a bug?** [Report it](mailto:team@example.com)

**💡 Have an idea?** [Share it](mailto:team@example.com)

---

*"Quality is not an act, it is a habit." - Aristotle*
