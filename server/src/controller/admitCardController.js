import QRCode from "qrcode";
import PDFDocument from "pdfkit";
// controllers/admitCardController.js
import AdmitCard from "../models/admitCardmodel.js";
import path from "path";
import fs from "fs";
import { createPresentToken, verifyPresentToken } from "../utils/genAuthToken.js";


export const getAdmitCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let admitCard = null;

    // Check if id is a valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      admitCard = await AdmitCard.findById(id).populate("studentId", "fullName email");
    } else {
      // Otherwise, search by RSAT (student_ID)
      admitCard = await AdmitCard.findOne({ RSAT: id }).populate("studentId", "fullName email");
    }

    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json(admitCard);
  } catch (err) {
    next(err);
  }
};

export const generatePresentToken = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing id" });

    const admit = await AdmitCard.findById(id);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    // create short-lived token (server-side secret)
    const token = createPresentToken(id);

    // Optionally store token audit or return directly
    return res.json({ ok: true, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const markAttendanceWithToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    let payload;
    try {
      payload = verifyPresentToken(token); // will throw if invalid/expired
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const id = payload.admitCardId;
    const admit = await AdmitCard.findById(id);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    if (admit.present) {
      return res.json({ ok: true, alreadyPresent: true, message: "Attendance already marked" });
    }

    admit.present = true;
    admit.attendanceAt = new Date();
    await admit.save();

    return res.json({ ok: true, message: "Attendance marked successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const scanAttendance = async (req, res) => {
  try {
    const id = req.params.id;
    const token = req.query.token;
    if (!id) return res.status(400).json({ message: "Missing admitCardId" });

    // Restrict attendance marking to official scanner
    const isOfficialScanner = req.headers["x-official-scanner"] === "true";
    if (!isOfficialScanner) {
      return res.status(403).json({ message: "Attendance can only be marked using the official scanner." });
    }
    // Token must be present and valid (simple check, can be improved)
    if (!token || token.length < 8) {
      return res.status(403).json({ message: "Invalid or missing scan token." });
    }

    const admit = await AdmitCard.findById(id);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    if (admit.present) return res.json({ message: "Attendance already marked" });

    admit.present = true;
    admit.attendanceAt = new Date();
    await admit.save();

    return res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error marking attendance" });
  }
};


export const downloadAdmitCard = async (req, res) => {
  try {
    const { id } = req.params;

    let admit = null;

    // ObjectId or RSAT both allowed
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      admit = await AdmitCard.findById(id);
    } else {
      admit = await AdmitCard.findOne({ RSAT: id });
    }

    if (!admit) {
      console.error(`[DOWNLOAD ADMIT CARD] Admit card not found for id: ${id}`);
      return res.status(404).json({ message: `Admit card not found for id: ${id}` });
    }

    // UPDATE DOWNLOAD COUNT & DATE
    admit.downloadCount = (admit.downloadCount || 0) + 1;
    admit.downloadedAt = new Date();
    await admit.save();

    // ADMIT CARD FILE PATH (Adjust this based on your folder)
    const filePath = path.resolve(`uploads/admitCards/${admit.RSAT}.pdf`);

    if (!fs.existsSync(filePath)) {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      // Auto-generate a styled admit card PDF if missing
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Logo
        const logoPath = path.resolve(__dirname, '../../client/src/assets/admitcardheader.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 40, 30, { width: 100 });
        }

        // Title
        doc.fontSize(16).font('Helvetica-Bold').text('Scholarship Admission Test', 0, 40, { align: 'center' });
        doc.fontSize(12).font('Helvetica-Bold').text('ADMIT CARD', { align: 'center' });

        // QR Code
        const qrData = `https://rsat.ricr.in/api/admit-cards/scan-attendance/${admit._id}?token=${Math.random().toString(36).substring(2, 12)}`;
        const qrImageBuffer = await QRCode.toBuffer(qrData, { width: 100 });
        doc.image(qrImageBuffer, 450, 30, { width: 80 });

        // Horizontal line
        doc.moveTo(40, 120).lineTo(520, 120).strokeColor('#d1d5db').stroke();

        // Grid layout for details with borders
        doc.moveDown(1);
        const details = [
          ["Applicant", admit.ApplicantName || admit.fullName || admit.name || "-"],
          ["R-SAT ID", admit.RSAT || "-"],
          ["Contact", admit.contact || "-"],
          ["College", admit.college || "-"],
          ["Branch", admit.branch || "-"],
          ["Year", admit.year || "-"],
          ["Venue", admit.venue || admit.center || "-"],
          ["Exam Date", admit.examDate ? new Date(admit.examDate).toLocaleDateString() : "-"],
          ["Exam Time", admit.examTime || "-"],
          ["Reporting Time", admit.ReportingTime || "-"],
        ];
        let y = 130;
        for (let i = 0; i < details.length; i += 2) {
          // Draw rectangles with light border
          doc.save().lineWidth(1).strokeColor('#e5e7eb').rect(40, y, 240, 40).stroke().restore();
          doc.save().lineWidth(1).strokeColor('#e5e7eb').rect(280, y, 240, 40).stroke().restore();
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text(details[i][0], 45, y + 8);
          doc.fontSize(11).font('Helvetica').fillColor('#111827').text(details[i][1], 45, y + 22);
          if (details[i + 1]) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text(details[i + 1][0], 285, y + 8);
            doc.fontSize(11).font('Helvetica').fillColor('#111827').text(details[i + 1][1], 285, y + 22);
          }
          y += 45;
        }

        // Download button (visual only)
        doc.save().roundedRect(40, y + 10, 180, 30, 6).fillAndStroke('#2563eb', '#2563eb').restore();
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold').text('Download Admit Card', 40, y + 18, { width: 180, align: 'center' });
        doc.fillColor('#2563eb').fontSize(10).text('Contact Support', 230, y + 22, { width: 100, align: 'left' });
        doc.fillColor('black');

        // Horizontal line before instructions
        doc.moveTo(40, y + 50).lineTo(520, y + 50).strokeColor('#d1d5db').stroke();

        // Instructions
        doc.fontSize(12).font('Helvetica-Bold').text('Instructions for Exam', 40, y + 60);
        const instructions = [
          "Admit card must be in hard copy format. Digital copies will not be accepted.",
          "Carry a valid photo ID proof with this Admit Card.",
          "The exam will be conducted offline using an OMR sheet. Ensure to carry a blue or black ballpoint pen for marking answers.",
          "Electronic devices like mobile phones, smartwatches, or calculators are strictly prohibited in the examination hall.",
          "OMR sheets should be handled carefully and not folded or damaged.",
          "Follow all instructions provided by the invigilators during the exam.",
          "Rough work can be done on the pages provided at the venue.",
        ];
        let iy = y + 80;
        doc.fontSize(10).font('Helvetica').fillColor('#111827');
        instructions.forEach((inst, idx) => {
          doc.text(`• ${inst}`, 45, iy + idx * 16, { width: 470 });
        });

        // Contact info
        doc.fontSize(9).fillColor('#2563eb').text('For any queries, contact us at contact@ricr.in or call +918889991736 / +919907096014', 40, iy + instructions.length * 16 + 20, { align: 'center', width: 480 });
        doc.fillColor('black');

        doc.end();
        await new Promise((resolve, reject) => {
          stream.on('finish', resolve);
          stream.on('error', reject);
        });
      } catch (pdfErr) {
        console.error(`[DOWNLOAD ADMIT CARD] PDF generation failed:`, pdfErr);
        return res.status(500).json({ message: "Failed to auto-generate admit card PDF." });
      }
    }

    // Set proper headers → so browser downloads the file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${admit.RSAT}.pdf"`);

    // Stream file to user
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    console.error("Download Error:", err);
    return res.status(500).json({ message: "Server error while downloading admit card" });
  }
};
