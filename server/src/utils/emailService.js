import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
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
    html: text,
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
  const subject = "Your Nav Kalpana OTP Code ";
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
  const subject = "Your Nav Kalpana Login Credentials";
  const email = to;
  const text = `
    
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Your Nav Kalpana Login Credentials</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #f9f9f9; color: #222; }
                    .container { max-width: 400px; margin: 40px auto; background: #fff; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);}
                    .footer { font-size: 0.9em; color: #888; margin-top: 32px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Your Nav Kalpana Login Credentials</h2>
                    <p>Hello,</p>
                    <p>Your login credentials are as follows:</p>
                    <p>Team Code: ${credentials}</p>
                    <p>Email: ${email}</p>
               
                    <p>Please keep this information safe and do not share it with anyone.</p>
                    <div class="footer">
                        If you did not request this, please ignore this email.<br>
                        &copy; ${new Date().getFullYear()} Nav Kalpana
                    </div>
                </div>
            </body>
        </html>
    `;
  return sendEmail(to, subject, text);
};
