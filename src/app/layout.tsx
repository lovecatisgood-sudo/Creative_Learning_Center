import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { SITE_URL } from "@/lib/landing/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: process.env.NEXT_PUBLIC_SHOP_NAME || "Siamese Cat Creative Club",
  description: "Little Explorer Playgroup และโปรแกรม After School Explorer ใกล้เมกาบางนา พร้อมเซสชันยืดหยุ่น กิจกรรมสร้างสรรค์ ดูแลมื้ออาหาร และรอรับกลับ",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#5F2B00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const language = headers().get("x-sccc-language") === "en" ? "en" : "th";
  return (
    <html lang={language}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
