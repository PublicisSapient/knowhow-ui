# Install PostHog and Grafana Faro packages for analytics implementation
# Run this script from the knowhow-ui directory

Write-Host "Installing PostHog package..." -ForegroundColor Green
npm install posthog-js

Write-Host "Installing Grafana Faro Web SDK..." -ForegroundColor Green
npm install @grafana/faro-web-sdk

Write-Host "Installing additional TypeScript types for PostHog session replay..." -ForegroundColor Yellow
npm install --save-dev @rrweb/types@2.0.0-alpha.17 rrweb-snapshot@2.0.0-alpha.17

Write-Host "Analytics packages installed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your PostHog API key in environment.ts" -ForegroundColor White
Write-Host "2. Configure your Grafana Faro collector URL in environment.ts" -ForegroundColor White
Write-Host "3. Set the analytics provider in environment.ts (google/posthog/faro/disabled)" -ForegroundColor White
Write-Host "4. Adjust rolloutPercentage to control feature flag rollout" -ForegroundColor White
