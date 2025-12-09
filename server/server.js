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
  "https://rsat.ricr.in"
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ 
    message, 
    error: process.env.NODE_ENV === "development" ? err : {} 
  });
});

const PORT = process.env.PORT || 4500;

(async () => {
  try {
    await connectDB(); // connect to SQL Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB connect fail:", err.message || err);
    process.exit(1);
  }
})();
