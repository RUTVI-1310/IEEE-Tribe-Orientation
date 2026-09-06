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

// Constant-time string comparison so an attacker can't guess the
// admin key one byte at a time by measuring response times. Falls
// back to a safe "not equal" for mismatched lengths instead of
// throwing (timingSafeEqual requires equal-length buffers).
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still do a comparison of equal length so this branch takes
    // roughly similar time either way, rather than returning instantly.
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function adminAuth(req, res, next) {
  const providedKey = req.header("x-admin-key");
  const realKey = process.env.ADMIN_KEY;

  if (!realKey || realKey === "change-this-to-a-long-random-secret") {
    console.warn(
      "[adminAuth] WARNING: ADMIN_KEY is not set (or still the default placeholder) in your .env file. " +
        "Admin endpoints are effectively unprotected until you set a real secret."
    );
  }

  if (!providedKey || !realKey || !safeEqual(providedKey, realKey)) {
    return res.status(401).json({ error: "Unauthorized. Missing or incorrect admin key." });
  }

  next();
}

module.exports = adminAuth;
