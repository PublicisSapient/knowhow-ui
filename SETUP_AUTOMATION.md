# Quick Setup Guide: Automated Dependency Tracking

## Prerequisites

This automation requires:
- ✅ Node.js (already installed - used by Angular)
- ✅ Python 3 (for pre-commit hooks)
- ✅ pip (Python package manager)

## Installation Steps

### 1. Install Pre-commit (if not already installed)

```bash
# Check if already installed
pre-commit --version

# If not installed, install via pip
pip install pre-commit

# Or via Homebrew (macOS)
brew install pre-commit
```

### 2. Initialize Pre-commit Hooks

```bash
# Run from project root
pre-commit install
```

Expected output:
```
pre-commit installed at .git/hooks/pre-commit
```

### 3. Test the Setup

#### Test the tech stack generator directly:
```bash
npm run tech-stack:report
```

Expected output:
```
🔍 Generating Tech Stack Report...
✅ Tech stack report generated: TECH_STACK.md
✅ Updated README.md
📊 Checking for dependency drift...
✅ No major dependency drift detected
✨ Done!
```

#### Test the pre-commit hook:
```bash
# This will run ALL hooks against all files
pre-commit run --all-files
```

Expected output:
```
ggshield................................................................Passed
Check Dependency Changes.............................................Passed
```

## Verification

After setup, verify these files exist:

```bash
ls -la scripts/
# Should show:
# - generate-tech-stack-report.js
# - check-dependency-changes.sh (executable)

ls -la TECH_STACK.md
# Should show: TECH_STACK.md with current date

cat README.md | grep Angular
# Should show: "Angular 17.3" (not 14.0)
```

## How It Works

Once installed, every time you commit changes to `package.json`:

1. **GitGuardian** scans for secrets
2. **Dependency Check** detects package.json changes
3. **Generator Script** creates/updates TECH_STACK.md
4. **README** gets updated with current versions
5. **Both files** are automatically staged in your commit

## Example Workflow

```bash
# 1. Update a dependency
npm install primeng@latest

# 2. Stage your changes
git add package.json package-lock.json

# 3. Commit (pre-commit hook runs automatically)
git commit -m "chore: update PrimeNG to latest"

# Hook output you'll see:
# ✅ GitGuardian scan passed
# 📦 package.json changes detected!
# 📊 Generating tech stack report...
# ✅ TECH_STACK.md updated and staged
# ✅ README.md updated and staged
# ✨ Tech stack documentation synchronized!

# 4. Your commit now includes:
# - package.json (your changes)
# - package-lock.json (your changes)
# - TECH_STACK.md (automatically updated)
# - README.md (automatically updated)
```

## Troubleshooting

### "pre-commit: command not found"

Install pre-commit:
```bash
pip install pre-commit
# or
brew install pre-commit
```

### "Permission denied" on check-dependency-changes.sh

Make script executable:
```bash
chmod +x scripts/check-dependency-changes.sh
```

### Hook not running

Reinstall hooks:
```bash
pre-commit uninstall
pre-commit install
```

### Node.js not found

Ensure Node.js is in PATH:
```bash
which node
node --version
```

## Manual Testing

Test without committing:

```bash
# Simulate the hook
bash scripts/check-dependency-changes.sh

# Or run the generator directly
node scripts/generate-tech-stack-report.js
```

## Disable (if needed)

To temporarily disable:

```bash
# Skip all hooks for one commit
git commit --no-verify -m "emergency fix"

# Uninstall completely
pre-commit uninstall
```

## Re-enable

```bash
pre-commit install
```

---

**Setup Time:** ~2 minutes  
**Maintenance:** Zero - fully automated  
**Impact:** Documentation always in sync with dependencies ✨
