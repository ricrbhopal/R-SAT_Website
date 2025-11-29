// src/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error(
        'MongoDB connection string is missing. Set `MONGO_URI` in your .env file.'
      );
    }
    const conn = await mongoose.connect(uri);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;

// Ensure the database connection is properly configured to support the new admin login functionality.
