# Contributing to FloodAI

Thank you for your interest in contributing to the **FloodAI** Disaster Threat Intelligence platform! We welcome contributions from software engineers, data scientists, UX designers, and civil defense specialists.

---

## Code of Conduct
This project and everyone participating in it is governed by the [FloodAI Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Development Workflow

### 1. Fork & Branch
- Fork the repository on GitHub.
- Clone your fork locally: `git clone https://github.com/<your-username>/flood-ai-project.git`.
- Create a focused topic branch: `git checkout -b feature/my-enhancement` or `git checkout -b fix/issue-name`.

### 2. Secret Hygiene & Environment Setup
- Never commit `.env` or files containing live credentials.
- Use `.env.example` templates to set up your local environment.
- Run the automated secret validator before committing:
  ```bash
  node scripts/validation/validate_secrets.js
  ```

### 3. Verification & Testing
Before opening a pull request, ensure all verification suites pass:
```bash
# Run all core verification suites via npm
npm test

# Or execute individual test scripts
node tests/test_climate_engine.js
node tests/test_climate_backgrounds.js
node tests/test_light_theme_particles.js
node tests/test_responsive_role_nav.js
```

### 4. Pull Request Guidelines
- Follow the provided [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
- Keep PRs focused on a single feature or bug fix.
- Ensure all CI workflow checks pass.
- Write clear, descriptive commit messages.
