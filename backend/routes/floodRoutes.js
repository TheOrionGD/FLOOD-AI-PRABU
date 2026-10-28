const express = require("express");
const router = express.Router();
const FloodRecord = require("../models/FloodRecord");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// GET /api/floods -> paginated, searchable, filterable list of real ground-truth records
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      district,
      state,
      year,
      severity,
      flood_occurred,
      search,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { district: new RegExp(search, "i") },
        { state: new RegExp(search, "i") },
        { flood_severity: new RegExp(search, "i") },
      ];
    }
    if (district) query.district = new RegExp(`^${district}$`, "i");
    if (state) query.state = new RegExp(`^${state}$`, "i");
    if (severity) query.flood_severity = severity;
    if (flood_occurred !== undefined) {
      query.flood_occurred = flood_occurred === "true" || flood_occurred === "1";
    }
    if (year) {
      query.date = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === "asc" ? 1 : -1;

    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [records, total] = await Promise.all([
      FloodRecord.find(query)
        .sort(sortOption)
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean(),
      FloodRecord.countDocuments(query),
    ]);

    res.json({
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
      records,
    });
  } catch (err) {
    console.error("[Floods:List:Error]", err);
    res.status(500).json({ error: "Failed to retrieve flood records", detail: err.message });
  }
});

// GET /api/floods/stats -> real-time aggregate KPI metrics from MongoDB Atlas
router.get("/stats", async (req, res) => {
  try {
    const [kpis] = await FloodRecord.aggregate([
      {
        $group: {
          _id: null,
          total_records: { $sum: 1 },
          flood_events: {
            $sum: { $cond: ["$flood_occurred", 1, 0] },
          },
          avg_rainfall_mm: { $avg: "$rainfall_mm" },
          max_rainfall_mm: { $max: "$rainfall_mm" },
          avg_river_level_m: { $avg: "$river_level_m" },
          total_damage_inr: { $sum: "$damage_cost_inr" },
          total_affected: { $sum: "$affected_population" },
          total_deaths: { $sum: "$deaths" },
          avg_rescue_time_hrs: { $avg: "$rescue_time_hrs" },
        },
      },
    ]);

    const stats = kpis || {
      total_records: 0,
      flood_events: 0,
      avg_rainfall_mm: 0,
      max_rainfall_mm: 0,
      avg_river_level_m: 0,
      total_damage_inr: 0,
      total_affected: 0,
      total_deaths: 0,
      avg_rescue_time_hrs: 0,
    };

    delete stats._id;
    stats.flood_rate_pct = stats.total_records
      ? ((stats.flood_events / stats.total_records) * 100).toFixed(2)
      : 0;

    res.json(stats);
  } catch (err) {
    console.error("[Floods:Stats:Error]", err);
    res.status(500).json({ error: "Failed to compute stats", detail: err.message });
  }
});

// GET /api/floods/analytics -> 100% dynamic analytical trends and district summaries via MongoDB aggregation
router.get("/analytics", async (req, res) => {
  try {
    const [yearlyTrends, districtSummaries, severityBreakdown] = await Promise.all([
      // 1. 24-Year Trend Aggregation
      FloodRecord.aggregate([
        {
          $group: {
            _id: { $year: "$date" },
            avg_rainfall: { $avg: "$rainfall_mm" },
            avg_sea_level: { $avg: "$sea_level_m" },
            avg_temp: { $avg: "$temperature_c" },
            cyclones: { $sum: { $cond: ["$cyclone", 1, 0] } },
            flood_events: { $sum: { $cond: ["$flood_occurred", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            year: "$_id",
            avg_rainfall: { $round: ["$avg_rainfall", 2] },
            avg_sea_level: { $round: ["$avg_sea_level", 2] },
            avg_temp: { $round: ["$avg_temp", 2] },
            cyclones: 1,
            flood_events: 1,
          },
        },
      ]),

      // 2. Monitored District Profiles
      FloodRecord.aggregate([
        {
          $group: {
            _id: "$district",
            state: { $first: "$state" },
            latitude: { $first: "$latitude" },
            longitude: { $first: "$longitude" },
            total_records: { $sum: 1 },
            flood_events: { $sum: { $cond: ["$flood_occurred", 1, 0] } },
            avg_risk: { $avg: "$flood_probability_pct" },
            avg_elevation: { $avg: "$elevation_m" },
            avg_population_density: { $avg: "$population_density" },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            district: "$_id",
            state: 1,
            latitude: 1,
            longitude: 1,
            total_records: 1,
            flood_events: 1,
            avg_risk: { $round: ["$avg_risk", 2] },
            avg_elevation: { $round: ["$avg_elevation", 2] },
            avg_population_density: { $round: ["$avg_population_density", 2] },
          },
        },
      ]),

      // 3. Severity Distribution
      FloodRecord.aggregate([
        {
          $group: {
            _id: "$flood_severity",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            severity: "$_id",
            count: 1,
          },
        },
      ]),
    ]);

    res.json({
      yearly_trends: yearlyTrends,
      district_summary: districtSummaries,
      severity_breakdown: severityBreakdown,
      data_source: "MongoDB Atlas Ground-Truth (10,000 Records)",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Floods:Analytics:Error]", err);
    res.status(500).json({ error: "Failed to compute analytics", detail: err.message });
  }
});

// GET /api/floods/:id -> single record
router.get("/:id", async (req, res) => {
  try {
    const record = await FloodRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/floods -> create new real record
router.post("/", authenticateToken, requireRole(["admin", "analyst"]), async (req, res) => {
  try {
    const record = await FloodRecord.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/floods/:id -> update record
router.put("/:id", authenticateToken, requireRole(["admin", "analyst"]), async (req, res) => {
  try {
    const record = await FloodRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/floods/:id -> delete record
router.delete("/:id", authenticateToken, requireRole(["admin", "analyst"]), async (req, res) => {
  try {
    const record = await FloodRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
