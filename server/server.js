// server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js"; // this is your MSSQL connector
import Admin from "./src/routers/adminRouter.js"; // keep your routers
import Student from "./src/routers/StudentRouter.js";
import AdmitCards from "./src/routers/admitRouter.js";

const app = express();

// CORS configuration - allow both local dev and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rsat.ricr.in",
];

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Warn but allow for debugging
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (req, res) => res.send("Server running..."));

// test-sql route (example)
app.get("/test-sql", async (req, res) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT TOP 5 * FROM dbo.Users");
    res.json({ ok: true, rows: result.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Routes
app.use("/admin", Admin);
app.use("/student", Student);
app.use("/admit-cards", AdmitCards);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", port: PORT, timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ 
    message, 
    error: process.env.NODE_ENV === "development" ? err.stack : {} 
  });
});

const PORT = process.env.PORT || 4500;

(async () => {
  try {
    console.log("🔧 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err.message || err);
    console.error(err.stack);
    process.exit(1);
  }
})();
