"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";

const copy = {
  en: {
    tagline: "Flexible • Creative • Caring",
    navLabel: "Primary navigation",
    homeAria: "Siamese Cat Creative Club home",
    logoAlt: "Siamese Cat Creative Club circle logo",
    inside: "Inside the Club",
    creative: "Creative Club",
    memberships: "Memberships",
    dinner: "Café Dinner",
    faq: "FAQ",
    book: "Book a Visit",
    switchLanguage: "Switch to Thai",
    openNav: "Open navigation",
    footerTagline:
      "A flexible creative club for children ages 5-12, with homework monitoring, art, play, reading, bilingual support and optional cafe dinners.",
    explore: "Explore",
    visit: "Visit us",
    address: "Near Mega Bangna, Samut Prakan",
    weekdays: "Weekdays 3-8 PM",
    weekends: "Weekends 10 AM-6 PM",
    privacy: "Privacy & PDPA",
    terms: "Membership terms",
    firstVisit: "First Visit Offer",
    lineUnavailable: "LINE is not connected yet. Please use signup or call us.",
  },
  th: {
    tagline: "Flexible • Creative • Caring",
    navLabel: "เมนูหลัก",
    homeAria: "หน้าแรก Siamese Cat Creative Club",
    logoAlt: "โลโก้วงกลม Siamese Cat Creative Club",
    inside: "ภายในคลับ",
    creative: "Creative Club",
    memberships: "สมาชิกและราคา",
    dinner: "อาหารเย็นจากคาเฟ่",
    faq: "คำถามที่พบบ่อย",
    book: "จองวันทดลอง",
    switchLanguage: "เปลี่ยนเป็นภาษาอังกฤษ",
    openNav: "เปิดเมนู",
    footerTagline:
      "คลับสร้างสรรค์แบบยืดหยุ่นสำหรับเด็กอายุ 5-12 ปี พร้อมดูแลการบ้าน ศิลปะ การเล่น มุมอ่านหนังสือ ทีมงานสองภาษา และอาหารเย็นจากคาเฟ่แบบเลือกเพิ่มได้",
    explore: "สำรวจ",
    visit: "แวะมาหาเรา",
    address: "ใกล้เมกาบางนา สมุทรปราการ",
    weekdays: "วันธรรมดา 15:00-20:00",
    weekends: "วันหยุด 10:00-18:00",
    privacy: "ความเป็นส่วนตัวและ PDPA",
    terms: "เงื่อนไขสมาชิก",
    firstVisit: "โปรวันทดลอง",
    lineUnavailable: "ยังไม่ได้เชื่อมลิงก์ LINE OA กรุณาใช้แบบฟอร์มลงทะเบียนหรือโทรหาเรา",
  },
};

type MainSiteShellProps = {
  children: ReactNode;
};

export function MainSiteShell({ children }: MainSiteShellProps) {
  const { lang, toggle } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const t = copy[lang];
  const year = new Date().getFullYear();

  useEffect(() => {
    document.body.classList.toggle("no-scroll", menuOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [menuOpen]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLine(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setToast(t.lineUnavailable);
  }

  return (
    <div className="creative-main-site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label={t.homeAria} onClick={closeMenu}>
            <span className="brand-mark">
              <img
                className="brand-logo-img"
                src="/main-site/assets/logo-circle.png"
                alt={t.logoAlt}
              />
            </span>
            <span className="brand-text">
              <strong>Siamese Cat Creative Club</strong>
              <span>{t.tagline}</span>
            </span>
          </a>
          <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label={t.navLabel}>
            <a data-nav="inside" href="/inside" onClick={closeMenu}>
              {t.inside}
            </a>
            <a data-nav="creative" className="active" href="/creative" onClick={closeMenu}>
              {t.creative}
            </a>
            <a data-nav="memberships" href="/memberships" onClick={closeMenu}>
              {t.memberships}
            </a>
            <a data-nav="dinner" href="/dinner" onClick={closeMenu}>
              {t.dinner}
            </a>
            <a data-nav="faq" href="/faq" onClick={closeMenu}>
              {t.faq}
            </a>
            <a data-nav="book" className="btn btn-primary" href="/signup" onClick={closeMenu}>
              {t.book} <span className="paw">🐾</span>
            </a>
          </nav>
          <div className="header-actions">
            <button className="lang-toggle" type="button" aria-label={t.switchLanguage} onClick={toggle}>
              {lang === "en" ? "TH" : "EN"}
            </button>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-label={t.openNav}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="brand" style={{ color: "#fff8ed", marginBottom: 18 }}>
                <span className="brand-mark">
                  <img
                    className="brand-logo-img"
                    src="/main-site/assets/logo-circle.png"
                    alt={t.logoAlt}
                  />
                </span>
                <span className="brand-text">
                  <strong>Siamese Cat Creative Club</strong>
                  <span style={{ color: "rgba(255,248,237,.7)" }}>Near Mega Bangna</span>
                </span>
              </div>
              <p style={{ maxWidth: 480, color: "rgba(255,248,237,.76)" }}>{t.footerTagline}</p>
            </div>
            <div>
              <div className="footer-title">{t.explore}</div>
              <div className="footer-links">
                <a href="/inside">{t.inside}</a>
                <a href="/creative">{t.creative}</a>
                <a href="/memberships">{t.memberships}</a>
                <a href="/dinner">{t.dinner}</a>
                <a href="/faq">{t.faq}</a>
                <a href="/first-visit">{t.firstVisit}</a>
              </div>
            </div>
            <div>
              <div className="footer-title">{t.visit}</div>
              <div className="footer-links">
                <span>{t.address}</span>
                <span>{t.weekdays}</span>
                <span>{t.weekends}</span>
                <a href="#" onClick={handleLine}>
                  LINE
                </a>
                <a href="tel:+66804803802">+66-0804803802</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {year} Siamese Cat Creative Club</span>
            <span>
              <a href="/privacy">{t.privacy}</a> · <a href="/faq">{t.terms}</a>
            </span>
          </div>
        </div>
      </footer>
      <div id="site-toast" className={toast ? "toast show" : "toast"} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
