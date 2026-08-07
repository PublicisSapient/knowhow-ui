#!/usr/bin/env node

/**
 * Post-install check to remind developers about pre-commit setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`\n${BLUE}🔍 Checking pre-commit setup...${RESET}\n`);

// Check if .git directory exists
const gitDir = path.join(__dirname, '..', '.git');
if (!fs.existsSync(gitDir)) {
  console.log(`${YELLOW}ℹ️  Not a git repository. Skipping pre-commit check.${RESET}\n`);
  process.exit(0);
}

// Check if pre-commit is installed
let precommitInstalled = false;
try {
  execSync('pre-commit --version', { stdio: 'pipe' });
  precommitInstalled = true;
} catch (error) {
  console.log(`${YELLOW}⚠️  Pre-commit is not installed${RESET}`);
  console.log(`\nTo enable automated dependency tracking:`);
  console.log(`${BLUE}pip install pre-commit${RESET}`);
  console.log(`${BLUE}pre-commit install${RESET}\n`);
  console.log(`Or see: ${BLUE}SETUP_AUTOMATION.md${RESET}\n`);
  process.exit(0);
}

// Check if pre-commit hooks are installed in .git/hooks
const precommitHook = path.join(gitDir, 'hooks', 'pre-commit');
if (!fs.existsSync(precommitHook)) {
  console.log(`${YELLOW}⚠️  Pre-commit hooks not initialized${RESET}`);
  console.log(`\nRun: ${BLUE}pre-commit install${RESET}\n`);
  process.exit(0);
}

console.log(`${GREEN}✅ Pre-commit setup complete!${RESET}`);
console.log(`${GREEN}✅ Automated dependency tracking is active${RESET}\n`);
console.log(`When you update ${BLUE}package.json${RESET}, documentation will auto-update! ✨\n`);
