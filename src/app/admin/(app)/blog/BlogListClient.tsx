"use client";

import Link from "next/link";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { BLOG_CATEGORY_LABELS, type BlogCategory } from "@/lib/blog-shared";
import { useLang } from "@/lib/i18n/LanguageProvider";

type ListPost = {
  id: number;
  slug: string;
  category: BlogCategory;
  titleTh: string;
  titleEn: string;
  publishedTh: boolean;
  publishedEn: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export function BlogListClient({ posts }: { posts: ListPost[] }) {
  const { lang, t } = useLang();
  const dateFormat = new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper">
      <AppBar title={t("navBlog")} right={<LogoutButton />} />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-ink">{lang === "th" ? "บทความทั้งหมด" : "All posts"}</h2>
              <p className="text-sm text-meta">{posts.length} {lang === "th" ? "บทความ" : posts.length === 1 ? "post" : "posts"}</p>
            </div>
            <Link href="/admin/blog/new" className="inline-flex min-h-[44px] items-center rounded-lg bg-amber px-4 font-bold text-amber-ink">
              + {lang === "th" ? "สร้างบทความ" : "New post"}
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-lg border border-line bg-card p-8 text-center text-meta">
              {lang === "th" ? "ยังไม่มีบทความ" : "No posts yet"}
            </div>
          ) : (
            <div className="grid gap-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/admin/blog/${post.id}`} className="rounded-lg border border-line bg-card p-4 shadow-sm transition hover:border-teal">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-tealdeep">{BLOG_CATEGORY_LABELS[post.category][lang]}</span>
                      <h3 className="mt-1 truncate text-lg font-extrabold text-ink">{post.titleTh || post.titleEn || post.slug}</h3>
                      {post.titleTh && post.titleEn && <p className="truncate text-sm text-meta">{post.titleEn}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <Status language="TH" published={post.publishedTh} />
                      <Status language="EN" published={post.publishedEn} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-meta">
                    <span>/{post.slug}</span>
                    <span>{lang === "th" ? "แก้ไขล่าสุด" : "Updated"} {dateFormat.format(new Date(post.updatedAt))}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Status({ language, published }: { language: string; published: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${published ? "bg-okbg text-ok" : "bg-warnbg text-warn"}`}>
      {language} {published ? "LIVE" : "DRAFT"}
    </span>
  );
}
