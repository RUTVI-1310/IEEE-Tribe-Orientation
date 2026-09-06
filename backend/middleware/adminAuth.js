/**
 * adminAuth.js
 * ---------------------------------------------------------------
 * Protects admin-only endpoints (viewing results, exporting CSV,
 * deleting entries) with a shared secret key set in your .env file
 * (ADMIN_KEY). The dashboard sends it as an "x-admin-key" header.
 *
 * This is intentionally simple (one shared password, not per-user
 * logins) because it matches the scale of this project — a small
 * committee team checking quiz results. If you ever need multiple
 * admin accounts with different permissions, replace this with
 * real authentication (e.g. sessions + a users table).
 * ---------------------------------------------------------------
 */

const crypto = require("crypto");

const DEFAULT_PLACEHOLDER = "change-this-to-a-long-random-secret";

function isKeyConfigured(realKey) {
  return Boolean(realKey) && realKey !== DEFAULT_PLACEHOLDER;
}

// If ADMIN_KEY is missing or still the placeholder, refuse to serve
// admin traffic at all instead of just warning — a warning is easy to
// miss in logs, and an "unprotected admin dashboard" bug is much worse
// than a loud startup failure. In development this still lets you run
// the rest of the app; admin routes just respond 503 until you set a
// real key. Set NODE_ENV=production to make this a hard boot failure
// instead (see server.js).
function adminAuth(req, res, next) {
  const providedKey = req.header("x-admin-key");
  const realKey = process.env.ADMIN_KEY;

  if (!isKeyConfigured(realKey)) {
    console.error(
      "[adminAuth] ADMIN_KEY is not set (or still the default placeholder) in your .env file. " +
        "Refusing admin request until a real secret is configured."
    );
    return res.status(503).json({
      error: "Admin access is not configured on this server yet.",
    });
  }

  // Plain !== on secrets leaks tiny timing differences an attacker
  // could in theory use to guess the key one byte at a time. Buffers
  // of different lengths can't be compared this way, so the length
  // check happens first (leaking only overall length, not content).
  const providedBuf = Buffer.from(String(providedKey || ""), "utf8");
  const realBuf = Buffer.from(realKey, "utf8");
  const matches =
    providedBuf.length === realBuf.length && crypto.timingSafeEqual(providedBuf, realBuf);

  if (!matches) {
    return res.status(401).json({ error: "Unauthorized. Missing or incorrect admin key." });
  }

  next();
}

module.exports = adminAuth;
module.exports.isKeyConfigured = isKeyConfigured;
module.exports.DEFAULT_PLACEHOLDER = DEFAULT_PLACEHOLDER;
