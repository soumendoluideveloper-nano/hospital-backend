/**
 * =======================================================
 * API GATEWAY  –  Clinic Management System
 * =======================================================
 * Runs on PORT 3000 and proxies all requests to the
 * individual microservices.
 *
 * Route Prefix Map:
 *  /api/auth/*     → auth-service     :4000
 *  /api/clinic/*   → clinic-service   :4001
 *  /api/patient/*  → patient-service  :4002
 *  /api/lab/*      → lab-service      :4003
 *  /api/admin/*    → admin-service    :4004
 *
 * NOTE: We use `pathFilter` (NOT `app.use("/prefix", proxy)`) so
 * Express does NOT strip the prefix before proxying. The full path
 * is forwarded to each microservice unchanged.
 * =======================================================
 */

require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const path = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// CORS
// --------------------------------------------------
app.use(cors({ origin: "*", credentials: true }));

// --------------------------------------------------
// Static uploads (shared across all services)
// Accessible at: GET /uploads/<folder>/<filename>
// --------------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


// --------------------------------------------------
// Health check
// --------------------------------------------------
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "API Gateway", port: PORT })
);

// --------------------------------------------------
// AUTH SERVICE  (register / login for all roles)
// --------------------------------------------------
app.use(
  createProxyMiddleware({
    pathFilter:  "/api/auth",
    target:      `http://localhost:${process.env.AUTH_SERVICE_PORT || 4000}`,
    changeOrigin: true
  })
);

// --------------------------------------------------
// CLINIC SERVICE  (clinics, doctors, schedule,
//                  enquiries, call-logs, reviews)
// --------------------------------------------------
app.use(
  createProxyMiddleware({
    pathFilter:  "/api/clinic",
    target:      `http://localhost:${process.env.CLINIC_SERVICE_PORT || 4001}`,
    changeOrigin: true
  })
);

// --------------------------------------------------
// PATIENT SERVICE  (patient profile, appointments,
//                   reviews, notifications)
// --------------------------------------------------
app.use(
  createProxyMiddleware({
    pathFilter:  "/api/patient",
    target:      `http://localhost:${process.env.PATIENT_SERVICE_PORT || 4002}`,
    changeOrigin: true
  })
);

// --------------------------------------------------
// LAB SERVICE  (lab tests, bookings, reports)
// --------------------------------------------------
app.use(
  createProxyMiddleware({
    pathFilter:  "/api/lab",
    target:      `http://localhost:${process.env.LAB_SERVICE_PORT || 4003}`,
    changeOrigin: true
  })
);

// --------------------------------------------------
// ADMIN SERVICE  (super-admin, banners, notifications)
// --------------------------------------------------
app.use(
  createProxyMiddleware({
    pathFilter:  "/api/admin",
    target:      `http://localhost:${process.env.ADMIN_SERVICE_PORT || 4004}`,
    changeOrigin: true
  })
);

// --------------------------------------------------
// Start Gateway
// --------------------------------------------------
app.listen(PORT, () =>
  console.log(`\n🚀  API Gateway running on http://localhost:${PORT}\n`)
);
