const express = require("express");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const adminAuth = require("../middleware/adminAuth");
const { validateSubmission } = require("../utils/validate");

const router = express.Router();

// Someone spamming your public /submit endpoint is the most likely
// abuse this API will see, so it gets its own, stricter limiter on
// top of the general one applied in server.js.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 submissions per IP per window is generous for real users
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this device. Please try again later." },
});

/**
 * POST /api/results/submit
 * Public endpoint the quiz frontend calls when someone finishes the quiz.
 * This matches the payload shape already sent by script.js's submitResult().
 */
router.post("/submit", submitLimiter, async (req, res) => {
  const result = validateSubmission(req.body);
  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  try {
    const saved = await db.insert(result.data);
    return res.status(201).json({ success: true, id: saved.id });
  } catch (err) {
    console.error("[POST /submit] Failed to save result:", err);
    return res.status(500).json({ error: "Could not save your result. Please try again." });
  }
});

/**
 * GET /api/results/stats
 * Public, lightweight endpoint for the "128 freshers have found their
 * tribe today" live counter on the landing screen — so that number can
 * be real instead of a client-side random simulation.
 */
router.get("/stats", (req, res) => {
  res.json({
    totalResponses: db.count(),
    respondedToday: db.countToday(),
  });
});

/**
 * GET /api/results
 * Admin-only: list every stored result, newest first.
 * Requires header: x-admin-key: <your ADMIN_KEY>
 */
router.get("/", adminAuth, (req, res) => {
  res.json({ results: db.getAll() });
});

/**
 * GET /api/results/export.csv
 * Admin-only: download all results as a CSV file (opens directly in Excel/Sheets).
 */
router.get("/export.csv", adminAuth, (req, res) => {
  const rows = db.getAll();
  const headers = [
    "id",
    "receivedAt",
    "name",
    "branch",
    "identity",
    "committee",
    "hoursPerWeek",
    "design",
    "drafting",
    "media",
    "program",
    "tech",
    "publicity",
  ];

  const escapeCsv = (value) => {
    const str = value === undefined || value === null ? "" : String(value);
    // Quote any field containing a comma, quote, or newline; double up internal quotes.
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const lines = [headers.join(",")];
  for (const r of rows) {
    const scores = r.scoreBreakdown || {};
    lines.push(
      [
        r.id,
        r.receivedAt,
        r.name,
        r.branch,
        r.identity,
        r.committee,
        r.hoursPerWeek || "",
        scores.design || 0,
        scores.drafting || 0,
        scores.media || 0,
        scores.program || 0,
        scores.tech || 0,
        scores.publicity || 0,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ieee-tribe-results-${Date.now()}.csv"`);
  res.send(lines.join("\n"));
});

/**
 * DELETE /api/results/:id
 * Admin-only: remove a single (e.g. accidental/test) submission.
 */
router.delete("/:id", adminAuth, async (req, res) => {
  const removed = await db.deleteById(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: "No result found with that id." });
  }
  res.json({ success: true });
});

module.exports = router;
