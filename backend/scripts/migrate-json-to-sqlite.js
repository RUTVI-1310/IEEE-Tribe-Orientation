/**
 * scripts/migrate-json-to-sqlite.js
 * ---------------------------------------------------------------
 * One-time helper: copies every record from the old data/results.json
 * file into the new SQLite database (data/results.db).
 *
 * Run this ONCE, if you have real quiz responses already sitting in
 * results.json that you don't want to lose. Safe to run more than
 * once — it skips ids that are already in the database.
 *
 * Usage (from the backend/ folder):
 *   npm run migrate
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const JSON_FILE = path.join(__dirname, "..", "data", "results.json");
const DB_FILE = path.join(__dirname, "..", "data", "results.db");

// Requiring db.js here also creates data/results.db and the table,
// since db.js runs that setup as soon as it's loaded.
const db = require("../db");

function loadOldRecords() {
  if (!fs.existsSync(JSON_FILE)) {
    console.log(`No ${JSON_FILE} found — nothing to migrate.`);
    return [];
  }
  const raw = fs.readFileSync(JSON_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Could not parse results.json:", err.message);
    return [];
  }
}

async function main() {
  const oldRecords = loadOldRecords();
  if (oldRecords.length === 0) {
    console.log("Nothing to migrate. Done.");
    return;
  }

  const existingIds = new Set(db.getAll().map((r) => r.id));

  // db.insert() normally generates a fresh id + receivedAt, but for a
  // migration we want to KEEP each record's original id and timestamp,
  // so we talk to the underlying table directly here instead.
  const raw = new DatabaseSync(DB_FILE);
  const insertStmt = raw.prepare(
    `INSERT OR IGNORE INTO results (id, name, branch, identity, committee, hoursPerWeek, scoreBreakdown, receivedAt)
     VALUES (@id, @name, @branch, @identity, @committee, @hoursPerWeek, @scoreBreakdown, @receivedAt)`
  );

  let migrated = 0;
  let skipped = 0;

  for (const record of oldRecords) {
    if (record.id && existingIds.has(record.id)) {
      skipped++;
      continue;
    }
    insertStmt.run({
      id: record.id || crypto.randomUUID(),
      name: record.name || "",
      branch: record.branch || "",
      identity: record.identity || "",
      committee: record.committee || "",
      hoursPerWeek: record.hoursPerWeek ?? null,
      scoreBreakdown: JSON.stringify(record.scoreBreakdown || {}),
      receivedAt: record.receivedAt || new Date().toISOString(),
    });
    migrated++;
  }
  raw.close();

  console.log(`Migration complete. Migrated: ${migrated}, skipped (already present): ${skipped}.`);
  console.log(`Total records now in results.db: ${db.count()}`);
}

main();
