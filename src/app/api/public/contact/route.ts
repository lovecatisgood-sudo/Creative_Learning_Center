import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { sendContactInquiryEmail } from "@/lib/contact-mail";

const PHONE_RE = /^[+\d][\d\s()-]{5,28}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SERVICES = new Set([
  "",
  "little-explorer-program",
  "playgroup",
  "creative-club",
  "membership",
  "meal-plans",
]);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  // Quietly accept bot submissions that fill the hidden field.
  if (String(body.website ?? "").trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const service = String(body.service ?? "").trim();
  const message = String(body.message ?? "").trim();
  const language = body.language === "en" ? "en" : "th";
  const source = String(body.source ?? "WEB-CONTACT").trim().slice(0, 64);

  if (!name || !phone || !email || !message || body.consent !== true) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }
  if (name.length > 120 || !PHONE_RE.test(phone) || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid contact details" }, { status: 422 });
  }
  if (!SERVICES.has(service) || message.length < 10 || message.length > 3000) {
    return NextResponse.json({ error: "Invalid inquiry" }, { status: 422 });
  }

  try {
    const detail = { name, phone, email, service, message, language, source };
    const [savedInquiry] = await db
      .insert(auditLog)
      .values({
        action: "public_contact_inquiry",
        entity: "contact_inquiry",
        detail: { ...detail, emailDelivery: "pending" },
      })
      .returning({ id: auditLog.id });

    let emailSent = false;
    try {
      const delivery = await sendContactInquiryEmail({ ...detail, language });
      emailSent = true;
      try {
        await db
          .update(auditLog)
          .set({ detail: { ...detail, emailDelivery: "sent", emailMessageId: delivery.messageId } })
          .where(eq(auditLog.id, savedInquiry.id));
      } catch (updateError) {
        console.error("Unable to record successful email delivery", updateError);
      }
    } catch (emailError) {
      console.error("Contact inquiry email delivery failed", emailError);
      await db
        .update(auditLog)
        .set({ detail: { ...detail, emailDelivery: "failed" } })
        .where(eq(auditLog.id, savedInquiry.id))
        .catch((updateError) => console.error("Unable to record email delivery failure", updateError));
    }

    return NextResponse.json({ ok: true, emailSent }, { status: 201 });
  } catch (error) {
    console.error("Public contact inquiry failed", error);
    return NextResponse.json({ error: "Unable to save inquiry" }, { status: 500 });
  }
}
