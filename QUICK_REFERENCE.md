# Quick Reference: Automated Dependency Tracking

## 🚀 One-Time Setup

```bash
# 1. Install pre-commit (if not installed)
pip install pre-commit

# 2. Initialize hooks
pre-commit install

# Done! ✅
```

## 📝 Daily Usage

### Automatic (No Action Needed!)
Every time you commit `package.json` changes, documentation updates automatically:

```bash
npm install some-package@latest
git add package.json package-lock.json
git commit -m "chore: update dependencies"
# ✨ TECH_STACK.md and README.md auto-update!
```

### Manual Commands

```bash
# Generate/update tech stack report
npm run tech-stack:report

# Check for drift only (no README update)
npm run tech-stack:check
```

## 📊 What Gets Tracked

- ✅ Angular version (Core, CLI, Material)
- ✅ UI Components (PrimeNG, FontAwesome)
- ✅ Data Visualization (Chart.js, D3.js)
- ✅ Utilities (ExcelJS, jsPDF, RxJS)
- ✅ Dev Tools (ESLint, Prettier, Karma)

## 🔍 What Gets Generated

| File | Purpose | Updated When |
|------|---------|--------------|
| `TECH_STACK.md` | Complete dependency report | On every `package.json` commit |
| `README.md` | Angular version reference | On every `package.json` commit |

## ⚡ Quick Commands

```bash
# View current tech stack
cat TECH_STACK.md

# Force regenerate documentation
npm run tech-stack:report

# Test pre-commit hook manually
bash scripts/check-dependency-changes.sh

# Check if pre-commit is set up
node scripts/check-precommit-setup.js
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Hook not running | `pre-commit install` |
| Permission denied | `chmod +x scripts/*.sh` |
| pre-commit not found | `pip install pre-commit` |
| Node.js not found | Install Node.js (required for Angular anyway) |

## 📚 Full Documentation

- **Quick Setup:** [SETUP_AUTOMATION.md](SETUP_AUTOMATION.md)
- **Technical Details:** [docs/DEPENDENCY_AUTOMATION.md](docs/DEPENDENCY_AUTOMATION.md)
- **Implementation:** [AUTOMATION_SUMMARY.md](AUTOMATION_SUMMARY.md)
- **Scripts Info:** [scripts/README.md](scripts/README.md)

## 🎯 Key Benefits

- ✅ **Zero Manual Work** - Documentation updates automatically
- ✅ **Always Accurate** - Synced with actual dependencies
- ✅ **Drift Detection** - Catches version mismatches early
- ✅ **Audit Trail** - Git history tracks all changes
- ✅ **CI/CD Ready** - Optional GitHub workflow included

## 🔒 Security

Works seamlessly with existing security:
- ✅ GitGuardian (secret scanning)
- ✅ Pre-commit hooks (linting)
- ✅ No conflicts or issues

## 💡 Examples

### Before This Automation
```markdown
README.md: "This is developed using Angular 14.0"
```
❌ Outdated! Actually on Angular 17.3

### After This Automation
```markdown
README.md: "This is developed using Angular 17.3"
TECH_STACK.md: [Complete up-to-date report]
```
✅ Always accurate!

## 🎉 Bottom Line

**Set up once, never think about it again!**

Your documentation stays synchronized automatically. ✨

---

**Need Help?** See [SETUP_AUTOMATION.md](SETUP_AUTOMATION.md)  
**Last Updated:** August 3, 2026
