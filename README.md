# KnowHOW UI

Code of UI image to host knowHOW which interacts with knowHOW-API.
This is developed using Angular 17.3.

## Tech Stack

This project uses Angular 17.3 with PrimeNG for UI components. For a comprehensive list of all dependencies and their versions, see [TECH_STACK.md](TECH_STACK.md).

**Key Technologies:**
- **Framework:** Angular 17.3
- **UI Components:** PrimeNG, Angular Material
- **Charts:** Chart.js, D3.js
- **Utilities:** RxJS, ExcelJS, jsPDF

## Security Requirements (Mandatory)

This repository uses GitGuardian via pre-commit hooks to scan your code before every commit.

### Setup

Run once after cloning:
```bash
pip install pre-commit
pre-commit install
```

## Automated Dependency Tracking

This project includes automated dependency drift tracking that:
- ✅ Detects when `package.json` changes
- ✅ Automatically generates a tech stack report (`TECH_STACK.md`)
- ✅ Updates documentation with current versions
- ✅ Flags version inconsistencies

### Manual Commands

Generate or update the tech stack report:
```bash
npm run tech-stack:report
```

Check for dependency drift without updating README:
```bash
npm run tech-stack:check
