import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registration Successful | Siamese Cat Creative Club",
  description: "Siamese Cat Creative Club has received the registration.",
  robots: { index: false, follow: false },
};

export default function EnglishSignupSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
