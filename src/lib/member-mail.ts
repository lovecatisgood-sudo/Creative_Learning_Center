import nodemailer from "nodemailer";

export class MemberMailDeliveryError extends Error {
  constructor() {
    super("MEMBER_MAIL_RECIPIENT_NOT_ACCEPTED");
    this.name = "MemberMailDeliveryError";
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

export async function sendMemberAccessEmail(args: {
  to: string;
  memberName: string;
  accessUrl: string;
  language: "th" | "en";
  purpose: "verify" | "signin";
}) {
  const host = requiredEnv("SMTP_HOST");
  const user = requiredEnv("SMTP_USER");
  const password = requiredEnv("SMTP_PASSWORD");
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE !== "false";
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT is invalid");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    requireTLS: !secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  const th = args.language === "th";
  const title = args.purpose === "verify"
    ? (th ? "ยืนยันอีเมลสมาชิก Siamese Cat" : "Verify your Siamese Cat Member email")
    : (th ? "เข้าสู่ระบบสมาชิก Siamese Cat" : "Sign in to Siamese Cat Member");
  const action = args.purpose === "verify"
    ? (th ? "ยืนยันอีเมล" : "Verify email")
    : (th ? "เข้าสู่ระบบ" : "Sign in");
  const explanation = th
    ? "ลิงก์นี้ใช้ได้ครั้งเดียวและจะหมดอายุใน 20 นาที หากคุณไม่ได้ขอลิงก์นี้ ไม่ต้องดำเนินการใดๆ"
    : "This single-use link expires in 20 minutes. If you did not request it, you can ignore this email.";
  const safeUrl = escapeHtml(args.accessUrl);
  const safeName = escapeHtml(args.memberName);

  const result = await transporter.sendMail({
    from: { name: "Siamese Cat Member", address: user },
    to: args.to,
    subject: title,
    text: `${title}\n\n${args.memberName}\n\n${action}: ${args.accessUrl}\n\n${explanation}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#33200d;line-height:1.55;max-width:560px;margin:auto">
        <h1 style="font-size:24px;color:#5f2b00">${title}</h1>
        <p>${th ? "สวัสดี" : "Hello"} ${safeName},</p>
        <p>${explanation}</p>
        <p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#e98c1d;color:#3a1e00;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:12px">${action}</a></p>
        <p style="font-size:12px;color:#83694e;word-break:break-all">${safeUrl}</p>
      </div>
    `,
  });
  if (!Array.isArray(result.accepted) || result.accepted.length === 0) {
    throw new MemberMailDeliveryError();
  }
  return { accepted: true as const };
}
