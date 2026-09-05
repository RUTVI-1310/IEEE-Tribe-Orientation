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

function adminAuth(req, res, next) {
  const providedKey = req.header("x-admin-key");
  const realKey = process.env.ADMIN_KEY;

  if (!realKey || realKey === "change-this-to-a-long-random-secret") {
    console.warn(
      "[adminAuth] WARNING: ADMIN_KEY is not set (or still the default placeholder) in your .env file. " +
        "Admin endpoints are effectively unprotected until you set a real secret."
    );
  }

  if (!providedKey || providedKey !== realKey) {
    return res.status(401).json({ error: "Unauthorized. Missing or incorrect admin key." });
  }

  next();
}

module.exports = adminAuth;
