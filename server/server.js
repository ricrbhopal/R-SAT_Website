import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Auth from "./src/routers/authRouter.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running successfully 🚀");
});

// Use Auth router
app.use("/auth", Auth);

// Port setup
const PORT = process.env.PORT || 5000;

// Connect to MongoDB if MONGO_URI provided
const startServer = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        // useNewUrlParser/useUnifiedTopology not needed in Mongoose 6+
      });
      console.log('MongoDB connected');
    } else {
      console.warn('MONGO_URI not set — server will run but DB operations may fail');
    }

    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
