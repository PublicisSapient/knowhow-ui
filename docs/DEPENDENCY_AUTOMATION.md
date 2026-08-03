# Automated Dependency & Security Audits

## Overview

This project implements an automated dependency tracking system that keeps documentation synchronized with the actual tech stack. This prevents documentation drift and provides always-up-to-date dependency information.

## Features

### 🔄 Automatic Tech Stack Documentation
- **What:** Automatically generates `TECH_STACK.md` with all major dependencies
- **When:** Triggered on `package.json` changes via pre-commit hook
- **Why:** Ensures documentation always reflects actual dependencies

### 📊 Dependency Drift Detection
- Identifies version mismatches (e.g., Angular Core vs CLI)
- Flags outdated major versions
- Provides warnings during report generation

### 🔐 Security Integration
- Works alongside existing GitGuardian secret scanning
- Extends pre-commit hook infrastructure
- No impact on existing security workflows

## Architecture

```
┌─────────────────┐
│  Developer      │
│  commits code   │
└────────┬────────┘
         │
         v
┌─────────────────────────────────┐
│  Pre-commit Hook Triggers       │
├─────────────────────────────────┤
│  1. GitGuardian (secrets)       │
│  2. Dependency Check (NEW)      │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│  Is package.json modified?      │
└────┬────────────────────┬───────┘
     │ YES                │ NO
     v                    v
┌──────────────────┐  ┌───────────┐
│  Run Generator   │  │  Skip     │
│  Script          │  └───────────┘
└────────┬─────────┘
         │
         v
┌──────────────────────────────────┐
│  Outputs Generated:              │
├──────────────────────────────────┤
│  • TECH_STACK.md (full report)   │
│  • README.md (version updated)   │
│  • Console (drift warnings)      │
└──────────────────────────────────┘
```

## Files Structure

```
knowhow-ui/
├── scripts/
│   ├── generate-tech-stack-report.js   # Main generator (Node.js)
│   └── check-dependency-changes.sh     # Pre-commit wrapper (Bash)
├── .pre-commit-config.yaml             # Hook configuration
├── TECH_STACK.md                       # Generated report ✨
├── README.md                           # Updated with current versions
└── docs/
    └── DEPENDENCY_AUTOMATION.md        # This file
```

## Usage

### Automatic (Recommended)

The system runs automatically when you commit changes to `package.json`:

```bash
# Make changes to dependencies
npm install some-package@latest

# Commit as usual
git add package.json
git commit -m "chore: update dependencies"

# The pre-commit hook will:
# 1. Scan for secrets (GitGuardian)
# 2. Detect package.json changes
# 3. Regenerate TECH_STACK.md
# 4. Update README.md with current Angular version
# 5. Stage both files automatically
```

### Manual

Generate tech stack report anytime:

```bash
# Full report + README update + drift check
npm run tech-stack:report

# Check only (no README update)
npm run tech-stack:check

# Direct script execution with options
node scripts/generate-tech-stack-report.js --no-readme-update
node scripts/generate-tech-stack-report.js --no-drift-check
```

## What Gets Tracked

### Core Framework
- Angular (Core, CLI, Material)
- TypeScript
- RxJS

### UI Components
- PrimeNG ecosystem (PrimeNG, PrimeIcons, PrimeFlex)
- FontAwesome

### Data Visualization
- Chart.js
- D3.js
- FullCalendar

### Utilities
- ExcelJS (Excel generation)
- jsPDF (PDF generation)
- html2canvas (Screenshots)
- Marked (Markdown parsing)

### Development Tools
- ESLint
- Prettier
- Karma
- Jasmine

## Drift Detection

The system automatically detects:

1. **Version Mismatches**
   ```
   ⚠️  DRIFT DETECTED: Angular Core (17.3) vs CLI (17.2)
   ```

2. **Outdated Major Versions**
   ```
   ⚠️  Angular 16.0 detected. Consider upgrading to latest LTS.
   ```

3. **No Issues**
   ```
   ✅ No major dependency drift detected
   ```

## Integration with Existing Infrastructure

### GitGuardian
- **No conflicts:** Dependency check runs after GitGuardian
- **Independent:** Each hook can pass/fail independently
- **Complementary:** Covers different aspects of code quality

### Prettier/Linting
- **Compatible:** Works with existing lint-staged configuration
- **Non-intrusive:** Only modifies documentation files
- **Safe:** No source code modifications

### Husky
- **Coexists:** Uses pre-commit (not Husky's Git hooks)
- **Flexible:** Can be added to Husky if preferred

## Customization

### Add New Dependencies to Track

Edit `scripts/generate-tech-stack-report.js`:

```javascript
getKeyDependencies() {
  return {
    // Add new category
    testing: {
      jest: this.extractMajorVersion(deps['jest']),
      playwright: this.extractMajorVersion(deps['playwright'])
    }
  };
}
```

### Modify Report Format

Update the `generateReport()` method to change markdown output.

### Change Drift Thresholds

Customize `checkDependencyDrift()` to adjust warning criteria.

## Troubleshooting

### Pre-commit Hook Not Running

```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install

# Test manually
pre-commit run --files package.json
```

### Script Errors

```bash
# Check Node.js is available
node --version

# Run script directly to see errors
node scripts/generate-tech-stack-report.js
```

### Permission Issues

```bash
# Ensure script is executable
chmod +x scripts/check-dependency-changes.sh
```

## Benefits

### For Developers
- ✅ No manual documentation updates needed
- ✅ Always accurate dependency information
- ✅ Catch version drift early
- ✅ Zero overhead in workflow

### For Team Leads
- ✅ Visibility into tech stack changes
- ✅ Historical tracking via Git history
- ✅ Consistent documentation format
- ✅ Audit trail for compliance

### For Security
- ✅ Complements GitGuardian
- ✅ Identifies outdated dependencies
- ✅ Pre-commit validation
- ✅ No secrets in documentation

## Future Enhancements

Potential additions to consider:

1. **Vulnerability Scanning**
   ```bash
   npm audit --json >> TECH_STACK.md
   ```

2. **License Compliance**
   ```bash
   npm install -g license-checker
   license-checker --json
   ```

3. **Bundle Size Tracking**
   ```bash
   webpack-bundle-analyzer dist/stats.json
   ```

4. **Changelog Generation**
   ```bash
   conventional-changelog -p angular
   ```

5. **Slack/Email Notifications**
   - Alert team when major versions change
   - Weekly dependency digest

## Examples

### Before This Automation

```markdown
README.md:
"This is developed using Angular 14.0"
```
(Actually running Angular 17.3 - documentation drift!)

### After This Automation

```markdown
README.md:
"This is developed using Angular 17.3"

TECH_STACK.md:
Full detailed report with all dependencies
Last Updated: 2026-08-03
```

Automatically synchronized on every commit! ✨

## Related Documentation

- [Pre-commit Hook Configuration](../.pre-commit-config.yaml)
- [Tech Stack Report Generator](../scripts/generate-tech-stack-report.js)
- [GitGuardian Documentation](https://docs.gitguardian.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review script logs: `node scripts/generate-tech-stack-report.js`
3. Test pre-commit manually: `pre-commit run --all-files`

---

**Last Updated:** 2026-08-03  
**Automation Version:** 1.0.0
