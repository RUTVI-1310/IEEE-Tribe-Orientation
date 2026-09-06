/**
 * validate.js
 * ---------------------------------------------------------------
 * Anyone on the internet can send a POST request straight to your
 * API, not just people using your quiz's frontend. This module
 * makes sure whatever lands in the database is well-formed, so a
 * malformed or malicious request can't corrupt your data or crash
 * the server.
 * ---------------------------------------------------------------
 */

// Must match the six committee identities defined in script.js (IDENTITIES).
const VALID_COMMITTEES = [
  "Design Committee",
  "Drafting Committee",
  "Media Committee",
  "Program Committee",
  "Tech Committee",
  "Publicity Committee",
];

const VALID_SCORE_KEYS = ["design", "drafting", "media", "program", "tech", "publicity"];

function isNonEmptyString(value, maxLen) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLen;
}

// Strip anything that looks like HTML/script tags before we ever store
// or display a value. This is "belt and suspenders" — the admin
// dashboard also escapes output — but sanitizing at the door is cheap
// insurance against stored-XSS if that page is ever changed later.
function sanitizeString(value) {
  return value.trim().replace(/[<>]/g, "").slice(0, 200);
}

/**
 * Validates a quiz-result submission payload.
 * Returns { valid: true, data } on success or { valid: false, error } on failure.
 */
function validateSubmission(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  const { name, branch, identity, committee, scoreBreakdown, hoursPerWeek } = body;

  if (!isNonEmptyString(name, 80)) {
    return { valid: false, error: "'name' is required and must be under 80 characters." };
  }
  if (!isNonEmptyString(branch, 80)) {
    return { valid: false, error: "'branch' is required and must be under 80 characters." };
  }
  if (!isNonEmptyString(identity, 80)) {
    return { valid: false, error: "'identity' is required." };
  }
  if (!isNonEmptyString(committee, 80) || !VALID_COMMITTEES.includes(committee.trim())) {
    return { valid: false, error: "'committee' must be one of: " + VALID_COMMITTEES.join(", ") };
  }

  // scoreBreakdown is optional context, but if present it must be a
  // plain object with numeric values under the expected keys only.
  let cleanScores = {};
  if (scoreBreakdown !== undefined && scoreBreakdown !== null) {
    if (typeof scoreBreakdown !== "object" || Array.isArray(scoreBreakdown)) {
      return { valid: false, error: "'scoreBreakdown' must be an object." };
    }
    for (const key of Object.keys(scoreBreakdown)) {
      if (!VALID_SCORE_KEYS.includes(key)) continue; // silently drop unknown keys
      const val = Number(scoreBreakdown[key]);
      cleanScores[key] = Number.isFinite(val) ? val : 0;
    }
  }

  // hoursPerWeek is free-text but optional and capped in length.
  let cleanHours = null;
  if (hoursPerWeek !== undefined && hoursPerWeek !== null && hoursPerWeek !== "") {
    if (!isNonEmptyString(String(hoursPerWeek), 40)) {
      return { valid: false, error: "'hoursPerWeek' is too long." };
    }
    cleanHours = sanitizeString(String(hoursPerWeek));
  }

  return {
    valid: true,
    data: {
      name: sanitizeString(name),
      branch: sanitizeString(branch),
      identity: sanitizeString(identity),
      committee: committee.trim(),
      scoreBreakdown: cleanScores,
      hoursPerWeek: cleanHours,
    },
  };
}

module.exports = { validateSubmission, sanitizeString, VALID_COMMITTEES };
