"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BlogLanguage } from "@/lib/blog-shared";

type NavItem = {
  key: string;
  href: string;
  th: string;
  en: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { key: "inside", href: "/inside", th: "ภายในคลับ", en: "Inside the Club" },
  {
    key: "creative",
    href: "/creative",
    th: "ครีเอทีฟคลับ",
    en: "Creative Club",
    children: [{ key: "playgroup", href: "/playgroup", th: "เพลย์กรุ๊ป", en: "Playgroup" }],
  },
  { key: "little-explorer-program", href: "/little-explorer-program", th: "โปรแกรม Little Explorer", en: "Little Explorer Program" },
  {
    key: "membership",
    href: "/membership",
    th: "สมาชิก",
    en: "Membership",
    children: [{ key: "dinner", href: "/dinner", th: "แผนมื้ออาหาร", en: "Meal Plans" }],
  },
  {
    key: "blog",
    href: "/blog",
    th: "บล็อก",
    en: "Blog",
    children: [{ key: "faq", href: "/faq", th: "FAQ", en: "FAQ" }],
  },
];

export function PublicBlogShell({
  language,
  alternateHref,
  children,
}: {
  language: BlogLanguage;
  alternateHref: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const value = (item: { th: string; en: string }) => item[language];
  const local = (href: string) => language === "en" ? (href === "/" ? "/EN" : `/EN${href}`) : href;

  useEffect(() => {
    document.body.dataset.page = "blog";
    document.body.dataset.language = language;
    document.body.classList.toggle("no-scroll", menuOpen);
    return () => {
      document.body.classList.remove("no-scroll");
      delete document.body.dataset.page;
      delete document.body.dataset.language;
    };
  }, [language, menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main">{language === "th" ? "ข้ามไปยังเนื้อหา" : "Skip to content"}</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href={local("/")} aria-label={language === "th" ? "หน้าหลัก Siamese Cat Creative Club" : "Siamese Cat Creative Club home"}>
            <span className="brand-mark"><img className="brand-logo-img" src="/main-site/assets/logo-circle-96.webp?v=20260717-blog-v7" width="96" height="96" alt={language === "th" ? "โลโก้ Siamese Cat Creative Club" : "Siamese Cat Creative Club logo"} /></span>
            <span className="brand-text"><strong>Siamese Cat Creative Club</strong><span>{language === "th" ? "ยืดหยุ่น • สร้างสรรค์ • ใส่ใจ" : "Flexible • Creative • Caring"}</span></span>
          </Link>
          <nav className={`main-nav${menuOpen ? " open" : ""}`} aria-label={language === "th" ? "เมนูหลัก" : "Primary navigation"}>
            {NAV_ITEMS.map((item) => item.children ? (
              <div key={item.key} className={`nav-dropdown${item.key === "blog" ? " active" : ""}`}>
                <Link data-nav={item.key} className={`nav-link nav-parent${item.key === "blog" ? " active" : ""}`} href={local(item.href)} onClick={() => setMenuOpen(false)} aria-haspopup="true">
                  {value(item)}<span className="nav-caret" aria-hidden="true">⌄</span>
                </Link>
                <div className="nav-submenu" aria-label={language === "th" ? `หน้าในเมนู ${item.th}` : `${item.en} pages`}>
                  {item.children.map((child) => <Link key={child.key} data-nav={child.key} className="nav-submenu-link" href={local(child.href)} onClick={() => setMenuOpen(false)}>{value(child)}</Link>)}
                </div>
              </div>
            ) : (
              <Link key={item.key} data-nav={item.key} className="nav-link" href={local(item.href)} onClick={() => setMenuOpen(false)}>{value(item)}</Link>
            ))}
            <Link data-nav="contact" className="btn btn-primary" href={local("/contact")} onClick={() => setMenuOpen(false)}>{language === "th" ? "ติดต่อเรา" : "Contact Us"}</Link>
          </nav>
          <div className="header-actions">
            <Link className="lang-toggle" href={alternateHref} hrefLang={language === "th" ? "en" : "th"} aria-label={language === "th" ? "English - เปลี่ยนเป็นภาษาอังกฤษ" : "ไทย - Switch to Thai"}>{language === "th" ? "English" : "ไทย"}</Link>
            <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label={language === "th" ? "เปิดเมนู" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand" style={{ color: "#fff8ed", marginBottom: 18 }}><span className="brand-mark"><img className="brand-logo-img" src="/main-site/assets/logo-circle-96.webp?v=20260717-blog-v7" width="96" height="96" alt={language === "th" ? "โลโก้ Siamese Cat Creative Club" : "Siamese Cat Creative Club logo"} loading="lazy" /></span><span className="brand-text"><strong>Siamese Cat Creative Club</strong><span style={{ color: "rgba(255,248,237,.7)" }}>{language === "th" ? "ใกล้เมกาบางนา" : "Near Mega Bangna"}</span></span></div>
              <p style={{ maxWidth: 480, color: "rgba(255,248,237,.76)" }}>{language === "th" ? "สองโปรแกรมกลุ่มเล็กแบบยืดหยุ่นสำหรับเด็ก ทั้งเพลย์กรุ๊ปช่วงกลางวัน และโปรแกรมหลังเลิกเรียน พร้อมการเล่น การบ้าน ความสร้างสรรค์ มื้ออาหาร และการรอรับกลับ" : "Two flexible small-group programs for children: daytime playgroup care and after-school explorer support with play, homework, creativity, meal care and pickup routines."}</p>
              <a className="footer-cafe-link" href="https://siamesecat.cafe/">{language === "th" ? "เยี่ยมชม Siamese Cat Cafe" : "Visit Siamese Cat Cafe"}</a>
            </div>
            <div>
              <div className="footer-title">{language === "th" ? "สำรวจ" : "Explore"}</div>
              <div className="footer-links">
                {NAV_ITEMS.map((item) => (
                  <span className="contents" key={item.key}>
                    <Link href={local(item.href)}>{value(item)}</Link>
                    {item.children?.map((child) => <Link className="footer-sublink" key={child.key} href={local(child.href)}>{value(child)}</Link>)}
                  </span>
                ))}
                <Link href={local("/contact")}>{language === "th" ? "ติดต่อเรา" : "Contact Us"}</Link>
                <Link href={local("/first-visit")}>{language === "th" ? "เริ่มครั้งแรก" : "First Session"}</Link>
              </div>
            </div>
            <div>
              <div className="footer-title">{language === "th" ? "แวะมาหาเรา" : "Visit us"}</div>
              <div className="footer-links">
                <span>{language === "th" ? "46/27 ถนนคู่ขนานบางนา-ตราด บางแก้ว" : "46/27 Bang Na-Trat Frontage Road, Bang Kaeo"}</span>
                <span>{language === "th" ? "หลังเลิกเรียนวันธรรมดา 15:00-20:00" : "Weekdays 3-8 PM for after-school support"}</span>
                <span>{language === "th" ? "เวลาเพลย์กรุ๊ปตามการจองที่ยืนยันแล้ว" : "Playgroup times by confirmed booking"}</span>
                <a href="https://maps.app.goo.gl/XpYHkxenRu6gLvnFA" target="_blank" rel="noreferrer">{language === "th" ? "ดูเส้นทาง" : "Get directions"}</a>
                <a href="mailto:Cafe@siamesecat.cafe">Cafe@siamesecat.cafe</a>
                <a href="tel:+66804803802">+66 80 480 3802</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} Siamese Cat Creative Club</span><span><Link href={local("/privacy")}>{language === "th" ? "ความเป็นส่วนตัวและ PDPA" : "Privacy & PDPA"}</Link> · <Link href={local("/terms")}>{language === "th" ? "เงื่อนไขบริการ" : "Service terms"}</Link></span></div>
        </div>
      </footer>
    </>
  );
}
