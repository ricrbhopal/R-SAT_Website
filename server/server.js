import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import ConnectDB from "./src/config/db.js";
import Auth from "./src/routers/authRouter.js";
import Demo from "./src/routers/soltRouter.js";
import Support from "./src/routers/supportRouter.js";
import referralRoutes from "./src/routers/refferedRouter.js";
import Admin from "./src/routers/adminRouter.js";
import AdmitCard from "./src/routers/admitRouter.js";

dotenv.config();
const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://rsat.ricr.in/api"],
    credentials: true,
  })
);
app.use(express.json());
// parse cookies so `req.cookies` is available to auth middleware
app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running successfully 🚀");
});

// Use Auth router
app.use("/auth", Auth);
// Use Demo router
app.use("/slot", Demo);
// Use Support router
app.use("/support", Support);
// Use Reffered router
app.use("/referrals", referralRoutes);
// Use Admin router
app.use("/admin", Admin);
// Use Admit Card router
app.use("/admit-cards", AdmitCard);

// Centralized error handler (should be last middleware)
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message, status });
});

// Port setup
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  ConnectDB();
});
