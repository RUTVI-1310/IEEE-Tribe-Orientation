require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const resultsRouter = require("../../../../Downloads/IEEE-Tribe-Orientation-sqlite/backend/routes/results");

const app = express();
const PORT = process.env.PORT || 3000;

/* -----------------------------------------------------------
   Startup safety checks
----------------------------------------------------------- */

// Refuse to boot in production with the default/placeholder admin key —
// better to fail loudly at startup than silently ship an unprotected
// admin dashboard. Locally (NODE_ENV !== "production") this only warns,
// so beginners can still run the server before setting up a real .env.
const adminKey = process.env.ADMIN_KEY;
const isDefaultAdminKey = !adminKey || adminKey === "change-this-to-a-long-random-secret";
if (isDefaultAdminKey) {
  const msg =
    "[startup] ADMIN_KEY is not set (or is still the default placeholder). " +
    "Set a long random ADMIN_KEY in your .env before deploying.";
  if (process.env.NODE_ENV === "production") {
    console.error(msg + " Refusing to start in production.");
    process.exit(1);
  } else {
    console.warn(msg + " Admin endpoints are unprotected until you fix this.");
  }
}

/* -----------------------------------------------------------
   Security & basics
----------------------------------------------------------- */

// When deployed behind a reverse proxy (Render, Railway, Vercel, Nginx,
// etc.), Express sees the proxy's IP on every request unless told to
// trust the proxy's X-Forwarded-For header. Without this, express-rate-limit
// (and any other IP-based logic) effectively rate-limits the proxy, not
// individual users — so a single bad actor's requests count against
// everyone's shared limit, and the per-IP submit limiter stops working.
// "1" trusts exactly one hop, which matches typical single-proxy PaaS setups.
app.set("trust proxy", 1);

// Sets a bunch of sane security-related HTTP headers automatically.
// contentSecurityPolicy is turned off here only because the admin
// dashboard below loads no external scripts and this keeps setup
// simple for a beginner — if you add external scripts to public/,
// configure a real CSP instead of disabling it.
app.use(helmet({ contentSecurityPolicy: false }));

// CORS: only allow the origins you list in ALLOWED_ORIGINS (.env).
// "*" is fine for local testing but should be replaced with your
// real frontend URL(s) before going live.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Requests with no origin (curl, mobile apps, server-to-server) are allowed.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
  })
);

app.use(express.json({ limit: "100kb" })); // small limit — this API only ever receives short quiz payloads
app.use(morgan("combined"));

// A general safety-net rate limit across the whole API, on top of the
// stricter one applied specifically to the /submit endpoint.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* -----------------------------------------------------------
   Routes
----------------------------------------------------------- */

app.get("/", (req, res) => {
  res.json({
    service: "IEEE VGEC Tribe Quiz — Backend API",
    status: "running",
    endpoints: {
      "POST /api/results/submit": "Save a completed quiz result (public)",
      "GET /api/results/stats": "Public live counter stats",
      "GET /api/results": "List all results (admin — requires x-admin-key header)",
      "GET /api/results/export.csv": "Download all results as CSV (admin)",
      "DELETE /api/results/:id": "Delete one result (admin)",
      "GET /admin": "Simple browser dashboard for viewing/exporting results",
    },
  });
});

app.use("/api/results", resultsRouter);

// Simple static admin dashboard (public/admin.html). It's plain HTML/JS
// that asks for your admin key in the browser and calls the endpoints
// above — nothing sensitive is baked into the file itself.
// Visiting /admin or /admin/ directly serves admin.html, so you don't
// have to type the filename — everything else in public/ is still
// served normally by the static middleware below.
app.get(["/admin", "/admin/"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.use("/admin", express.static(path.join(__dirname, "public")));

// 404 handler for anything else.
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Centralized error handler — catches anything thrown/rejected in routes
// (including the CORS rejection above) so the server never crashes on
// a single bad request.
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

/* -----------------------------------------------------------
   Start
----------------------------------------------------------- */

const server = app.listen(PORT, () => {
  console.log(`IEEE Tribe backend running on http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
});

// Graceful shutdown so in-flight writes to results.json get a chance to finish.
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully.");
  server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("SIGINT received — shutting down gracefully.");
  server.close(() => process.exit(0));
});

module.exports = app;