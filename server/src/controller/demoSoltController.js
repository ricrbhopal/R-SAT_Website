import Demo from "../models/demoModel.js"; 
import bcrypt from 'bcryptjs';
import { sendConfirmationEmail } from "../utils/emailService.js";

// Book demo slot after verifying both OTPs
export const BookDemoSlot = async (req, res, next) => {
  try {
    const { studentName, email, phone, collegeName, year, demoSlot, type } = req.body;
    if (!studentName || !email || !phone || !type || !collegeName || !year || !demoSlot) {
      const error = new Error('All fields are required for booking demo slot');
      error.statusCode = 400;
      return next(error);
    }

    await Demo.create({
      studentName,
      email,
      phone,
      collegeName,
      year,
      demoSlot,
      type,
    }); 

    // Send confirmation email
    await sendConfirmationEmail({
      to: email,
      subject: 'Demo Slot Booking Confirmation',
      studentName,
      demoSlot,
      type,
      collegeName,
      year,
    });

    res.status(200).json({ message: 'Demo slot booked successfully' });
  } catch (error) {
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

