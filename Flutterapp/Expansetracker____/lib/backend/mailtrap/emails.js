import nodemailer from "nodemailer";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailTemplates.js";

// Configure Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bilalgamestorage1605@gmail.com", // Replace with your Gmail
    pass: "fgtz msah qkeu bmau",  // Replace with your generated App Password
  },
});

// Generic function to send emails
const sendEmail = async (to, subject, html, text) => {
  try {
    const info = await transporter.sendMail({
      from: '"CardioLink Support" <yourgmail@gmail.com>', // Replace with your sender email
      to, // Recipient email
      subject, // Email subject
      text, // Plain text fallback
      html, // HTML content
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw new Error(`Error sending email: ${error.message}`);
  }
};

// Send Verification Email
export const sendVerificationEmail = async (email, verificationToken) => {
  const text = `Your verification code is: ${verificationToken}`;
  const html = VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken);
  await sendEmail(email, "Verify your email", html, text);
};

// Send Welcome Email
export const sendWelcomeEmail = async (email, name) => {
  const text = `Welcome to CardioLink, ${name}! We're excited to have you.`;
  const html = `
    <h1>Welcome to CardioLink, ${name}!</h1>
    <p>We're excited to have you on board.</p>
  `;
  await sendEmail(email, "Welcome to CardioLink!", html, text);
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (email, resetURL) => {
  const text = `Click the following link to reset your password: ${resetURL}`;
  const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL);
  await sendEmail(email, "Reset your password", html, text);
};

// Send Password Reset Success Email
export const sendResetSuccessEmail = async (email) => {
  const text = "Your password has been successfully reset.";
  const html = PASSWORD_RESET_SUCCESS_TEMPLATE;
  await sendEmail(email, "Password Reset Successful", html, text);
};
