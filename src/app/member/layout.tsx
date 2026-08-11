import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Siamese Cat Member",
  robots: { index: false, follow: false, nocache: true },
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <div className="member-frame">{children}</div>;
}
