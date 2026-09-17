#!/bin/bash

################################################################################
# SonarQube Setup Verification Script
# 
# This script helps verify your SonarQube configuration is correct before
# running the full analysis.
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   SonarQube Configuration Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if sonar-project.properties exists
echo -e "${BLUE}[1/6]${NC} Checking sonar-project.properties file..."
if [ ! -f "sonar-project.properties" ]; then
    echo -e "${RED}✗ sonar-project.properties not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ sonar-project.properties found${NC}"
echo ""

# Extract and validate sonar.host.url
echo -e "${BLUE}[2/6]${NC} Validating SonarQube server URL..."
SONAR_URL=$(grep '^sonar.host.url' sonar-project.properties | cut -d'=' -f2 | tr -d ' ')

if [ -z "$SONAR_URL" ]; then
    echo -e "${RED}✗ sonar.host.url not found in sonar-project.properties${NC}"
    echo -e "${YELLOW}  Please add: sonar.host.url=https://your-sonarqube-server${NC}"
    exit 1
fi

echo -e "  Server URL: ${GREEN}$SONAR_URL${NC}"

# Validate URL format
if [[ $SONAR_URL == *"/dashboard"* ]] || [[ $SONAR_URL == *"?"* ]]; then
    echo -e "${RED}✗ Invalid URL format!${NC}"
    echo -e "${YELLOW}  URL should be base URL only (no /dashboard or query params)${NC}"
    echo -e "${YELLOW}  Example: https://tools.publicis.sapient.com/sonar${NC}"
    exit 1
fi

if [[ $SONAR_URL != http://* ]] && [[ $SONAR_URL != https://* ]]; then
    echo -e "${RED}✗ URL must start with http:// or https://${NC}"
    exit 1
fi

echo -e "${GREEN}✓ URL format is correct${NC}"
echo ""

# Check SONAR_TOKEN environment variable
echo -e "${BLUE}[3/6]${NC} Checking authentication token..."
if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${RED}✗ SONAR_TOKEN environment variable not set${NC}"
    echo -e "${YELLOW}  Please set it:${NC}"
    echo -e "${YELLOW}    export SONAR_TOKEN=your-token-here${NC}"
    echo -e "${YELLOW}  Make it permanent:${NC}"
    echo -e "${YELLOW}    echo 'export SONAR_TOKEN=your-token' >> ~/.zshrc${NC}"
    echo -e "${YELLOW}    source ~/.zshrc${NC}"
    exit 1
fi

TOKEN_LENGTH=${#SONAR_TOKEN}
MASKED_TOKEN="${SONAR_TOKEN:0:8}...${SONAR_TOKEN: -4}"
echo -e "  Token: ${GREEN}$MASKED_TOKEN${NC} (${TOKEN_LENGTH} characters)"
echo -e "${GREEN}✓ Token is set${NC}"
echo ""

# Test server connectivity
echo -e "${BLUE}[4/6]${NC} Testing server connectivity..."
echo -e "  Connecting to: $SONAR_URL/api/system/status"

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SONAR_URL/api/system/status" 2>/dev/null || echo "000")

if [ "$STATUS_CODE" = "000" ]; then
    echo -e "${RED}✗ Cannot connect to SonarQube server${NC}"
    echo -e "${YELLOW}  Possible causes:${NC}"
    echo -e "${YELLOW}  - Server is down${NC}"
    echo -e "${YELLOW}  - VPN required (are you connected?)${NC}"
    echo -e "${YELLOW}  - Network/firewall issues${NC}"
    echo -e "${YELLOW}  - Incorrect URL${NC}"
    exit 1
elif [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Server is reachable (HTTP $STATUS_CODE)${NC}"
    
    # Get server status
    SERVER_STATUS=$(curl -s "$SONAR_URL/api/system/status" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$SERVER_STATUS" = "UP" ]; then
        echo -e "${GREEN}✓ Server status: UP${NC}"
    else
        echo -e "${YELLOW}⚠ Server status: $SERVER_STATUS${NC}"
    fi
elif [ "$STATUS_CODE" = "401" ] || [ "$STATUS_CODE" = "403" ]; then
    echo -e "${YELLOW}⚠ Server reachable but authentication required (HTTP $STATUS_CODE)${NC}"
    echo -e "${GREEN}✓ This is expected - will authenticate with token during analysis${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected response: HTTP $STATUS_CODE${NC}"
    echo -e "${YELLOW}  Server may be reachable but returning an error${NC}"
fi
echo ""

# Validate project key
echo -e "${BLUE}[5/6]${NC} Validating project configuration..."
PROJECT_KEY=$(grep '^sonar.projectKey' sonar-project.properties | cut -d'=' -f2 | tr -d ' ')

if [ -z "$PROJECT_KEY" ]; then
    echo -e "${RED}✗ sonar.projectKey not found${NC}"
    exit 1
fi

echo -e "  Project Key: ${GREEN}$PROJECT_KEY${NC}"
echo -e "${GREEN}✓ Project key is set${NC}"
echo ""

# Check if sonar-scanner is installed
echo -e "${BLUE}[6/6]${NC} Checking sonar-scanner installation..."
if command -v sonar-scanner &> /dev/null; then
    SCANNER_VERSION=$(sonar-scanner --version 2>&1 | grep "SonarScanner" | head -n1)
    echo -e "${GREEN}✓ sonar-scanner is installed${NC}"
    echo -e "  Version: $SCANNER_VERSION"
else
    echo -e "${YELLOW}⚠ sonar-scanner not found in PATH${NC}"
    echo -e "${YELLOW}  Will use npm package (node_modules/sonar-scanner)${NC}"
    
    if [ -d "node_modules/sonar-scanner" ]; then
        echo -e "${GREEN}✓ sonar-scanner npm package found${NC}"
    else
        echo -e "${RED}✗ sonar-scanner not found${NC}"
        echo -e "${YELLOW}  Please run: npm install${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All checks passed!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Ready to run SonarQube analysis!${NC}"
echo ""
echo -e "Next steps:"
echo -e "  ${BLUE}1.${NC} Run analysis:"
echo -e "     ${YELLOW}npm run sonar${NC}"
echo ""
echo -e "  ${BLUE}2.${NC} View results in SonarQube UI:"
echo -e "     ${YELLOW}$SONAR_URL/dashboard?id=$PROJECT_KEY${NC}"
echo ""
echo -e "  ${BLUE}3.${NC} Generate quality report:"
echo -e "     ${YELLOW}npm run sonar:report${NC}"
echo ""
echo -e "  ${BLUE}4.${NC} Open Quality Dashboard:"
echo -e "     ${YELLOW}npm start${NC}"
echo -e "     ${YELLOW}http://localhost:4300/#/dashboard/Quality${NC}"
echo ""
