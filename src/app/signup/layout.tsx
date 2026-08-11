import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "สมัครสมาชิก Siamese Cat | Siamese Cat Creative Club",
  description: "สร้างรหัสสมาชิก Siamese Cat สำหรับดูแพ็กเกจ เซสชัน และประวัติการใช้งาน",
  alternates: {
    canonical: "/signup",
    languages: { th: "/signup", en: "/EN/signup", "x-default": "/signup" },
  },
  robots: { index: false, follow: true },
};

// The public registration flow keeps the phone-width column the whole POS uses.
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
