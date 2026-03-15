import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "s30-nudge <no-reply@s30nudge.com>",
    to: input.to,
    subject: "Reset your s30-nudge password",
    text: `Reset your password using this link: ${input.resetUrl}`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${input.resetUrl}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `
  });
}
