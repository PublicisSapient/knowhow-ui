# Getting Started: Automated Dependency Tracking

Welcome! This project now includes **automated dependency tracking** that keeps your documentation always in sync with your actual tech stack.

## 🎯 What Problem Does This Solve?

**Before:** README said "Angular 14.0" but project was actually on Angular 17.3 ❌  
**After:** Documentation automatically updates when dependencies change ✅

## ⚡ Quick Start (2 Minutes)

### For New Team Members

```bash
# 1. Clone the repo (you've probably done this)
git clone <repository-url>
cd knowhow-ui

# 2. Install dependencies (triggers auto-check)
npm install

# 3. Install pre-commit (one-time setup)
pip install pre-commit

# 4. Initialize pre-commit hooks
pre-commit install

# ✨ Done! You're all set!
```

### Verify Setup

```bash
# Should show: ✅ Pre-commit setup complete!
node scripts/check-precommit-setup.js

# Generate initial report
npm run tech-stack:report

# View the tech stack
cat TECH_STACK.md
```

## 📖 How It Works

### Automatic Mode (Default)

Just work normally! When you commit `package.json` changes:

```bash
# Example: Update a dependency
npm install primeng@latest

# Commit your changes
git add package.json package-lock.json
git commit -m "chore: update PrimeNG"

# 🎉 Magic happens:
# ✅ GitGuardian scans for secrets
# ✅ Dependency checker detects package.json change
# ✅ TECH_STACK.md gets regenerated
# ✅ README.md gets updated with current versions
# ✅ Both files auto-staged in your commit
```

### Manual Mode

Generate reports anytime:

```bash
# Full report generation + README update
npm run tech-stack:report

# Just check for drift (no README update)
npm run tech-stack:check
```

## 📊 What You Get

### 1. TECH_STACK.md
A comprehensive report with:
- All major dependencies and versions
- Categorized by purpose (Framework, UI, Utils, etc.)
- Timestamp of last update
- Auto-generated on every package.json commit

**Example:**
```markdown
# Tech Stack Report
**Last Updated:** 2026-08-03
**Project Version:** 17.1.3

## Core Framework
| Package | Version |
|---------|---------|
| Angular Core | 17.3 |
| TypeScript | 5.4 |
...
```

### 2. Updated README.md
Your README now always shows the correct Angular version:
- **Before:** "Angular 14.0" (outdated)
- **After:** "Angular 17.3" (accurate!)

### 3. Drift Detection
Get warnings when versions don't match:
```
⚠️  DRIFT DETECTED: Angular Core (17.3) vs CLI (17.2)
```

## 🎨 Workflow Examples

### Scenario 1: Regular Dependency Update
```bash
npm install rxjs@latest
git add package.json package-lock.json
git commit -m "chore: update rxjs"
# ✨ Documentation updates automatically
```

### Scenario 2: Major Framework Upgrade
```bash
ng update @angular/core@18 @angular/cli@18
# package.json changes
git add package.json package-lock.json
git commit -m "feat: upgrade to Angular 18"
# ✨ Documentation shows Angular 18 immediately
```

### Scenario 3: Adding New Dependency
```bash
npm install d3@latest
git add package.json package-lock.json
git commit -m "feat: add D3.js for charts"
# ✨ D3.js appears in TECH_STACK.md automatically
```

### Scenario 4: Check Before Meeting
```bash
# Quickly generate latest report for stakeholders
npm run tech-stack:report
cat TECH_STACK.md
# Share accurate tech stack info!
```

## 🔧 Available Commands

| Command | What It Does |
|---------|--------------|
| `npm run tech-stack:report` | Generate full report + update README |
| `npm run tech-stack:check` | Check for drift only |
| `node scripts/check-precommit-setup.js` | Verify setup is correct |
| `bash scripts/check-dependency-changes.sh` | Test pre-commit hook |
| `pre-commit run --all-files` | Run all pre-commit hooks |

## 📁 Important Files

| File | Purpose | Auto-Generated? |
|------|---------|-----------------|
| `TECH_STACK.md` | Complete dependency report | ✅ Yes |
| `README.md` | Project docs with current Angular version | Partially |
| `package.json` | Source of truth for dependencies | ❌ No (you edit) |
| `.pre-commit-config.yaml` | Hook configuration | ❌ No |
| `scripts/generate-tech-stack-report.js` | Main generator script | ❌ No |

## 🚨 Troubleshooting

### "pre-commit: command not found"
```bash
pip install pre-commit
pre-commit install
```

### "Permission denied" on script
```bash
chmod +x scripts/check-dependency-changes.sh
```

### Hook not running on commit
```bash
pre-commit uninstall
pre-commit install
```

### Want to skip hook once (emergency)
```bash
git commit --no-verify -m "emergency fix"
```

## 📚 Documentation

| Document | When to Read |
|----------|--------------|
| **QUICK_REFERENCE.md** | Quick command lookup |
| **SETUP_AUTOMATION.md** | Detailed setup instructions |
| **AUTOMATION_SUMMARY.md** | Understanding the implementation |
| **docs/DEPENDENCY_AUTOMATION.md** | Complete technical reference |
| **scripts/README.md** | Script details for developers |

## 🎓 Learning Path

1. **Day 1:** Follow this guide → Install pre-commit → Test it works
2. **Week 1:** Make a dependency update → Watch it auto-update docs
3. **Month 1:** Customize the report format (optional)

## 💡 Pro Tips

### Tip 1: View Tech Stack Anytime
```bash
# Quick view of current tech stack
cat TECH_STACK.md | less
```

### Tip 2: Check Before PRs
```bash
# Make sure docs are current
npm run tech-stack:report
git add TECH_STACK.md README.md
```

### Tip 3: Historical Tracking
```bash
# See how tech stack evolved
git log -p TECH_STACK.md
```

### Tip 4: CI/CD Integration
Optional GitHub workflow already included at:
`.github/workflows/dependency-check.yml`

## ✅ Checklist for New Team Members

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Install pre-commit: `pip install pre-commit`
- [ ] Initialize hooks: `pre-commit install`
- [ ] Test setup: `node scripts/check-precommit-setup.js`
- [ ] Generate initial report: `npm run tech-stack:report`
- [ ] Read this guide ✨

## 🎉 You're All Set!

The automation is now active. Your documentation will stay synchronized automatically!

### What Happens Next?

- ✅ Every `package.json` commit triggers auto-update
- ✅ No manual documentation work needed
- ✅ Always accurate dependency information
- ✅ Drift detection catches issues early

### Questions?

See detailed documentation in:
- `SETUP_AUTOMATION.md` - Setup details
- `docs/DEPENDENCY_AUTOMATION.md` - Technical deep dive
- `scripts/README.md` - Script information

---

**Welcome aboard!** 🚀  
Your documentation will now take care of itself! ✨

**Last Updated:** August 3, 2026  
**Setup Time:** ~2 minutes  
**Maintenance Required:** Zero (fully automated)
