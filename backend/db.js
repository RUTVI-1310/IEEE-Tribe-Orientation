/**
 * db.js
 * ---------------------------------------------------------------
 * A tiny, dependency-free JSON-file "database".
 *
 * Why not a real database? For a student-branch quiz collecting a
 * few hundred/thousand responses, a real DB is overkill and adds
 * setup friction for a beginner. This module gives you the same
 * safety guarantees that matter (no corrupted files, no lost writes
 * under concurrent requests) using nothing but Node's built-in `fs`.
 *
 * If this project ever needs to scale to many concurrent writers or
 * complex queries, swap this file out for a real database (Postgres,
 * MongoDB, etc.) — every route in routes/results.js only talks to
 * the small API defined below (getAll, insert, deleteById, count),
 * so that swap wouldn't require touching route logic much.
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "results.json");
const TMP_FILE = path.join(DATA_DIR, "results.json.tmp");

// Make sure the data directory + file exist before anything else runs.
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}
ensureStore();

// In-memory cache of the array on disk. Loaded once at startup, kept
// in sync on every write. Reads never touch the disk, so they're fast.
let cache = loadFromDisk();

function loadFromDisk() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[db] Failed to read/parse results.json — starting empty.", err);
    return [];
  }
}

// Writes are queued one-after-another (rather than fired in parallel)
// so two near-simultaneous submissions can never race and corrupt the
// file. Each write goes to a temp file first, then atomically renames
// over the real file — so a crash mid-write never leaves a half-written,
// unreadable JSON file behind.
let writeQueue = Promise.resolve();

function persistToDisk() {
  writeQueue = writeQueue.then(
    () =>
      new Promise((resolve, reject) => {
        fs.writeFile(TMP_FILE, JSON.stringify(cache, null, 2), "utf8", (err) => {
          if (err) return reject(err);
          fs.rename(TMP_FILE, DATA_FILE, (err2) => {
            if (err2) return reject(err2);
            resolve();
          });
        });
      })
  );
  writeQueue.catch((err) => console.error("[db] Failed to persist results.json:", err));
  return writeQueue;
}

/**
 * Insert a new result record. Returns the saved record (with its
 * generated id, server timestamp, and submitter IP attached).
 */
async function insert(record) {
  const saved = {
    id: crypto.randomUUID(),
    ...record,
    receivedAt: new Date().toISOString(),
  };
  cache.push(saved);
  await persistToDisk();
  return saved;
}

/** Return every stored record, newest first. */
function getAll() {
  return [...cache].reverse();
}

/** Total number of stored records. */
function count() {
  return cache.length;
}

/** Number of records received on the current UTC calendar day. */
function countToday() {
  const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return cache.filter((r) => (r.receivedAt || "").slice(0, 10) === todayKey).length;
}

/** Delete a record by id. Returns true if something was actually removed. */
async function deleteById(id) {
  const before = cache.length;
  cache = cache.filter((r) => r.id !== id);
  const removed = cache.length !== before;
  if (removed) await persistToDisk();
  return removed;
}

module.exports = { insert, getAll, count, countToday, deleteById };
