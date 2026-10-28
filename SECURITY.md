# Security Policy

## Supported Versions

The FloodAI core team actively provides security updates and vulnerability patches for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

We take the security and integrity of the FloodAI planetary disaster intelligence platform seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us responsibly.

### How to Report
Please **do not** file public GitHub issues for security vulnerabilities, secret leaks, or authorization flaws.

Instead, report vulnerabilities privately by emailing:
**`security@floodai.org`**

Please include in your report:
1. **Description of the vulnerability**: What is the root cause and impact?
2. **Steps to reproduce**: Minimal proof-of-concept (curl commands, script, or browser reproduction steps).
3. **Affected components**: Frontend, Backend Gateway, or Python ML service.
4. **Suggested mitigation**: (Optional) Recommended patches or configuration changes.

### Our Commitment
- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide a status update and estimated timeline for a patch within **5 business days**.
- Once patched, we will publicly acknowledge your contribution (if desired).

## Secret & Credential Leak Policy
Under no circumstances should any developer, contributor, or automated pipeline commit populated `.env` files, MongoDB connection strings with cleartext passwords, Firebase private keys, or API credentials into source code. All secrets are scanned via automated CI/CD tools (`gitleaks`, `validate_secrets.js`). Any leaked credentials will be immediately rotated and revoked.
