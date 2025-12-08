import nodemailer from "nodemailer";

export async function sendOtpEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Mindnamo Security" <${process.env.GMAIL_USER}>`,
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
              Thanks for joining Mindnamo! Please use the following One-Time Password (OTP) to verify your account. 
              This code is valid for <strong>10 minutes</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #18181b; background: #fff; padding: 10px 20px; border: 1px solid #ccc; border-radius: 5px;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #777; font-size: 12px; margin-top: 20px; text-align: center;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Mindnamo Inc. All rights reserved.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}