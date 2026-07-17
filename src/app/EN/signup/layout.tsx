import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Signup | Siamese Cat Creative Club",
  description: "Register a parent and child for Little Explorer Playgroup or After School Explorer.",
  alternates: {
    canonical: "/EN/signup",
    languages: { th: "/signup", en: "/EN/signup", "x-default": "/signup" },
  },
};

export default function EnglishSignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
