# FloodAI UX & Feature Specification Notes

This document preserves the developer and UX enhancement backlog notes previously kept in root scratchpad.

---

## 1. Resident Portal & Phone Auto-Fetch
- **Requirement:** Make phone number entry optional during resident onboarding.
- **Auto-Detection:** Request device permissions where available (e.g., Web OTP / SIM identity in supported progressive web apps or native wrappers) to auto-fill the resident's contact number, similar to modern banking and authentication workflows.
- **Fallback:** Allow seamless manual entry or skipping without blocking emergency alert viewing.

---

## 2. Navigation Header Streamlining
- **Requirement:** Reduce header clutter by removing direct top-level tab links for all internal screens:
  - Overview (`home`)
  - Resident Portal (`portal`)
  - Threat Command (`command`)
  - Geospatial GIS (`map`)
  - AI Risk Lab (`predict`)
  - Live Telemetry (`weather`)
  - MLOps Benchmarks (`dashboard`)
- **Desktop Navigation:** Implement a Quick Command Palette accessible via `Ctrl + K` (or `Cmd + K` on macOS) for fast screen switching and search.
- **Mobile Navigation:** Consolidate navigation into a unified slide-out drawer / hamburger menu bar on mobile viewport layouts (`<= 900px`).

---

## 3. Role-Based Screen Visibility (RBAC)
- **Requirement:** Strictly filter visible navigation targets and commands based on the active user role (`Resident`, `Analyst`, `Admin`).
- **Behavior:**
  - If a screen requires elevated privileges (e.g., `admin-ops`, `admin-users`, `threat-command`), do not display it in the navigation menu or command palette for unauthorized roles.
  - Residents see citizen-focused views: Resident Risk, Alerts, Evacuation Guide, Local Weather, Profile.
  - Analysts see technical tools: AI Risk Lab, Threat Intel, Geospatial GIS, Comparison Benchmarks.
  - Administrators retain full system observability and command authority.
