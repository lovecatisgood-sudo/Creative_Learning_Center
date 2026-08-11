import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Siamese Cat Member | Siamese Cat Creative Club",
  description: "Create a Siamese Cat Member ID to view packages, sessions, and usage history.",
  alternates: {
    canonical: "/EN/signup",
    languages: { th: "/signup", en: "/EN/signup", "x-default": "/signup" },
  },
};

export default function EnglishSignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
