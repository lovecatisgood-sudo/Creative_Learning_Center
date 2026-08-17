import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { NotFoundAnalytics } from "@/components/NotFoundAnalytics";

export const metadata: Metadata = {
  title: "Page not found | Siamese Cat Creative Club",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const english = (await headers()).get("x-sccc-language") === "en";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff8ed] px-5 py-12 text-[#3d210f]">
      <NotFoundAnalytics />
      <section className="w-full max-w-xl rounded-3xl border border-[#efd9c4] bg-white p-7 text-center shadow-sm sm:p-10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#b85c24]">404</p>
        <h1 className="mt-3 text-3xl font-extrabold">
          {english ? "We couldn’t find that page" : "ไม่พบหน้าที่คุณต้องการ"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[#705644]">
          {english
            ? "The link may be old or mistyped. You can return to the club homepage or register your child below."
            : "ลิงก์นี้อาจเก่าหรือพิมพ์ไม่ถูกต้อง กลับไปหน้าแรกของคลับหรือลงทะเบียนเด็กได้ด้านล่าง"}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-xl bg-[#6f3410] px-5 py-3 font-bold text-white" href={english ? "/EN" : "/"}>
            {english ? "Go to homepage" : "กลับหน้าแรก"}
          </Link>
          <Link className="rounded-xl border border-[#b85c24] px-5 py-3 font-bold text-[#8d421b]" href={english ? "/EN/signup" : "/signup"}>
            {english ? "Register a child" : "ลงทะเบียนเด็ก"}
          </Link>
        </div>
      </section>
    </main>
  );
}
