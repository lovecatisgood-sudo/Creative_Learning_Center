import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siamese Cat Member",
  robots: { index: false, follow: false, nocache: true },
};

export default function EnglishMemberLayout({ children }: { children: React.ReactNode }) {
  return children;
}
