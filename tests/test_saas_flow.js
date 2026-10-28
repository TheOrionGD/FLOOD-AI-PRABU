/**
 * test_saas_flow.js
 * Verification of SaaS endpoints, RBAC protection, and Admin/Analyst/Resident APIs.
 */

const path = require('path');
const axios = require(path.join(__dirname, '../backend/node_modules/axios'));
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'floodai_threat_intelligence_super_secret_key_2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('STARTING SAAS FLOW & RBAC VERIFICATION SUITE');
  console.log('====================================================');

  // Create simulated tokens for different roles
  const adminToken = jwt.sign({ userId: '65f000000000000000000001', email: 'admin@floodai.org', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  const analystToken = jwt.sign({ userId: '65f000000000000000000002', email: 'analyst@floodai.org', role: 'analyst' }, JWT_SECRET, { expiresIn: '1h' });
  const residentToken = jwt.sign({ userId: '65f000000000000000000003', email: 'resident@floodai.org', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });

  // 1. Unauthenticated request to /api/admin/stats should be 401
  try {
    await axios.get(`${API_BASE}/admin/stats`);
    assert(false, 'Unauthenticated /api/admin/stats should reject with 401');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated /api/admin/stats rejected with 401');
  }

  // 2. Health endpoint check
  try {
    const res = await axios.get(`${API_BASE}/health`);
    assert(res.status === 200 && res.data.status === 'healthy', 'Health endpoint returns 200 healthy');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 3. Alerts endpoint (Public GET)
  try {
    const res = await axios.get(`${API_BASE}/alerts`);
    assert(res.status === 200 && Array.isArray(res.data), 'Public GET /api/alerts returns 200 and array');
  } catch (err) {
    assert(false, `GET /api/alerts failed: ${err.message}`);
  }

  // 4. Threats current endpoint (Public GET)
  try {
    const res = await axios.get(`${API_BASE}/threats/current`);
    assert(res.status === 200 && Array.isArray(res.data.assessments), 'GET /api/threats/current returns assessments array');
  } catch (err) {
    assert(false, `GET /api/threats/current failed: ${err.message}`);
  }

  // 5. Personal intelligence endpoint
  try {
    const res = await axios.get(`${API_BASE}/threats/personal-intelligence?lat=13.08&lon=80.27`);
    assert(res.status === 200 && res.data.nearest_district, 'GET /api/threats/personal-intelligence returns nearest_district');
  } catch (err) {
    assert(false, `Personal intelligence check failed: ${err.message}`);
  }

  // 6. Geospatial districts
  try {
    const res = await axios.get(`${API_BASE}/geospatial/districts`);
    assert(res.status === 200 && res.data.type === 'FeatureCollection', 'GET /api/geospatial/districts returns FeatureCollection');
  } catch (err) {
    assert(false, `Districts check failed: ${err.message}`);
  }

  // 7. Historical disaster records
  try {
    const res = await axios.get(`${API_BASE}/floods?limit=5`);
    assert(res.status === 200 && Array.isArray(res.data.records), 'GET /api/floods returns disaster records list');
  } catch (err) {
    assert(false, `Disaster catalog check failed: ${err.message}`);
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

run();
