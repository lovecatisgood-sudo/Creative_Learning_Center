"use client";

import { usePathname } from "next/navigation";
import type { MemberReceipt } from "@/lib/member-receipt";

export function MemberReceiptClient({ receipt }: { receipt: MemberReceipt }) {
  const th = !usePathname().startsWith("/EN/");
  const method = receipt.method === "promptpay" ? "PromptPay" : receipt.method === "bank" ? (th ? "โอนธนาคาร" : "Bank transfer") : (th ? "เงินสด" : "Cash");
  return (
    <main className="min-h-dvh bg-paper px-4 py-6 safe-top safe-bottom">
      <div className="mx-auto max-w-md">
        <a href={th ? "/member" : "/EN/member"} className="inline-flex min-h-[44px] items-center font-bold text-tealdeep">‹ {th ? "กลับ" : "Back"}</a>
        <section className="mt-2 rounded-2xl border border-line bg-white p-5 text-ink shadow-sm">
          <header className="text-center"><h1 className="text-xl font-extrabold text-brown">Siamese Cat Creative Club</h1><p className="text-sm text-meta">{th ? "ใบเสร็จ" : "Receipt"}</p></header>
          <div className="my-4 border-t border-dashed border-line" />
          <Row label={th ? "เลขที่" : "Receipt no."} value={receipt.receiptNo ?? `#${receipt.orderId}`} />
          <Row label={th ? "วันที่" : "Date"} value={new Date(receipt.createdAt).toLocaleString(th ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" })} />
          {receipt.childName && <Row label={th ? "เด็ก" : "Child"} value={receipt.childName} />}
          <div className="my-4 border-t border-dashed border-line" />
          {receipt.items.map((item, index) => <div key={index} className="mb-3"><div className="flex justify-between gap-3"><span className="font-semibold">{th ? item.nameTh : item.nameEn}</span><span>{item.lineTotalThb.toLocaleString()} ฿</span></div><p className="text-xs text-meta">{item.qty} × {item.unitPriceThb.toLocaleString()} ฿</p></div>)}
          <div className="my-4 border-t border-dashed border-line" />
          <div className="flex justify-between text-xl font-extrabold"><span>{th ? "รวม" : "Total"}</span><span>{receipt.totalThb.toLocaleString()} ฿</span></div>
          <Row label={th ? "วิธีชำระ" : "Payment"} value={method} />
        </section>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="mt-2 flex justify-between gap-3 text-sm"><span className="text-meta">{label}</span><span className="text-right font-semibold">{value}</span></div>;
}
