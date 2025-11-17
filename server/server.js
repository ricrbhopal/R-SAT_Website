import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ConnectDB from "./src/config/db.js";
import Auth from "./src/routers/authRouter.js";
// import Demo from "./src/routers/soltRouter.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://ricr.in/rsat'
    ],
    credentials: true
}));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running successfully 🚀");
});

// Use Auth router
app.use("/auth", Auth);
// Use Demo router
// app.use("/solt", Demo);

// Port setup
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    ConnectDB();
});