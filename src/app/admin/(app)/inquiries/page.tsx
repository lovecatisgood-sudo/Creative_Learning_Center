import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export const dynamic = "force-dynamic";

type InquiryDetail = {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  message?: string;
  language?: string;
  source?: string;
  emailDelivery?: "pending" | "sent" | "failed";
};

const serviceLabels: Record<string, string> = {
  "little-explorer-program": "Little Explorer Program",
  playgroup: "Playgroup",
  "creative-club": "Creative Club / After School Explorer",
  membership: "Membership",
  "meal-plans": "Meal Plans",
};

export default async function InquiriesPage() {
  const inquiries = await db
    .select({ id: auditLog.id, detail: auditLog.detail, createdAt: auditLog.createdAt })
    .from(auditLog)
    .where(eq(auditLog.entity, "contact_inquiry"))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <header className="border-b border-brown2 bg-brown px-4 py-3 text-cream">
        <h1 className="text-xl font-extrabold">Contact Inquiries</h1>
        <p className="text-sm text-cream/70">Latest 100 website messages</p>
      </header>
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {inquiries.length === 0 ? (
          <div className="rounded-lg border border-brown2 bg-white p-6 text-center text-meta">No inquiries yet.</div>
        ) : (
          <div className="mx-auto grid max-w-4xl gap-3">
            {inquiries.map((inquiry) => {
              const detail = (inquiry.detail ?? {}) as InquiryDetail;
              return (
                <article key={inquiry.id} className="rounded-lg border border-brown2 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-extrabold text-ink">{detail.name || "Unknown name"}</h2>
                      <p className="text-sm text-meta">{dateFormatter.format(inquiry.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-bold text-tealdeep">
                      {serviceLabels[detail.service || ""] || "General inquiry"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {detail.phone && <a className="font-semibold text-tealdeep underline" href={`tel:${detail.phone}`}>{detail.phone}</a>}
                    {detail.email && <a className="font-semibold text-tealdeep underline" href={`mailto:${detail.email}`}>{detail.email}</a>}
                    {detail.emailDelivery && (
                      <span className={detail.emailDelivery === "sent" ? "font-semibold text-tealdeep" : "font-semibold text-amber-700"}>
                        {detail.emailDelivery === "sent" ? "Email sent" : detail.emailDelivery === "failed" ? "Email delivery failed" : "Email pending"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{detail.message}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
