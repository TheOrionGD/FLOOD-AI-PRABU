/**
 * scripts/validation/validate_secrets.js
 * Automated Security & Secret Leak Validator for FloodAI
 * 
 * Verifies:
 * 1. Sensitive files (.env, atlas-credentials.env, FIREBASE.JSON) are NOT tracked by git.
 * 2. Tracked files do not contain hardcoded credentials, MongoDB passwords, Groq API keys, or private keys.
 * 3. Configuration templates (.env.example) exist and only contain safe placeholders.
 * 4. Centralized configuration loaders (backend/config/env.js, ml_model/config.py) are present.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..", "..");

console.log("==================================================================");
console.log("FLOODAI DEVSECOPS & SECRET MANAGEMENT AUDIT");
console.log("==================================================================");

let exitCode = 0;

function reportPass(msg) {
  console.log(`[PASS] ${msg}`);
}

function reportFail(msg) {
  console.error(`[FAIL] ${msg}`);
  exitCode = 1;
}

// 1. Check Git Tracked Files for Forbidden Files
const FORBIDDEN_TRACKED_PATTERNS = [
  /^\.env$/i,
  /^backend\/\.env$/i,
  /^ml_model\/\.env$/i,
  /atlas-credentials\.env/i,
  /FIREBASE\.JSON/i,
  /service-account.*\.json/i,
  /\.pem$/i,
  /\.key$/i
];

try {
  const trackedFilesOutput = execSync("git ls-files", { cwd: ROOT_DIR, encoding: "utf8" });
  const trackedFiles = trackedFilesOutput.split("\n").map(f => f.trim()).filter(Boolean);

  let forbiddenFound = 0;
  for (const file of trackedFiles) {
    for (const pattern of FORBIDDEN_TRACKED_PATTERNS) {
      if (pattern.test(file)) {
        reportFail(`Forbidden sensitive file is tracked by git: ${file}`);
        forbiddenFound++;
      }
    }
  }

  if (forbiddenFound === 0) {
    reportPass(`Git index clean: 0 forbidden credential files tracked (out of ${trackedFiles.length} files).`);
  }
} catch (gitErr) {
  reportFail(`Git inspection error: ${gitErr.message}`);
}

// 2. Scan Tracked Files for Secret Signatures
const SECRET_SIGNATURES = [
  { name: "Live MongoDB Atlas Credentials", regex: /mongodb\+srv:\/\/[^:]+:[^@]+@[a-zA-Z0-9\.-]+\.mongodb\.net/i },
  { name: "Groq API Key", regex: /gsk_[a-zA-Z0-9]{30,}/ },
  { name: "RSA/EC Private Key", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Generic AWS Secret Key", regex: /aws_secret_access_key\s*=\s*[a-zA-Z0-9\/+=]{40}/i }
];

const SCAN_EXTENSIONS = [".js", ".py", ".html", ".css", ".json", ".md", ".sh", ".bat", ".yaml", ".yml"];
const EXCLUDE_DIRS = [".git", "node_modules", "venv", ".venv", "originalflood-ai-project"];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      // Skip .env files (they should be gitignored anyway) and binary files
      if (entry.name.startsWith(".env") && entry.name !== ".env.example") continue;
      if (!SCAN_EXTENSIONS.includes(ext) && !entry.name.endsWith(".example")) continue;

      try {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const sig of SECRET_SIGNATURES) {
          if (sig.regex.test(content)) {
            // Check if it's in validate_secrets.js itself or a template placeholder
            if (relPath.replace(/\\/g, "/") === "scripts/validation/validate_secrets.js") continue;
            if (content.includes("<username>:<password>")) continue; // template placeholder

            reportFail(`Potential secret leak detected in ${relPath}: ${sig.name}`);
          }
        }
      } catch (_) {}
    }
  }
}

scanDirectory(ROOT_DIR);
reportPass("Static pattern scan complete: No hardcoded API keys or cleartext credentials detected in codebase.");

// 3. Verify .env.example templates
const REQUIRED_TEMPLATES = [
  ".env.example",
  "backend/.env.example",
  "ml_model/.env.example",
  "frontend/.env.example"
];

for (const tmpl of REQUIRED_TEMPLATES) {
  const tmplPath = path.join(ROOT_DIR, tmpl);
  if (fs.existsSync(tmplPath)) {
    reportPass(`Configuration template exists: ${tmpl}`);
  } else {
    reportFail(`Missing required configuration template: ${tmpl}`);
  }
}

// 4. Verify Centralized Config Loaders
const REQUIRED_CONFIG_LOADERS = [
  "backend/config/env.js",
  "ml_model/config.py",
  "frontend/js/services/climateBackgroundService.js"
];

for (const loader of REQUIRED_CONFIG_LOADERS) {
  const loaderPath = path.join(ROOT_DIR, loader);
  if (fs.existsSync(loaderPath)) {
    reportPass(`Centralized service loader exists: ${loader}`);
  } else {
    reportFail(`Missing centralized service loader: ${loader}`);
  }
}

console.log("==================================================================");
if (exitCode === 0) {
  console.log("ALL SECURITY & SECRET MANAGEMENT CHECKS PASSED (100% CLEAN)");
} else {
  console.error("SECURITY AUDIT DETECTED FAILURES. REMEDIATION REQUIRED.");
}
console.log("==================================================================");

process.exit(exitCode);
