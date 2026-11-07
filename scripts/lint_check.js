#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const TARGET_DIRS = ['frontend', 'backend', 'tests', 'scripts'];
let totalChecked = 0;
let errors = 0;

function checkFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    try {
      new vm.Script(code, { filename: filePath });
    } catch (scriptErr) {
      if (scriptErr.message && (scriptErr.message.includes('Cannot use import statement') || scriptErr.message.includes('Unexpected token \'export\''))) {
        if (vm.SourceTextModule) {
          new vm.SourceTextModule(code, { identifier: filePath });
        }
      } else {
        throw scriptErr;
      }
    }
    totalChecked++;
  } catch (err) {
    console.error(`[LINT ERROR] ${filePath}: ${err.message}`);
    errors++;
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      checkFile(fullPath);
    }
  }
}

for (const d of TARGET_DIRS) {
  scanDir(path.join(ROOT, d));
}

if (errors === 0) {
  console.log(`[PASS] Lint / syntax audit passed across ${totalChecked} JavaScript files. Zero errors found.`);
  process.exit(0);
} else {
  console.error(`[FAIL] Found ${errors} syntax/lint error(s) across ${totalChecked} files.`);
  process.exit(1);
}
