import nodemailer from "nodemailer";

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const transporter = nodemailer.createTransport({
  host: getEnv("SMTP_HOST"),
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: getEnv("SMTP_USER"),
    pass: getEnv("SMTP_PASS")
  }
});

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}) {
  await transporter.verify();

  const info = await transporter.sendMail({
    from: getEnv("EMAIL_FROM"),
    to: input.to,
    subject: "Reset your s30-nudge password",
    text: `Reset your password using this link: ${input.resetUrl}`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${input.resetUrl}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `
  });

  console.log("Password reset email sent", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected
  });
}
