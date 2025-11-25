import Demo from "../models/demoModel.js"; 
import bcrypt from 'bcryptjs';
import { sendConfirmationEmail } from "../utils/emailService.js";

// Book demo slot after verifying both OTPs
export const BookDemoSlot = async (req, res, next) => {
  try {
    const { studentName, email, phone, collegeName, year, demoSlot, type } = req.body;

    // Basic validation
    if (!studentName || !email || !phone || !collegeName || !year || !demoSlot || !type) {
      return res.status(400).json({ message: "All fields are required for booking demo slot" });
    }

    // Create booking (no unique checks - allows multiple bookings for same email)
    const booking = await Demo.create({
      studentName,
      email,
      phone,
      collegeName,
      year,
      demoSlot,
      type,
    });

    // Try to send confirmation email but don't fail the request if email fails
    try {
      await sendConfirmationEmail({
        to: email,
        subject: "Demo Slot Booking Confirmation",
        studentName,
        demoSlot,
        type,
        collegeName,
        year,
      });
    } catch (emailErr) {
      // optional: log the error for debugging, but keep response successful
      console.error("Confirmation email failed:", emailErr);
    }

    return res.status(201).json({
      message: "Demo slot booked successfully",
      booking, // created booking object
    });
  } catch (error) {
    // If somehow a duplicate index still exists at DB level, you may see 11000.
    // But we won't specially block it here; just pass to error middleware.
    next(error);
  }
};

export const GetDemoSlots = async (req, res, next) => {
  try {
    const demoSlots = await Demo.find({});
    res.status(200).json(demoSlots);
  } catch (error) {
    next(error);
  }
};

