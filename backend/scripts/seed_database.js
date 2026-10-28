/**
 * seed_database.js
 * Ingests the complete 10,000-record ground-truth hydrological dataset
 * from dataset/flood_dataset.csv into MongoDB Atlas.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const FloodRecord = require("../models/FloodRecord");

async function seedDatabase(options = {}) {
  const csvPath = path.join(__dirname, "..", "..", "dataset", "flood_dataset.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`[Seed] Dataset CSV not found at: ${csvPath}`);
    return false;
  }

  const existingCount = await FloodRecord.countDocuments();
  if (existingCount >= 10000 && !options.force) {
    console.log(`[Seed] Database already contains ${existingCount} records. Skipping ingestion.`);
    return true;
  }

  console.log(`[Seed] Ingesting 10,000 real records from ${csvPath} into MongoDB Atlas...`);

  if (options.force) {
    await FloodRecord.deleteMany({});
  }

  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let headers = [];
  let batch = [];
  let totalInserted = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (isHeader) {
      headers = line.split(",").map((h) => h.trim());
      isHeader = false;
      continue;
    }

    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });

    const doc = {
      date: new Date(row.date),
      district: row.district,
      state: row.state,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      rainfall_mm: parseFloat(row.rainfall_mm),
      river_level_m: parseFloat(row.river_level_m),
      sea_level_m: parseFloat(row.sea_level_m),
      temperature_c: parseFloat(row.temperature_c),
      humidity_pct: parseFloat(row.humidity_pct),
      wind_speed_kmh: parseFloat(row.wind_speed_kmh),
      soil_moisture_pct: parseFloat(row.soil_moisture_pct),
      reservoir_level_pct: parseFloat(row.reservoir_level_pct),
      elevation_m: parseFloat(row.elevation_m),
      distance_from_coast_km: parseFloat(row.distance_from_coast_km),
      population_density: parseFloat(row.population_density),
      forest_cover_pct: parseFloat(row.forest_cover_pct),
      cyclone: row.cyclone === "1" || row.cyclone === "true",
      drainage_score: parseFloat(row.drainage_score),
      flood_occurred: row.flood_occurred === "1" || row.flood_occurred === "true",
      flood_severity: row.flood_severity,
      damage_cost_inr: parseFloat(row.damage_cost_inr),
      affected_population: parseInt(row.affected_population, 10),
      deaths: parseInt(row.deaths, 10),
      rescue_time_hrs: parseFloat(row.rescue_time_hrs),
      flood_probability_pct: parseFloat(row.flood_probability_pct),
    };

    batch.push(doc);

    if (batch.length >= 1000) {
      await FloodRecord.insertMany(batch);
      totalInserted += batch.length;
      console.log(`[Seed] Progress: ${totalInserted}/10000 records ingested...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await FloodRecord.insertMany(batch);
    totalInserted += batch.length;
  }

  console.log(`[Seed] Successfully populated ${totalInserted} ground-truth records into MongoDB Atlas.`);
  return true;
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[Seed] MONGODB_URI not found in backend/.env");
    process.exit(1);
  }

  mongoose
    .connect(uri, { serverSelectionTimeoutMS: 15000 })
    .then(async () => {
      console.log("[Seed] Connected to MongoDB Atlas. Starting ingestion...");
      await seedDatabase({ force: process.argv.includes("--force") });
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Seed:Error]", err.message);
      process.exit(1);
    });
}

module.exports = seedDatabase;
