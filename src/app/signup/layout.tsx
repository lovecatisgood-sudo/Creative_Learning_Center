import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ลงทะเบียนผู้ปกครอง | Siamese Cat Creative Club",
  description: "ลงทะเบียนผู้ปกครองและเด็กสำหรับ Little Explorer Playgroup หรือโปรแกรม After School Explorer",
  alternates: {
    canonical: "/signup",
    languages: { th: "/signup", en: "/EN/signup", "x-default": "/signup" },
  },
};

// The public registration flow keeps the phone-width column the whole POS uses.
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
