# Quality Dashboard - Correct Access URL

## ✅ Correct URL

The Quality Dashboard is accessible at:

```
http://localhost:4300/#/dashboard/QualitySonarDashboard
```

**Note**: The route is `QualitySonarDashboard` (not `Quality`) to avoid conflicts with the existing `/quality` route.

---

## 🚀 Quick Start

### Step 1: Make Sure App is Running

```bash
npm start
```

Wait for: `✔ Compiled successfully`

---

### Step 2: Open Quality Dashboard

```
http://localhost:4300/#/dashboard/QualitySonarDashboard
```

---

### Step 3: Configure SonarQube Connection

Choose one of these methods:

#### **Method 1: Configuration Helper** (Easiest) ⭐

```bash
open configure-dashboard.html
```

Then:
1. Fill in the form:
   - Server URL: `https://tools.publicis.sapient.com/sonar`
   - Project Key: `ENGINEERING.KPIDASHBOARD.UI`
   - Token: (your SonarQube token - optional)
2. Click "Save Configuration"
3. Go back to dashboard and refresh (F5)

#### **Method 2: Browser Console** (Fastest)

1. Open the dashboard: `http://localhost:4300/#/dashboard/QualitySonarDashboard`
2. Press **F12** (Developer Tools → Console tab)
3. Paste and run:

   ```javascript
   localStorage.setItem('sonarQubeConfig', JSON.stringify({
     serverUrl: 'https://tools.publicis.sapient.com/sonar',
     projectKey: 'ENGINEERING.KPIDASHBOARD.UI',
     token: 'YOUR_TOKEN_HERE'  // Replace with your token or omit this line
   }));
   location.reload();
   ```

   **Without token**:
   ```javascript
   localStorage.setItem('sonarQubeConfig', JSON.stringify({
     serverUrl: 'https://tools.publicis.sapient.com/sonar',
     projectKey: 'ENGINEERING.KPIDASHBOARD.UI'
   }));
   location.reload();
   ```

4. Press **Enter**

---

### Step 4: Verify Data Loads

After configuration, you should see:

```
┌──────────────────────────────────────────────────┐
│ 🛡️ Component-Wise Quality Dashboard             │
├──────────────────────────────────────────────────┤
│                                                  │
│ ✅ Quality Gate: OK                              │
│                                                  │
│ 📊 Summary                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │    42    │ │    82    │ │     8    │         │
│ │  Comps   │ │  Health  │ │   Bugs   │         │
│ └──────────┘ └──────────┘ └──────────┘         │
│                                                  │
│ 🟢🟢🟢🟡🟡🟠🔴 Health Distribution              │
│                                                  │
│ 📋 Components                                    │
│ (List of your components with health scores)    │
└──────────────────────────────────────────────────┘
```

---

## 🔗 Quick Links

### Dashboard
```
http://localhost:4300/#/dashboard/QualitySonarDashboard
```

### SonarQube UI
```
https://tools.publicis.sapient.com/sonar/dashboard?id=ENGINEERING.KPIDASHBOARD.UI
```

### Configuration Helper
```bash
open configure-dashboard.html
```

---

## 📋 CLI Commands

```bash
# Run SonarQube analysis
npm run sonar

# Generate quality report
npm run sonar:report

# Check health threshold (CI/CD)
npm run sonar:check

# Verify SonarQube setup
npm run sonar:verify

# Post-analysis setup
npm run sonar:setup
```

---

## 🎯 Features You Can Use

Once data loads, try these:

### 1. View Modes
- **📊 Grid View**: Visual cards with health badges
- **📋 List View**: Sortable table with metrics
- **🌳 Tree View**: Hierarchical component structure

### 2. Filtering & Search
- Filter by health status (Excellent/Good/Fair/Poor/Critical)
- Search by component name or path
- Toggle "Show Only Problematic" to see components needing attention

### 3. Sorting (in List View)
- Click column headers to sort by:
  - Health Score
  - Bugs, Vulnerabilities, Code Smells
  - Coverage percentage
  - Component name

### 4. Export
- Click "Export to CSV" to download all metrics
- Timestamped filenames for tracking

---

## 🆘 Troubleshooting

### Issue: "Failed to load quality data"

**Check**:
1. Browser console (F12) for errors
2. Configuration is correct:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('sonarQubeConfig')));
   ```
3. SonarQube analysis completed: `npm run sonar`
4. Server URL is correct: `https://tools.publicis.sapient.com/sonar` (no `/dashboard`)

### Issue: Still redirecting to Error page

**Solution**:
1. Clear browser cache: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Verify you're using the correct URL with hash (#):
   ```
   ✅ http://localhost:4300/#/dashboard/QualitySonarDashboard
   ❌ http://localhost:4300/dashboard/QualitySonarDashboard
   ```

### Issue: "Not authorized" or "401 Unauthorized"

**Solution**:
1. Generate a new token in SonarQube:
   - Login to: https://tools.publicis.sapient.com/sonar
   - My Account → Security → Generate Tokens
   - Name: `knowhow-quality-dashboard`
   - Copy token
2. Update configuration with new token

### Issue: Page is blank

**Solution**:
1. Check if app is running: `npm start`
2. Check browser console (F12) for errors
3. Try opening in incognito/private mode
4. Clear localStorage and reconfigure:
   ```javascript
   localStorage.removeItem('sonarQubeConfig');
   location.reload();
   ```

---

## 📚 Documentation

For more detailed information:

- **[GETTING_STARTED_QUALITY_DASHBOARD.md](GETTING_STARTED_QUALITY_DASHBOARD.md)** - Complete walkthrough
- **[QUALITY_DASHBOARD_SETUP.md](QUALITY_DASHBOARD_SETUP.md)** - Comprehensive setup guide
- **[SONARQUBE_TROUBLESHOOTING.md](SONARQUBE_TROUBLESHOOTING.md)** - Common issues and solutions
- **[configure-dashboard.html](configure-dashboard.html)** - Visual configuration helper

---

## ✅ Quick Verification

Run these to verify everything is working:

```bash
# 1. Verify SonarQube setup
npm run sonar:verify

# 2. Run analysis (if not done yet)
npm run sonar

# 3. Generate report
npm run sonar:report

# 4. Start app
npm start

# 5. Open dashboard
# → http://localhost:4300/#/dashboard/QualitySonarDashboard
```

---

## 🎉 Success Checklist

- [ ] App is running (`npm start`)
- [ ] Opened correct URL: `http://localhost:4300/#/dashboard/QualitySonarDashboard`
- [ ] Configured SonarQube connection
- [ ] See Quality Dashboard (not Error page)
- [ ] Data loads successfully
- [ ] Can see summary cards and component list
- [ ] Can filter, search, and switch views
- [ ] Can export to CSV

---

**Important**: Always use the full URL with `QualitySonarDashboard` (not `Quality`) to avoid route conflicts!

**Bookmark this URL**: `http://localhost:4300/#/dashboard/QualitySonarDashboard`
