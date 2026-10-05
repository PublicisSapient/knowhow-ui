#!/bin/bash

################################################################################
# Security Headers Verification Script
# 
# This script verifies that all required enterprise security headers are
# properly configured in the Nginx web server.
#
# Usage:
#   ./scripts/verify-security-headers.sh [URL]
#
# Default URL: http://localhost:80 (or http://localhost:4300 for dev server)
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default URL
URL="${1:-http://localhost:80}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔒 Security Headers Verification${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Target URL: ${URL}"
echo ""

# Check if server is reachable
echo -e "${BLUE}📡 Checking if server is reachable...${NC}"
if ! curl -f -s "$URL" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not reachable at $URL${NC}"
    echo -e "${YELLOW}💡 Tip: Make sure your server is running${NC}"
    echo -e "${YELLOW}   For development: npm start${NC}"
    echo -e "${YELLOW}   For Docker: docker-compose up${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is reachable${NC}"
echo ""

# Fetch headers
echo -e "${BLUE}🔍 Fetching HTTP headers...${NC}"
HEADERS=$(curl -I -s "$URL")

if [ -z "$HEADERS" ]; then
    echo -e "${RED}❌ Failed to fetch headers${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Headers fetched successfully${NC}"
echo ""

# Track failures
FAILED_CHECKS=0

# Define security headers to check
echo -e "${BLUE}🔒 Validating Security Headers:${NC}"
echo "----------------------------------------"

# 1. X-Frame-Options (Clickjacking Protection)
echo -n "1. X-Frame-Options: "
if echo "$HEADERS" | grep -qi "X-Frame-Options: SAMEORIGIN"; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Value: SAMEORIGIN"
    echo "   Purpose: Prevents clickjacking attacks"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Expected: SAMEORIGIN"
    echo "   Purpose: Prevents clickjacking attacks"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# 2. X-Content-Type-Options (MIME Sniffing Protection)
echo -n "2. X-Content-Type-Options: "
if echo "$HEADERS" | grep -qi "X-Content-Type-Options: nosniff"; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Value: nosniff"
    echo "   Purpose: Prevents MIME-sniffing attacks"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Expected: nosniff"
    echo "   Purpose: Prevents MIME-sniffing attacks"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# 3. Referrer-Policy (Privacy Protection)
echo -n "3. Referrer-Policy: "
if echo "$HEADERS" | grep -qi "Referrer-Policy:"; then
    REFERRER_VALUE=$(echo "$HEADERS" | grep -i "Referrer-Policy:" | cut -d':' -f2 | xargs)
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Value: $REFERRER_VALUE"
    echo "   Purpose: Controls referrer information sent to other sites"
    
    # Check if it's the recommended value
    if echo "$REFERRER_VALUE" | grep -qi "strict-origin-when-cross-origin"; then
        echo -e "   ${GREEN}✓ Using recommended policy${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Recommended: strict-origin-when-cross-origin${NC}"
    fi
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Expected: strict-origin-when-cross-origin"
    echo "   Purpose: Controls referrer information sent to other sites"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# 4. Content-Security-Policy (XSS Protection)
echo -n "4. Content-Security-Policy: "
if echo "$HEADERS" | grep -qi "Content-Security-Policy:"; then
    echo -e "${GREEN}✅ PASS${NC}"
    CSP_VALUE=$(echo "$HEADERS" | grep -i "Content-Security-Policy:" | cut -d':' -f2- | xargs)
    echo "   Value: ${CSP_VALUE:0:80}..."
    echo "   Purpose: Prevents XSS and code injection attacks"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Expected: CSP policy defined"
    echo "   Purpose: Prevents XSS and code injection attacks"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# 5. Permissions-Policy (Feature Control)
echo -n "5. Permissions-Policy: "
if echo "$HEADERS" | grep -qi "Permissions-Policy:"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PERMISSIONS_VALUE=$(echo "$HEADERS" | grep -i "Permissions-Policy:" | cut -d':' -f2- | xargs)
    echo "   Value: ${PERMISSIONS_VALUE:0:80}..."
    echo "   Purpose: Controls browser feature access"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Expected: Permissions policy defined"
    echo "   Purpose: Controls browser feature access"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

# 6. X-XSS-Protection (Legacy XSS Protection)
echo -n "6. X-XSS-Protection: "
if echo "$HEADERS" | grep -qi "X-XSS-Protection:"; then
    echo -e "${GREEN}✅ PASS${NC}"
    XSS_VALUE=$(echo "$HEADERS" | grep -i "X-XSS-Protection:" | cut -d':' -f2 | xargs)
    echo "   Value: $XSS_VALUE"
    echo "   Purpose: Enables XSS filter in legacy browsers"
else
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    echo "   Expected: 1; mode=block"
    echo "   Purpose: Enables XSS filter in legacy browsers"
    echo "   Note: Legacy header, not critical for modern browsers"
fi
echo ""

# 7. Strict-Transport-Security (HSTS)
echo -n "7. Strict-Transport-Security: "
if echo "$HEADERS" | grep -qi "Strict-Transport-Security:"; then
    echo -e "${GREEN}✅ PASS${NC}"
    HSTS_VALUE=$(echo "$HEADERS" | grep -i "Strict-Transport-Security:" | cut -d':' -f2 | xargs)
    echo "   Value: $HSTS_VALUE"
    echo "   Purpose: Enforces HTTPS connections"
    echo "   Note: Only works over HTTPS"
else
    echo -e "${YELLOW}⚠️  INFO${NC}"
    echo "   Expected: max-age=31536000; includeSubDomains; preload"
    echo "   Purpose: Enforces HTTPS connections"
    echo "   Note: Only applicable when serving over HTTPS"
fi
echo ""

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 Summary${NC}"
echo -e "${BLUE}============================================${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical security headers are properly configured!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your application is protected against:${NC}"
    echo "   • Clickjacking attacks (X-Frame-Options)"
    echo "   • MIME-sniffing attacks (X-Content-Type-Options)"
    echo "   • Cross-Site Scripting (Content-Security-Policy)"
    echo "   • Privacy leaks (Referrer-Policy)"
    echo "   • Unauthorized feature access (Permissions-Policy)"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Security header validation failed!${NC}"
    echo -e "${RED}Failed checks: $FAILED_CHECKS${NC}"
    echo ""
    echo -e "${YELLOW}📝 Action Required:${NC}"
    echo "   1. Review nginx/files/nginx_http.conf"
    echo "   2. Review nginx/files/nginx_https.conf"
    echo "   3. Ensure all add_header directives are present"
    echo "   4. Restart your web server"
    echo "   5. Run this script again to verify"
    echo ""
    echo -e "${BLUE}💡 Need help?${NC}"
    echo "   See: SECURITY_HEADERS_GUIDE.md"
    echo ""
    
    # Print full headers for debugging
    echo -e "${BLUE}Full headers received:${NC}"
    echo "----------------------------------------"
    echo "$HEADERS"
    echo "----------------------------------------"
    echo ""
    
    exit 1
fi
