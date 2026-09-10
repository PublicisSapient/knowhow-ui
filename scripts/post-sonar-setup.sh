#!/bin/bash

################################################################################
# Post-SonarQube Analysis Setup Script
# 
# Run this after successful SonarQube analysis to set up the Quality Dashboard
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Quality Dashboard Configuration Helper${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get SonarQube configuration
SONAR_URL=$(grep '^sonar.host.url' sonar-project.properties | cut -d'=' -f2 | tr -d ' ')
PROJECT_KEY=$(grep '^sonar.projectKey' sonar-project.properties | cut -d'=' -f2 | tr -d ' ')

echo -e "${GREEN}✓ SonarQube Configuration Detected${NC}"
echo -e "  Server URL:  ${BLUE}$SONAR_URL${NC}"
echo -e "  Project Key: ${BLUE}$PROJECT_KEY${NC}"
echo ""

# Generate quality report
echo -e "${BLUE}[1/3]${NC} Generating quality report..."
if npm run sonar:report > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Quality report generated${NC}"
else
    echo -e "${YELLOW}⚠ Could not generate report (this is optional)${NC}"
fi
echo ""

# Create configuration guide
echo -e "${BLUE}[2/3]${NC} Creating Quality Dashboard configuration guide..."

cat > QUALITY_DASHBOARD_CONFIG.txt << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Quality Dashboard Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Step 1: Start the Application

   npm start

   Wait for: "Compiled successfully"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Step 2: Open Quality Dashboard

   URL: http://localhost:4300/#/dashboard/Quality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Step 3: Configure SonarQube Connection (First Time Only)

   A configuration dialog will appear. Enter:

   🔹 SonarQube Server URL:
      $SONAR_URL

   🔹 Project Key:
      $PROJECT_KEY

   🔹 Authentication Token (Optional):
      (Your SonarQube token - same as SONAR_TOKEN env variable)
      
      To get your token:
      - Login to: $SONAR_URL
      - Go to: My Account → Security → Generate Tokens
      - Name: knowhow-quality-dashboard
      - Copy and paste the token

   Click "Save"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Step 4: Explore the Dashboard!

   You should now see:
   
   ✓ Summary cards with total components, health score, bugs, etc.
   ✓ Health distribution chart
   ✓ Component cards with detailed metrics
   ✓ Quality Gate status

   Try:
   - Filter by health status (Excellent, Good, Fair, Poor, Critical)
   - Search for specific components
   - Switch between Grid/List/Tree views
   - Export data to CSV

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Quick Reference

   View in SonarQube UI:
   $SONAR_URL/dashboard?id=$PROJECT_KEY

   Generate CLI report:
   npm run sonar:report

   Check health threshold:
   npm run sonar:check

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 Troubleshooting

   If you see "Failed to load quality data":
   
   1. Verify server URL is correct (base URL only, no /dashboard)
   2. Check if token is valid
   3. Ensure SonarQube analysis completed successfully
   4. Check browser console for errors (F12)
   
   For more help, see:
   - SONARQUBE_TROUBLESHOOTING.md
   - QUALITY_DASHBOARD_SETUP.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo -e "${GREEN}✓ Configuration guide saved to: QUALITY_DASHBOARD_CONFIG.txt${NC}"
echo ""

# Check if analysis was successful
echo -e "${BLUE}[3/3]${NC} Checking recent analysis..."
if [ -f ".sonar/report-task.txt" ]; then
    echo -e "${GREEN}✓ SonarQube analysis report found${NC}"
    
    DASHBOARD_URL=$(grep 'dashboardUrl' .sonar/report-task.txt | cut -d'=' -f2-)
    if [ ! -z "$DASHBOARD_URL" ]; then
        echo -e "  View in SonarQube: ${BLUE}$DASHBOARD_URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No recent analysis found${NC}"
    echo -e "${YELLOW}  Run 'npm run sonar' first${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📖 Configuration guide:${NC} ${YELLOW}QUALITY_DASHBOARD_CONFIG.txt${NC}"
echo ""
echo -e "${GREEN}🚀 Next steps:${NC}"
echo -e "  1. ${BLUE}cat QUALITY_DASHBOARD_CONFIG.txt${NC}  (read the guide)"
echo -e "  2. ${BLUE}npm start${NC}                       (start the app)"
echo -e "  3. Open ${BLUE}http://localhost:4300/#/dashboard/Quality${NC}"
echo ""
