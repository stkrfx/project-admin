import nodemailer from "nodemailer";

const {
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD,
  EMAIL_FROM,
  NODE_ENV
} = process.env;

let transporter;

/**
 * -------------------------------------------------------
 * SMART TRANSPORTER CONFIGURATION
 * -------------------------------------------------------
 * 1. PROD: Uses explicit SMTP settings.
 * 2. DEV (with creds): Uses Gmail or SMTP.
 * 3. DEV (no creds): Uses Mock Logger (Prevents Crashes).
 */

if (EMAIL_SERVER_HOST && EMAIL_SERVER_USER) {
  // Option A: Real SMTP Server (Resend, SendGrid, AWS SES)
  transporter = nodemailer.createTransport({
    host: EMAIL_SERVER_HOST,
    port: Number(EMAIL_SERVER_PORT) || 587,
    secure: Number(EMAIL_SERVER_PORT) === 465, // True for 465, false for other ports
    auth: {
      user: EMAIL_SERVER_USER,
      pass: EMAIL_SERVER_PASSWORD,
    },
  });
} else if (process.env.EMAIL_DEV_USER && process.env.EMAIL_DEV_PASS) {
  // Option B: Gmail (Development only)
  console.log("📧 Using Gmail for Development Emails");
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_DEV_USER,
      pass: process.env.EMAIL_DEV_PASS,
    },
  });
} else {
  // Option C: Mock Transporter (Fallback)
  console.warn("⚠️  NO EMAIL CREDENTIALS FOUND. EMAILS WILL BE LOGGED TO CONSOLE.");
  transporter = {
    sendMail: async (mailOptions) => {
      console.log("--------------------------------------------------");
      console.log("📨 MOCK EMAIL SENT");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("HTML Preview:", mailOptions.html.substring(0, 100) + "...");
      console.log("--------------------------------------------------");
      return Promise.resolve(true);
    },
  };
}

/**
 * -------------------------------------------------------
 * SEND OTP VERIFICATION EMAIL
 * -------------------------------------------------------
 */
export async function sendOtpEmail(email, otp) {
  try {
    const mailOptions = {
      from: `"Mindnamo Security" <${EMAIL_FROM || "no-reply@mindnamo.com"}>`,
      to: email,
      subject: "Verify your Mindnamo account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #18181b; font-size: 24px; font-weight: bold; margin: 0;">Mindnamo</h1>
          </div>
          
          <div style="padding: 20px; background-color: #fafafa; border-radius: 8px;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Verify your email address</h2>
            <p style="color: #555; font-size: 14px; line-height: 1.5;">
              Use the code below to verify your account. Valid for <strong>10 minutes</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b; background: #fff; padding: 10px 20px; border: 1px solid #ccc; border-radius: 5px;">
                ${otp}
              </span>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    // In Dev, don't block the user flow even if email fails
    if (NODE_ENV !== "production") return true; 
    return false;
  }
}

/**
 * -------------------------------------------------------
 * SEND PASSWORD RESET EMAIL
 * -------------------------------------------------------
 */
export async function sendPasswordResetEmail(email, token) {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Mindnamo Security" <${EMAIL_FROM || "no-reply@mindnamo.com"}>`,
      to: email,
      subject: "Reset your Mindnamo Expert Password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    if (NODE_ENV !== "production") return true;
    return false;
  }
}