#!/bin/bash

###############################################################################
# Dependency Change Detector for Pre-commit Hook
#
# This script detects changes to package.json and automatically regenerates
# the tech stack documentation.
#
# Usage: Called automatically by pre-commit hook
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking for dependency changes...${NC}"

# Check if package.json is staged for commit
if git diff --cached --name-only | grep -q "package.json"; then
    echo -e "${YELLOW}📦 package.json changes detected!${NC}"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Cannot generate tech stack report.${NC}"
        exit 0
    fi
    
    # Generate the tech stack report
    echo -e "${BLUE}📊 Generating tech stack report...${NC}"
    node scripts/generate-tech-stack-report.js
    
    # Check if TECH_STACK.md was created/updated
    if [ -f "TECH_STACK.md" ]; then
        git add TECH_STACK.md
        echo -e "${GREEN}✅ TECH_STACK.md updated and staged${NC}"
    fi
    
    # Check if README.md was updated
    if git diff --name-only README.md &> /dev/null; then
        git add README.md
        echo -e "${GREEN}✅ README.md updated and staged${NC}"
    fi
    
    echo -e "${GREEN}✨ Tech stack documentation synchronized!${NC}"
else
    echo -e "${GREEN}✓ No dependency changes detected${NC}"
fi

exit 0
