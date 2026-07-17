import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ลงทะเบียนสำเร็จ | Siamese Cat Creative Club",
  description: "Siamese Cat Creative Club ได้รับข้อมูลลงทะเบียนแล้ว",
  robots: { index: false, follow: false },
};

export default function SignupSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
