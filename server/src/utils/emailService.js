import nodemailer from "nodemailer";
import path from "path";

const sendEmail = async (to, subject, html, attachments = []) => {
  if (!to || (Array.isArray(to) && to.length === 0)) {
    throw new Error("Recipient email address is required and cannot be empty.");
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendOTPEmail = async (to, otp) => {
  const subject = "Your R-SAT OTP Code ";
  const text = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Your R-SAT OTP Code</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #f9f9f9; color: #222; }
                    .container { max-width: 400px; margin: 40px auto; background: #fff; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);}
                    .otp { font-size: 2em; font-weight: bold; color: #2d7ff9; letter-spacing: 4px; margin: 24px 0; }
                    .footer { font-size: 0.9em; color: #888; margin-top: 32px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>R-SAT Verification</h2>
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) is:</p>
                    <div class="otp">${otp}</div>
                    <p>Please enter this code to complete your verification. This code is valid for a limited time and should not be shared with anyone.</p>
                    <div class="footer">
                        If you did not request this, please ignore this email.<br>
                        &copy; ${new Date().getFullYear()} R-SAT
                    </div>
                </div>
            </body>
        </html>
  `;
  return sendEmail(to, subject, text);
};

export const sendCredentialsEmail = async (to, credentials) => {
  const subject = "R-SAT Enrollment Confirmation — RICR";

  // Accept either a credentials string (rsat id) or an object with detailed fields
  let name = "";
  let rsatId = "";
  let testDate = "19th Jan 2026";
  let dob = "";
  let venue =
    "RICR Campus - Minal Mall, 4th Floor, Minal Residency, JK Road, Bhopal (462023)";
  const mapsLink = "https://maps.app.goo.gl/81ntQ3GwTYrRTdT8A";
  const whatsappLink = "https://chat.whatsapp.com/LOyIK8KUHXg6opbiIN6VnF";

  if (credentials && typeof credentials === "object") {
    name = credentials.name || "";
    rsatId =
      credentials.rsatId || credentials.student_ID || credentials.id || "";
    testDate = credentials.testDate || testDate;
    dob = credentials.dob || dob;
    venue = credentials.venue || venue;
  } else {
    rsatId = credentials || "";
  }

  const html = `
   <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R-SAT Enrollment Confirmation</title>
    <style>
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 700px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        
        /* Header section */
        .header {
            background: linear-gradient(135deg, #2d7ff9 0%, #1e56a0 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .logo-icon {
            margin-right: 10px;
            font-size: 32px;
        }
        
        .header h1 {
            font-size: 28px;
            margin: 15px 0 5px;
            font-weight: 600;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        
        /* Content section */
        .content {
            padding: 40px;
        }
        
        .congrats-section {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .congrats-section h2 {
            color: #2d7ff9;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .congrats-section p {
            color: #666;
            font-size: 16px;
        }
        
        /* Card sections */
        .card {
            background: #f8fafc;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            border-left: 4px solid #2d7ff9;
        }
        
        .card h3 {
            color: #1e56a0;
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
        }
        
        .card h3 i {
            margin-right: 10px;
            color: #2d7ff9;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .detail-item {
            margin-bottom: 12px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #555;
            display: block;
            margin-bottom: 5px;
        }
        
        .detail-value {
            color: #333;
        }
        
        .btn {
            display: inline-block;
            background: #2d7ff9;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 3px 6px rgba(45, 127, 249, 0.2);
        }
        
        .btn:hover {
            background: #1e56a0;
            transform: translateY(-2px);
            box-shadow: 0 5px 10px rgba(45, 127, 249, 0.3);
        }
        
        /* List styles */
        .info-list {
            list-style-type: none;
        }
        
        .info-list li {
            margin-bottom: 12px;
            padding-left: 25px;
            position: relative;
        }
        
        .info-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #2d7ff9;
            font-weight: bold;
        }
        
        /* Scholarship table */
        .scholarship-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .scholarship-table th {
            background: #e8f0fe;
            padding: 12px 15px;
            text-align: left;
            color: #1e56a0;
            font-weight: 600;
        }
        
        .scholarship-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eaeaea;
        }
        
        .scholarship-table tr:last-child td {
            border-bottom: none;
        }
        
        /* Contact section */
        .contact-section {
            background: #f0f7ff;
            border-radius: 10px;
            padding: 25px;
            margin-top: 30px;
            text-align: center;
        }
        
        .contact-section h3 {
            color: #1e56a0;
            margin-bottom: 15px;
        }
        
        .contact-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .contact-link {
            display: flex;
            align-items: center;
            color: #2d7ff9;
            text-decoration: none;
            font-weight: 500;
        }
        
        .contact-link i {
            margin-right: 8px;
            font-size: 18px;
        }
        
        /* Footer */
        .footer {
            background: #1e3a5f;
            color: white;
            padding: 25px 40px;
            text-align: center;
        }
        
        .footer p {
            margin-bottom: 10px;
            opacity: 0.8;
        }
        
        .social-links {
            margin-top: 15px;
        }
        
        .social-link {
            display: inline-block;
            color: white;
            margin: 0 10px;
            font-size: 18px;
        }
        
        .copyright {
            margin-top: 20px;
            font-size: 14px;
            opacity: 0.7;
        }
        
        /* Responsive adjustments */
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 25px 20px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
            }
            
            .contact-links {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo">
                <i class="fas fa-graduation-cap logo-icon"></i>
                RICR
            </div>
            <h1>R-SAT Enrollment Confirmed!</h1>
            <p>RICR Scholarship Admission Test</p>
        </div>
        
        <!-- Content Section -->
        <div class="content">
            <!-- Congratulations Section -->
            <div class="congrats-section">
                <h2>Congratulations${name ? " " + name : ""}!</h2>
                <p>You have successfully enrolled for the R-SAT (RICR Scholarship Admission Test).</p>
            </div>
            
            <!-- Your Details Card -->
            <div class="card">
                <h3><i class="fas fa-user-circle"></i> Your Details</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">RSAT ID</span>
                        <div class="detail-value">${rsatId}</div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Test Date</span>
                        <div class="detail-value">${testDate}</div>
                    </div>
                            <div class="detail-item">
                        <span class="detail-label">Password</span>
                        <div class="detail-value">${dob}</div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Venue</span>
                        <div class="detail-value">${venue}</div>
                    </div>
                </div>
                <a href="${mapsLink}" class="btn">
                    <i class="fas fa-map-marker-alt"></i> Open Venue in Maps
                </a>
            </div>
            
            <!-- Important Information Card -->
            <div class="card">
                <h3><i class="fas fa-info-circle"></i> Important Information</h3>
                <ul class="info-list">
                    <li>You will receive your Admit Card and other exam instructions approximately one week before the exam date.</li>
                    <li>Ensure you carry a valid photo ID for verification.</li>
                    <li>Syllabus and sample paper for R-SAT are attached as a PDF.</li>
                </ul>
            </div>
            
            <!-- Scholarship Criteria Card -->
            <div class="card">
                <h3><i class="fas fa-award"></i> Scholarship Criteria</h3>
                <table class="scholarship-table">
                    <thead>
                        <tr>
                            <th>Score</th>
                            <th>Scholarship</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>95% and above</td>
                            <td>100% scholarship (with preliminary interview)</td>
                        </tr>
                        <tr>
                            <td>85% - 94%</td>
                            <td>50% scholarship</td>
                        </tr>
                        <tr>
                            <td>75% - 84%</td>
                            <td>25% scholarship</td>
                        </tr>
                        <tr>
                            <td>60% - 74%</td>
                            <td>10% scholarship</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Contact Section -->
            <div class="contact-section">
                <h3>Need Assistance?</h3>
                <p>We're here to help you with any questions about the R-SAT.</p>
                <div class="contact-links">
                    <a href="${whatsappLink}" class="contact-link">
                        <i class="fab fa-whatsapp"></i> Join Community
                    </a>
                    <a href="mailto:contact@ricr.in" class="contact-link">
                        <i class="fas fa-envelope"></i> contact@ricr.in
                    </a>
                    <a href="tel:+919907096014" class="contact-link">
                        <i class="fas fa-phone"></i> +91-9907096014
                    </a>
                    <a href="tel:+918889991736" class="contact-link">
                        <i class="fas fa-phone"></i> +91-8889991736
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer">
            <p>Best regards,</p>
            <p><strong>Team RICR</strong></p>
            <div class="social-links">
                <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                <a href="#" class="social-link"><i class="fab fa-linkedin-in"></i></a>
            </div>
            <div class="copyright">
                &copy; ${new Date().getFullYear()} RICR. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
  `;

  // Attach RSAT.pdf from the repository assets
  const pdfPath = path.resolve(process.cwd(), "src", "assests", "RSAT.pdf");
  const attachments = [
    {
      filename: "RSAT.pdf",
      path: pdfPath,
      contentType: "application/pdf",
    },
  ];

  return sendEmail(to, subject, html, attachments);
};

export const sendConfirmationEmail = async ({
  to,
  subject,
  studentName,
  demoSlot,
  type,
}) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Slot Confirmation</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f6f9fc;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 18px;
                color: #555;
                margin-bottom: 30px;
            }
            
            .info-card {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 30px;
                border-left: 4px solid #667eea;
            }
            
            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #e9ecef;
            }
            
            .info-item:last-child {
                border-bottom: none;
            }
            
            .info-label {
                font-weight: 600;
                color: #555;
                font-size: 14px;
            }
            
            .info-value {
                font-weight: 500;
                color: #333;
                font-size: 14px;
            }
            
            .highlight {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                text-align: center;
                margin: 25px 0;
                font-weight: 600;
            }
            
            .footer {
                text-align: center;
                padding: 30px;
                background: #f8f9fa;
                color: #666;
                font-size: 14px;
            }
            
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 15px;
            }
            
            @media (max-width: 600px) {
                .email-container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .header, .content {
                    padding: 25px 20px;
                }
                
                .info-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>🎉 Demo Slot Confirmed!</h1>
                <p>Your booking has been successfully processed</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Dear <strong>${studentName}</strong>,
                </div>
                
                <p style="margin-bottom: 25px; color: #555;">
                    Thank you for choosing R-SAT! Your demo slot has been successfully booked. 
                    Here are your booking details:
                </p>
                
                <div class="info-card">
                    <div class="info-item">
                        <span class="info-label">🕒 Timing</span>
                        <span class="info-value">${demoSlot}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">💻 Classes Mode</span>
                        <span class="info-value">${type}</span>
                    </div>
                </div>
                
                <div class="highlight">
                    ⏰ Please join 5 minutes before your scheduled time
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    If you have any questions or need to reschedule, please contact our support team. 
                    We look forward to helping you achieve your goals!
                </p>
            </div>
            
            <div class="footer">
                <div class="logo">R-SAT</div>
                <p>Thank you for trusting us with your educational journey</p>
                <p style="margin-top: 10px; font-size: 12px; color: #888;">
                    © 2024 R-SAT. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, html);
};



export const sendReferralConfirmationEmail = async (to, recipientName = "", payload = {}) => {
  if (!to) throw new Error("Recipient email required");

  // defensive extraction with many possible property names
  const extract = (obj, ...keys) => {
    for (const k of keys) {
      if (!obj) continue;
      const v = obj[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  };

  const referrerStudentID =
    extract(payload, "referrerStudentID", "referrer_studentID", "referrerStudentId") ||
    extract(payload.referrer, "student_ID", "studentId", "studentId", "studentID") ||
    "—";

  const studentRSAT =
    extract(payload, "rsatId", "studentID", "studentId", "student_id") ||
    (payload.student ? extract(payload.student, "student_ID", "studentId") : "") ||
    "—";

  // normalize DOB to dd-mm-yyyy if date-like
  const rawDob = extract(payload, "dob", "dateOfBirth", "birthDate");
  let dobFormatted = "";
  if (rawDob) {
    const d = new Date(rawDob);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      dobFormatted = `${dd}-${mm}-${yyyy}`;
    } else {
      dobFormatted = String(rawDob);
    }
  } else dobFormatted = "—";

  const testDate = extract(payload, "testDate", "examDate", "eventDate") || "19th Jan 2026";
  const venue =
    extract(payload, "venue", "location", "testVenue") ||
    "RICR Campus - Minal Mall, 4th Floor, Minal Residency, JK Road, Bhopal (462023)";

  // HTML template for referral-confirmation mail (simple & clear)
  const html = `
    <!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>R-SAT — Referral Confirmation</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#f5f7fa;margin:0;padding:22px}
      .card{max-width:700px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.06)}
      .head{background:linear-gradient(90deg,#2d7ff9,#1e56a0);color:#fff;padding:24px;text-align:center}
      .body{padding:22px;color:#111}
      .row{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
      .cell{flex:1;min-width:160px;background:#f8fafc;border-left:4px solid #2d7ff9;padding:12px;border-radius:8px}
      .label{font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:6px}
      .val{font-size:15px;color:#0f172a;font-weight:800}
      a.cta{display:inline-block;margin-top:14px;padding:10px 14px;background:#2d7ff9;color:#fff;border-radius:8px;text-decoration:none}
      .note{color:#6b7280;font-size:13px;margin-top:14px}
      .foot{background:#0f172a;color:#fff;padding:14px;text-align:center;font-size:13px}
      @media(max-width:600px){.row{flex-direction:column}}
    </style>
    </head>
    <body>
      <div class="card" role="article" aria-label="Referral Confirmation">
        <div class="head">
          <h2>R-SAT Registration — Referral Confirmed</h2>
          <div>${recipientName ? `Hi ${escapeHtml(recipientName)}` : "Hello"}</div>
        </div>

        <div class="body">
          <p>Thank you for completing registration through a referral. Keep these details safe — they will be used to sign in.</p>

          <div class="row">
            <div class="cell"><div class="label">Referrer RSAT ID</div><div class="val">${escapeHtml(referrerStudentID)}</div></div>
            <div class="cell"><div class="label">Your RSAT ID</div><div class="val">${escapeHtml(studentRSAT)}</div></div>
          </div>

          <div class="row">
            <div class="cell"><div class="label">Password (DOB)</div><div class="val">${escapeHtml(dobFormatted)}</div></div>
            <div class="cell"><div class="label">Test Date</div><div class="val">${escapeHtml(testDate)}</div></div>
          </div>

          <div style="margin-top:8px">
            <strong>Venue</strong>
            <p style="margin:6px 0 0;color:#374151">${escapeHtml(venue)}</p>
          </div>

          <a class="cta" href="#" onclick="return false;">Open Venue in Maps</a>

          <p class="note">If any value above looks incorrect, please contact support immediately: <a href="mailto:contact@ricr.in">contact@ricr.in</a></p>
        </div>

        <div class="foot">&copy; ${new Date().getFullYear()} RICR — R-SAT</div>
      </div>
    </body>
    </html>
  `;

  // attachments: allow payload.attachments override; include default RSAT.pdf if present
  const attachments = Array.isArray(payload.attachments) ? [...payload.attachments] : [];
  const defaultPdfPath = path.resolve(process.cwd(), "src", "assests", "RSAT.pdf");
  if (fs.existsSync(defaultPdfPath)) {
    const already = attachments.some(a => a.path && path.resolve(a.path) === defaultPdfPath);
    if (!already) attachments.push({ filename: "RSAT.pdf", path: defaultPdfPath, contentType: "application/pdf" });
  }

  // transporter from env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"RICR" <no-reply@ricr.in>',
    to,
    subject: "R-SAT — Referral Registration Confirmation",
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  if (!info || (info.rejected && info.rejected.length)) {
    throw new Error("Email not delivered: " + JSON.stringify(info));
  }
  return true;
};

// small helper
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



export const sendAdmitCardEmail = async (student, admits, opts = {}) => {
  if (!student || !student.email) {
    return { success: false, error: "Student email is required" };
  }

  const emails = Array.isArray(student.email)
    ? student.email
    : String(student.email).split(",").map(e => e.trim()).filter(e => e);

  if (emails.length === 0) {
    return { success: false, error: "No valid student email addresses found" };
  }

  const attachFiles = Array.isArray(opts.attachFiles) ? opts.attachFiles : [];
  const dashboardPath ="/candidate/dashboard";
  const sendIndividually = opts.sendIndividually === true;
  const subject = "Your R-SAT Admit Card is Now Available";
  const sentTo = [];

  // Prepare common HTML content for the email
  const generateEmailHtml = (admit) => {
    const examDate = admit.examDate || "19th Jan 2026";
    const venue = admit.venue || "RICR Campus - Minal Mall, 4th Floor, Minal Residency, JK Road, Bhopal (462023)";
    const examTime = admit.examTime || "10:00 AM";
    const reportingTime = admit.ReportingTime || "9:30 AM";
  const dashboardUrl = `${process.env.FRONTEND_BASE_URL || "https://rsat.ricr.in/candidate/dashboard"}`;
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your R-SAT Admit Card</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            line-height: 1.6;
          }
          .email-container {
            max-inline-size: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: #2d7ff9;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .content h2 {
            color: #2d7ff9;
          }
          .content p {
            margin: 10px 0;
          }
          .footer {
            background: #f1f1f1;
            padding: 10px;
            text-align: center;
            font-size: 0.9em;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>R-SAT Admit Card</h1>
          </div>
          <div class="content">
            <h2>Exam Details</h2>
            <p><strong>Exam Date:</strong> ${examDate}</p>
            <p><strong>Venue:</strong> ${venue}</p>
            <p><strong>Exam Time:</strong> ${examTime}</p>
            <p><strong>Reporting Time:</strong> ${reportingTime}</p>
            <p>You can access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} R-SAT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  try {
    if (sendIndividually) {
      for (const admit of admits) {
        for (const email of emails) {
          const html = generateEmailHtml(admit);
          const sent = await sendEmail(email, subject, html, attachFiles);
          if (sent) sentTo.push(email);
        }
      }
    } else {
      const html = admits.map(generateEmailHtml).join("<hr>");
      const sent = await sendEmail(emails.join(","), subject, html, attachFiles);
      if (sent) sentTo.push(...emails);
    }

    return { success: true, sentTo };
  } catch (error) {
    console.error("Error sending admit card email:", error);
    return { success: false, error: error.message || String(error) };
  }
};


