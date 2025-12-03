import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";
import { sendOTPPhone } from "../utils/phoneService.js";
import { sendCredentialsEmail } from "../utils/emailService.js";
import { generateAuthToken } from "../utils/genAuthToken.js";

/* Helper: Format DOB */
const formatDateDDMMYYYY = (d) => {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* ---------------- SEND OTP ---------------- */
export const SendOTP = async (req, res, next) => {
  try {
    const { fullName, phoneNo, email } = req.body;

    if (!fullName || !phoneNo)
      return res.status(400).json({ message: "Full name & phone required" });

    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ phoneNo: phoneNo }, { mail_ID: email }],
      },
    });

    if (existing)
      return res.status(400).json({
        message: "User already exists with phone/email",
      });

    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.deleteMany({
      where: { otpfor: phoneNo, type: "phone" },
    });

    await sendOTPPhone(phoneNo, phoneOTP);

    const hashed = await bcrypt.hash(phoneOTP, 10);

    await prisma.otp.create({
      data: {
        otpfor: phoneNo,
        otp: hashed,
        type: "phone",
      },
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};

/* ---------------- REGISTER ---------------- */
export const Register = async (req, res, next) => {
  try {
    const { fullName, phoneNo, phoneOTP, college, branch, year, dob, email } =
      req.body;

    if (!fullName || !phoneNo || !phoneOTP || !college || !branch || !year || !dob || !email)
      return res.status(400).json({ message: "All fields required" });

    // verify OTP
    const otpEntry = await prisma.otp.findFirst({
      where: { otpfor: phoneNo, type: "phone" },
    });

    if (!otpEntry)
      return res.status(400).json({ message: "Phone OTP expired" });

    const validOtp = await bcrypt.compare(phoneOTP.toString(), otpEntry.otp);

    if (!validOtp)
      return res.status(400).json({ message: "Invalid OTP" });

    // check duplicate email/phone
    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ mail_ID: email }, { phoneNo }],
      },
    });

    if (existing)
      return res.status(400).json({
        message: "User already exists",
      });

    /* AUTO-GENERATED student_ID */
    const allStudents = await prisma.student.findMany({
      select: { student_ID: true },
    });

    const used = new Set();
    allStudents.forEach((s) => {
      const match = s.student_ID?.match(/(\d{4})$/);
      if (match) used.add(parseInt(match[1]));
    });

    let nextNumber = 1;
    while (used.has(nextNumber)) nextNumber++;

    const student_ID = `RICR-RS-${String(nextNumber).padStart(4, "0")}`;

    /* Create Student */
    const newStudent = await prisma.student.create({
      data: {
        student_ID,
        fullName,
        phoneNo,
        mail_ID: email,
        college,
        branch,
        year,
        dob: new Date(dob),
      },
    });

    await prisma.otp.deleteMany({ where: { otpfor: phoneNo, type: "phone" } });

    const creds = {
      name: newStudent.fullName,
      student_ID: newStudent.student_ID,
      dob: formatDateDDMMYYYY(newStudent.dob),
    };

    await sendCredentialsEmail(email, creds);

    res.status(201).json({
      message: "Registration successful",
      student: newStudent,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- SEND CREDENTIALS ---------------- */
export const SendCredentials = async (req, res, next) => {
  try {
    const { mail_ID, student_ID } = req.body;

    const student = await prisma.student.findFirst({
      where: { mail_ID, student_ID },
    });

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    const creds = {
      name: student.fullName,
      student_ID,
      dob: formatDateDDMMYYYY(student.dob),
    };

    await sendCredentialsEmail(mail_ID, creds);

    res.json({ message: "Credentials sent to email" });
  } catch (err) {
    next(err);
  }
};

/* ---------------- LOGIN ---------------- */
export const Login = async (req, res, next) => {
  try {
    const { student_ID, dob } = req.body;

    const student = await prisma.student.findFirst({ where: { student_ID } });

    if (!student)
      return res.status(401).json({ message: "Invalid credentials" });

    const inputDate = new Date(dob).setHours(0, 0, 0, 0);
    const storedDate = new Date(student.dob).setHours(0, 0, 0, 0);

    if (inputDate !== storedDate)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateAuthToken(student, null, res);

    res.json({ message: "Login successful", student, token });
  } catch (err) {
    next(err);
  }
};

/* ---------------- PROFILE ---------------- */
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // Ensure `req.user` is populated by middleware
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const student = await prisma.student.findUnique({
      where: { id: userId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};