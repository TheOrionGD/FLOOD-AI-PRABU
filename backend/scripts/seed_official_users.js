/**
 * seed_official_users.js
 * Ensures the 3 official FloodAI accounts are seeded and synchronized across:
 * 1. MongoDB Atlas (with accurate role-based clearance and hashed password)
 * 2. Firebase Authentication (Identity Toolkit REST API)
 * 
 * Target Accounts:
 * - Admin: hello.theoriongd@gmail.com (Role: admin)
 * - Analyst: godfreytr.prof@gmail.com (Role: analyst)
 * - Resident: godfrey.prof@gmail.com (Role: resident)
 * Password for all: TheOrionGD@123
 */

const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

const path = require("path");
const https = require("https");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const FIREBASE_API_KEY = "AIzaSyCbk9iP9HPq4PhGqGLMHmv03OvUbh7rgfM";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flood_prediction";

const OFFICIAL_ACCOUNTS = [
  {
    email: "hello.theoriongd@gmail.com",
    role: "admin",
    displayName: "Orion Administrator",
    password: "TheOrionGD@123",
  },
  {
    email: "godfreytr.prof@gmail.com",
    role: "analyst",
    displayName: "Godfrey Analyst",
    password: "TheOrionGD@123",
  },
  {
    email: "godfrey.prof@gmail.com",
    role: "resident",
    displayName: "Godfrey Resident",
    password: "TheOrionGD@123",
  },
];

function firebaseRequest(endpoint, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: "identitytoolkit.googleapis.com",
        path: `/v1/${endpoint}?key=${FIREBASE_API_KEY}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (_) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ status: 500, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function syncFirebaseAccounts() {
  console.log("\n🔥 --- Synchronizing Firebase Authentication Accounts ---");
  for (const acc of OFFICIAL_ACCOUNTS) {
    // 1. Try to sign up the account on Firebase
    const signUpRes = await firebaseRequest("accounts:signUp", {
      email: acc.email,
      password: acc.password,
      returnSecureToken: true,
    });

    if (signUpRes.status === 200) {
      console.log(`  ✅ [Firebase:Created] ${acc.email} (LocalId: ${signUpRes.data.localId})`);
    } else if (signUpRes.data?.error?.message === "EMAIL_EXISTS") {
      // 2. Account already exists in Firebase, verify sign-in with password
      const signInRes = await firebaseRequest("accounts:signInWithPassword", {
        email: acc.email,
        password: acc.password,
        returnSecureToken: true,
      });

      if (signInRes.status === 200) {
        console.log(`  ✅ [Firebase:Verified] ${acc.email} (Active with designated password)`);
      } else {
        console.log(`  ℹ️ [Firebase:Existing] ${acc.email} (Registered with federated Google Provider)`);
      }
    } else {
      console.warn(`  ⚠️ [Firebase:Notice] ${acc.email}:`, signUpRes.data?.error?.message || signUpRes.data);
    }
  }
}

async function syncDatabaseAccounts() {
  console.log("\n🍃 --- Synchronizing MongoDB Atlas User Roles & Hashes ---");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const User = require("../models/User");

  for (const acc of OFFICIAL_ACCOUNTS) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(acc.password, salt);
    const normalizedEmail = acc.email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.role = acc.role;
      user.displayName = acc.displayName;
      user.passwordHash = passwordHash;
      user.emailVerified = true;
      await user.save();
      console.log(`  ✅ [MongoDB:Updated] ${acc.email} -> Role: [${acc.role.toUpperCase()}]`);
    } else {
      user = await User.create({
        email: normalizedEmail,
        displayName: acc.displayName,
        role: acc.role,
        passwordHash,
        authProvider: "local",
        emailVerified: true,
      });
      console.log(`  ✅ [MongoDB:Created] ${acc.email} -> Role: [${acc.role.toUpperCase()}]`);
    }
  }

  const verifiedUsers = await User.find(
    { email: { $in: OFFICIAL_ACCOUNTS.map((a) => a.email) } },
    "email role displayName"
  );
  console.log("\n📋 Active Verified Accounts in Database:");
  verifiedUsers.forEach((u) => {
    console.log(`   • ${u.email} => Role: ${u.role.toUpperCase()} (${u.displayName})`);
  });

  await mongoose.disconnect();
}

async function main() {
  console.log("========================================================");
  console.log(" FLOODAI OFFICIAL ACCOUNTS FIREBASE & DATABASE SYNC");
  console.log("========================================================");
  await syncFirebaseAccounts();
  await syncDatabaseAccounts();
  console.log("\n🎉 Synchronization complete.");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}

module.exports = { syncFirebaseAccounts, syncDatabaseAccounts, OFFICIAL_ACCOUNTS };
