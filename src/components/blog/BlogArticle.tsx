import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_CATEGORY_LABELS, getPublishedBlogPost, getPublishedBlogPosts, localizedPost, renderBlogMarkdown, type BlogLanguage } from "@/lib/blog";
import { SITE_URL } from "@/lib/landing/site";
import { PublicBlogShell } from "./PublicBlogShell";

export async function BlogArticle({ slug, language }: { slug: string; language: BlogLanguage }) {
  const post = await getPublishedBlogPost(slug, language);
  if (!post) notFound();
  const content = localizedPost(post, language);
  const prefix = language === "en" ? "/EN" : "";
  const otherPublished = language === "th" ? post.publishedEn : post.publishedTh;
  const alternateHref = otherPublished ? `${language === "th" ? "/EN" : ""}/blog/${post.slug}` : `${language === "th" ? "/EN" : ""}/blog`;
  const dateFormat = new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", { dateStyle: "long", timeZone: "Asia/Bangkok" });
  const related = (await getPublishedBlogPosts(language, post.category)).filter((item) => item.id !== post.id).slice(0, 3);
  const canonicalUrl = `${SITE_URL}${prefix}/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: content.title,
    description: content.seoDescription || content.summary,
    image: post.coverImageUrl ? absoluteUrl(post.coverImageUrl) : `${SITE_URL}/landing/og-siamese-cat-creative-club.jpg`,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: language,
    articleSection: BLOG_CATEGORY_LABELS[post.category][language],
    mainEntityOfPage: canonicalUrl,
    author: { "@type": "Organization", name: "Siamese Cat Creative Club", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Siamese Cat Cafe Co., Ltd. (Thailand)",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/main-site/assets/logo-circle.webp` },
    },
  };

  return (
    <PublicBlogShell language={language} alternateHref={alternateHref}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <article>
        <header className="section blog-article-header">
          <div className="narrow">
            <nav className="blog-breadcrumb" aria-label={language === "th" ? "เส้นทางนำทาง" : "Breadcrumb"}><Link href={`${prefix}/blog`}>{language === "th" ? "บล็อก" : "Blog"}</Link><span aria-hidden="true">/</span><Link href={`${prefix}/blog?category=${post.category}`}>{BLOG_CATEGORY_LABELS[post.category][language]}</Link></nav>
            <span className="eyebrow">{BLOG_CATEGORY_LABELS[post.category][language]}</span>
            <h1>{content.title}</h1>
            <p className="kicker">{content.summary}</p>
            {post.publishedAt && <time className="blog-published" dateTime={post.publishedAt.toISOString()}>{language === "th" ? "เผยแพร่เมื่อ" : "Published"} {dateFormat.format(post.publishedAt)}</time>}
          </div>
        </header>
        {post.coverImageUrl && <div className="container blog-cover"><img src={post.coverImageUrl} alt={content.coverImageAlt} fetchPriority="high" /></div>}
        <section className="section compact paper">
          <div className="narrow blog-prose" dangerouslySetInnerHTML={{ __html: renderBlogMarkdown(content.body) }} />
        </section>
      </article>

      <section className="section fawn">
        <div className="container">
          <div className="cta-band">
            <div><h2>{language === "th" ? "มีคำถามเกี่ยวกับโปรแกรมของเรา?" : "Questions about our programs?"}</h2><p className="muted">{language === "th" ? "ส่งคำถามถึงทีมงานเพื่อเลือกโปรแกรมและช่วงเวลาที่เหมาะกับครอบครัว" : "Contact our team to find the right program and schedule for your family."}</p></div>
            <div className="cta-actions"><Link className="btn btn-light" href={`${prefix}/contact`}>{language === "th" ? "ติดต่อเรา" : "Contact Us"}</Link></div>
          </div>
        </div>
      </section>

      {related.length > 0 && <section className="section paper"><div className="container"><div className="section-head"><span className="eyebrow">{language === "th" ? "อ่านต่อ" : "Keep reading"}</span><h2>{language === "th" ? "บทความที่เกี่ยวข้อง" : "Related articles"}</h2></div><div className="blog-related-grid">{related.map((item) => { const itemContent = localizedPost(item, language); return <article key={item.id} className="blog-related-card"><span>{BLOG_CATEGORY_LABELS[item.category][language]}</span><h3><Link href={`${prefix}/blog/${item.slug}`}>{itemContent.title}</Link></h3><p>{itemContent.summary}</p><Link className="text-link" href={`${prefix}/blog/${item.slug}`}>{language === "th" ? "อ่านบทความ" : "Read article"} →</Link></article>; })}</div></div></section>}
    </PublicBlogShell>
  );
}

function absoluteUrl(value: string): string {
  return value.startsWith("/") ? `${SITE_URL}${value}` : value;
}
