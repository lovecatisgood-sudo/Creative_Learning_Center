import nodemailer from "nodemailer";

export type ContactInquiryEmail = {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  language: "th" | "en";
  source: string;
};

const SERVICE_LABELS: Record<string, string> = {
  "": "General inquiry",
  "little-explorer-program": "Little Explorer Program",
  playgroup: "Little Explorer Playgroup",
  "creative-club": "Creative Club / After School Explorer",
  membership: "Membership",
  "meal-plans": "Meal Plans",
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendContactInquiryEmail(inquiry: ContactInquiryEmail) {
  const host = requiredEnv("SMTP_HOST");
  const user = requiredEnv("SMTP_USER");
  const password = requiredEnv("SMTP_PASSWORD");
  const to = requiredEnv("CONTACT_TO_EMAIL");
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE !== "false";

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT is invalid");
  }

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

  const service = SERVICE_LABELS[inquiry.service] || "General inquiry";
  const headerSafeName = inquiry.name.replace(/[\r\n]+/g, " ");
  const submittedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  const safe = {
    name: escapeHtml(inquiry.name),
    phone: escapeHtml(inquiry.phone),
    email: escapeHtml(inquiry.email),
    service: escapeHtml(service),
    message: escapeHtml(inquiry.message).replace(/\r?\n/g, "<br>"),
    language: inquiry.language === "th" ? "Thai" : "English",
    source: escapeHtml(inquiry.source),
    submittedAt: escapeHtml(submittedAt),
  };
  const telephoneHref = inquiry.phone.replace(/[^+\d]/g, "");

  return transporter.sendMail({
    from: { name: "Siamese Cat Creative Club Website", address: user },
    to,
    replyTo: { name: headerSafeName, address: inquiry.email },
    subject: `[Creative Club Website] ${service} - ${headerSafeName}`,
    text: [
      "New website contact inquiry",
      "",
      `Name: ${inquiry.name}`,
      `Phone: ${inquiry.phone}`,
      `Email: ${inquiry.email}`,
      `Service: ${service}`,
      `Website language: ${inquiry.language === "th" ? "Thai" : "English"}`,
      `Submitted: ${submittedAt}`,
      `Source: ${inquiry.source}`,
      "",
      "Message:",
      inquiry.message,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#24211f;line-height:1.55;max-width:680px">
        <h1 style="font-size:22px;margin:0 0 18px">New website contact inquiry</h1>
        <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold;width:150px">Name</td><td style="padding:7px 0">${safe.name}</td></tr>
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Phone</td><td style="padding:7px 0"><a href="tel:${telephoneHref}">${safe.phone}</a></td></tr>
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Email</td><td style="padding:7px 0"><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Service</td><td style="padding:7px 0">${safe.service}</td></tr>
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Website language</td><td style="padding:7px 0">${safe.language}</td></tr>
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Submitted</td><td style="padding:7px 0">${safe.submittedAt}</td></tr>
          <tr><td style="padding:7px 12px 7px 0;font-weight:bold">Source</td><td style="padding:7px 0">${safe.source}</td></tr>
        </table>
        <h2 style="font-size:17px;margin:0 0 8px">Message</h2>
        <div style="background:#f7f5ef;border:1px solid #ded8ca;padding:16px">${safe.message}</div>
        <p style="font-size:13px;color:#67625b;margin-top:18px">Reply to this email to respond directly to the customer.</p>
      </div>
    `,
  });
}
