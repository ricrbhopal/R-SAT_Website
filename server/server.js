// server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js"; // this is your MSSQL connector
import Admin from "./src/routers/adminRouter.js"; // keep your routers
import Student from "./src/routers/studentRouter.js";

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
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
