"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogPost } from "@/db/schema";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, normalizeBlogSlug, type BlogLanguage, type BlogPostInput } from "@/lib/blog-shared";
import { useLang } from "@/lib/i18n/LanguageProvider";

const EMPTY_POST: BlogPostInput = {
  slug: "",
  category: "parenting-guides",
  titleTh: "",
  summaryTh: "",
  bodyTh: "",
  seoTitleTh: "",
  seoDescriptionTh: "",
  titleEn: "",
  summaryEn: "",
  bodyEn: "",
  seoTitleEn: "",
  seoDescriptionEn: "",
  coverImageUrl: "",
  coverImageAltTh: "",
  coverImageAltEn: "",
  publishedTh: false,
  publishedEn: false,
};

export function BlogEditor({ initialPost }: { initialPost?: BlogPost }) {
  const router = useRouter();
  const { lang: adminLanguage, t } = useLang();
  const [language, setLanguage] = useState<BlogLanguage>("th");
  const [form, setForm] = useState<BlogPostInput>(initialPost ? pickEditable(initialPost) : EMPTY_POST);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const suffix = language === "th" ? "Th" : "En";
  const titleKey = `title${suffix}` as "titleTh" | "titleEn";
  const summaryKey = `summary${suffix}` as "summaryTh" | "summaryEn";
  const bodyKey = `body${suffix}` as "bodyTh" | "bodyEn";
  const seoTitleKey = `seoTitle${suffix}` as "seoTitleTh" | "seoTitleEn";
  const seoDescriptionKey = `seoDescription${suffix}` as "seoDescriptionTh" | "seoDescriptionEn";
  const altKey = `coverImageAlt${suffix}` as "coverImageAltTh" | "coverImageAltEn";
  const publishedKey = `published${suffix}` as "publishedTh" | "publishedEn";

  function update<K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    const endpoint = initialPost ? `/api/admin/blog/${initialPost.id}` : "/api/admin/blog";
    const response = await fetch(endpoint, {
      method: initialPost ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Unable to save the post");
      return;
    }
    if (!initialPost) {
      router.replace(`/admin/blog/${data.post.id}`);
      router.refresh();
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function remove() {
    if (!initialPost || !window.confirm("Delete this blog post permanently?")) return;
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/blog/${initialPost.id}`, { method: "DELETE" });
    if (response.ok) {
      router.replace("/admin/blog");
      router.refresh();
      return;
    }
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setError(data.error || "Unable to delete the post");
  }

  return (
    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col bg-paper">
      <AppBar title={initialPost ? (adminLanguage === "th" ? "แก้ไขบทความ" : "Edit post") : (adminLanguage === "th" ? "สร้างบทความ" : "New post")} right={<LogoutButton />} />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto max-w-4xl space-y-5">
          <Link href="/admin/blog" className="inline-flex min-h-[44px] items-center font-bold text-tealdeep">← {adminLanguage === "th" ? "บทความทั้งหมด" : "All posts"}</Link>

          <section className="grid gap-4 rounded-lg border border-line bg-card p-4 sm:grid-cols-2">
            <Field label={adminLanguage === "th" ? "หมวดหมู่" : "Category"}>
              <select className="field" value={form.category} onChange={(event) => update("category", event.target.value as BlogPostInput["category"])}>
                {BLOG_CATEGORIES.map((category) => <option key={category} value={category}>{BLOG_CATEGORY_LABELS[category][adminLanguage]}</option>)}
              </select>
            </Field>
            <Field label="URL slug">
              <div className="flex items-center rounded-xl border border-line bg-white pl-3 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/40">
                <span className="text-sm text-meta">/blog/</span>
                <input className="min-h-[48px] min-w-0 flex-1 bg-transparent px-1 pr-3 outline-none" value={form.slug} onChange={(event) => update("slug", normalizeBlogSlug(event.target.value))} required />
              </div>
            </Field>
            <Field label={adminLanguage === "th" ? "URL รูปหน้าปก" : "Cover image URL"} wide>
              <input type="url" className="field" value={form.coverImageUrl} onChange={(event) => update("coverImageUrl", event.target.value)} placeholder="https://..." />
            </Field>
          </section>

          <div className="grid grid-cols-2 rounded-lg border border-line bg-card p-1">
            {(["th", "en"] as BlogLanguage[]).map((item) => (
              <button key={item} type="button" onClick={() => setLanguage(item)} className={`min-h-[44px] rounded-md font-extrabold ${language === item ? "bg-brown text-cream" : "text-meta"}`}>
                {item === "th" ? "ภาษาไทย" : "English"} · {form[item === "th" ? "publishedTh" : "publishedEn"] ? "LIVE" : "DRAFT"}
              </button>
            ))}
          </div>

          <section className="space-y-4 rounded-lg border border-line bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <h2 className="text-xl font-extrabold text-ink">{language === "th" ? "เนื้อหาภาษาไทย" : "English content"}</h2>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-line px-3 font-bold">
                <input type="checkbox" className="h-5 w-5 accent-tealdeep" checked={form[publishedKey]} onChange={(event) => update(publishedKey, event.target.checked)} />
                {language === "th" ? "เผยแพร่ภาษาไทย" : "Publish English"}
              </label>
            </div>
            <Field label={language === "th" ? "ชื่อบทความ" : "Post title"}>
              <input className="field" maxLength={160} value={form[titleKey]} onChange={(event) => update(titleKey, event.target.value)} onBlur={() => { if (!form.slug && language === "en") update("slug", normalizeBlogSlug(form.titleEn)); }} />
            </Field>
            <Field label={language === "th" ? "คำโปรย" : "Summary"}>
              <textarea className="field min-h-[100px] resize-y" maxLength={420} value={form[summaryKey]} onChange={(event) => update(summaryKey, event.target.value)} />
            </Field>
            <Field label={language === "th" ? "เนื้อหาบทความ (Markdown)" : "Article (Markdown)"}>
              <textarea className="field min-h-[420px] resize-y font-mono text-[15px] leading-relaxed" value={form[bodyKey]} onChange={(event) => update(bodyKey, event.target.value)} />
            </Field>
            <Field label={language === "th" ? "คำอธิบายรูปหน้าปก" : "Cover image alt text"}>
              <input className="field" maxLength={240} value={form[altKey]} onChange={(event) => update(altKey, event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO title">
                <input className="field" maxLength={120} value={form[seoTitleKey]} onChange={(event) => update(seoTitleKey, event.target.value)} />
              </Field>
              <Field label="SEO description">
                <textarea className="field min-h-[96px] resize-y" maxLength={320} value={form[seoDescriptionKey]} onChange={(event) => update(seoDescriptionKey, event.target.value)} />
              </Field>
            </div>
            {initialPost && form[publishedKey] && form.slug && (
              <a className="inline-flex min-h-[44px] items-center font-bold text-tealdeep underline" href={`${language === "en" ? "/EN" : ""}/blog/${form.slug}`} target="_blank" rel="noreferrer">
                {language === "th" ? "เปิดบทความที่เผยแพร่" : "View published post"} ↗
              </a>
            )}
          </section>

          {error && <p role="alert" className="rounded-lg bg-dangerbg p-3 font-semibold text-danger">{error}</p>}
          {saved && <p role="status" className="rounded-lg bg-okbg p-3 font-semibold text-ok">{adminLanguage === "th" ? "บันทึกแล้ว" : "Post saved"}</p>}
          {initialPost && <button type="button" onClick={remove} disabled={busy} className="min-h-[48px] rounded-lg border border-danger px-4 font-bold text-danger disabled:opacity-40">{adminLanguage === "th" ? "ลบบทความ" : "Delete post"}</button>}
        </div>
      </div>
      <div className="border-t border-line bg-paper/95 p-3 backdrop-blur sm:p-4">
        <button type="submit" disabled={busy} className="btn-primary mx-auto max-w-4xl">{busy ? t("loading") : t("save")}</button>
      </div>
    </form>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-1 block text-sm font-bold text-meta">{label}</span>{children}</label>;
}

function pickEditable(post: BlogPost): BlogPostInput {
  return {
    slug: post.slug,
    category: post.category,
    titleTh: post.titleTh,
    summaryTh: post.summaryTh,
    bodyTh: post.bodyTh,
    seoTitleTh: post.seoTitleTh,
    seoDescriptionTh: post.seoDescriptionTh,
    titleEn: post.titleEn,
    summaryEn: post.summaryEn,
    bodyEn: post.bodyEn,
    seoTitleEn: post.seoTitleEn,
    seoDescriptionEn: post.seoDescriptionEn,
    coverImageUrl: post.coverImageUrl,
    coverImageAltTh: post.coverImageAltTh,
    coverImageAltEn: post.coverImageAltEn,
    publishedTh: post.publishedTh,
    publishedEn: post.publishedEn,
  };
}
