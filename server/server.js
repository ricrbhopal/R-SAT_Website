// server.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./src/config/db.js"; 
import Admin from "./src/routers/adminRouter.js"; 
import Student from "./src/routers/StudentRouter.js";
import AdmitCards from "./src/routers/admitRouter.js";
import { registerSupportSockets } from "./src/realtime/supportSocket.js";
import Manager from "./src/routers/managerRouter.js";
dotenv.config();
const app = express();

// CORS configuration - allow both local dev and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rsat.ricr.in",
];

const PORT = process.env.PORT || 4500;

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


// Routes
app.use("/admin", Admin);
app.use("/student", Student);
app.use("/manager", Manager);
app.use("/admit-cards", AdmitCards);


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


(async () => {
  try {
    console.log("🔧 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");

    const httpServer = http.createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    // Log socket connections and disconnections
    io.on("connection", (socket) => {
      console.log(`[socket] connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        console.log(`[socket] disconnected ${socket.id} - reason: ${reason}`);
      });
    });

    registerSupportSockets(io);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {

    console.error(err.stack);
    process.exit(1);
  }
})();
