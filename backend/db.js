/**
 * db.js
 * ---------------------------------------------------------------
 * A tiny SQLite "database" using Node's BUILT-IN node:sqlite module
 * (available from Node 22.5+ — no extra package to install, and
 * critically, no native compilation step. The earlier version of
 * this file used the "better-sqlite3" package, which needs a C++
 * build toolchain (Visual Studio Build Tools on Windows) to install
 * — a common wall for beginners. node:sqlite ships inside Node
 * itself, so `npm install` never has to compile anything.
 *
 * You'll see an "ExperimentalWarning: SQLite is an experimental
 * feature" line when the server starts — that's expected and safe
 * to ignore; it just means the Node team hasn't marked the API as
 * permanently stable yet, not that it's unreliable.
 *
 * If this project ever needs to scale to a hosted multi-writer setup
 * (e.g. multiple server instances), swap this file out for Postgres —
 * every route in routes/results.js only talks to the small API
 * defined below (insert, getAll, count, countToday, deleteById), so
 * that swap wouldn't require touching route logic at all.
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "results.db");

// Make sure the data directory exists before anything else runs.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Opening the DatabaseSync connection creates the file if it doesn't exist yet.
const db = new DatabaseSync(DB_FILE);

// WAL (Write-Ahead Logging) mode lets reads and writes happen at the
// same time without locking each other out — the SQLite equivalent
// of the "safe concurrent writes" guarantee the old JSON store had
// to build by hand with a write queue + temp-file + rename.
db.exec("PRAGMA journal_mode = WAL;");

// Create the table on first run. IF NOT EXISTS makes this safe to
// run every time the server starts.
db.exec(`
  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    branch TEXT NOT NULL,
    identity TEXT NOT NULL,
    committee TEXT NOT NULL,
    hoursPerWeek TEXT,
    scoreBreakdown TEXT NOT NULL DEFAULT '{}',
    receivedAt TEXT NOT NULL
  );

  -- Speeds up countToday() and "newest first" ordering as the table grows.
  CREATE INDEX IF NOT EXISTS idx_results_receivedAt ON results (receivedAt);
`);

// Prepared statements are compiled once and reused — faster and safer
// than building a new SQL string for every request (this is also what
// prevents SQL injection: values are always bound as parameters, never
// concatenated into the query text).
const insertStmt = db.prepare(`
  INSERT INTO results (id, name, branch, identity, committee, hoursPerWeek, scoreBreakdown, receivedAt)
  VALUES (@id, @name, @branch, @identity, @committee, @hoursPerWeek, @scoreBreakdown, @receivedAt)
`);
const getAllStmt = db.prepare(`SELECT * FROM results ORDER BY receivedAt DESC`);
const countStmt = db.prepare(`SELECT COUNT(*) AS c FROM results`);
const countTodayStmt = db.prepare(`SELECT COUNT(*) AS c FROM results WHERE substr(receivedAt, 1, 10) = ?`);
const deleteStmt = db.prepare(`DELETE FROM results WHERE id = ?`);

// scoreBreakdown is stored as a JSON string in one column (SQLite has
// no native "object" column type). This helper converts a raw row
// back into the same shape the rest of the app already expects.
function rowToRecord(row) {
  let scoreBreakdown = {};
  try {
    scoreBreakdown = JSON.parse(row.scoreBreakdown || "{}");
  } catch {
    scoreBreakdown = {};
  }
  return { ...row, scoreBreakdown };
}

/**
 * Insert a new result record. Returns the saved record (with its
 * generated id and server timestamp attached) — same contract as before.
 */
async function insert(record) {
  const row = {
    id: crypto.randomUUID(),
    name: record.name,
    branch: record.branch,
    identity: record.identity,
    committee: record.committee,
    hoursPerWeek: record.hoursPerWeek ?? null,
    scoreBreakdown: JSON.stringify(record.scoreBreakdown || {}),
    receivedAt: new Date().toISOString(),
  };
  insertStmt.run(row);
  return rowToRecord(row);
}

/** Return every stored record, newest first. */
function getAll() {
  return getAllStmt.all().map(rowToRecord);
}

/** Total number of stored records. */
function count() {
  return countStmt.get().c;
}

/** Number of records received on the current UTC calendar day. */
function countToday() {
  const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return countTodayStmt.get(todayKey).c;
}

/** Delete a record by id. Returns true if something was actually removed. */
async function deleteById(id) {
  const info = deleteStmt.run(id);
  return info.changes > 0;
}

module.exports = { insert, getAll, count, countToday, deleteById };
