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
  const fallbackCover = post.category === "kid-learning-material"
    ? "/landing/kids-art-and-crayon-creative-studio-1200.webp"
    : post.category === "faq"
      ? "/landing/cozy-family-lounge-area-1200.webp"
      : "/landing/supervised-indoor-childrens-playroom-bangkok-1200.webp";
  const coverUrl = post.coverImageUrl || fallbackCover;
  const coverAlt = content.coverImageAlt || (language === "th" ? "พื้นที่กิจกรรมจริงภายใน Siamese Cat Creative Club บางแก้ว" : "Real activity space inside Siamese Cat Creative Club in Bang Kaeo");
  const categoryCta = post.category === "kid-learning-material"
    ? { path: "/playgroup", thTitle: "อยากให้ลูกมีเวลาเล่นและสร้างสรรค์?", enTitle: "Looking for time to play and create?", thAction: "ดู Little Explorer Playgroup", enAction: "See Little Explorer Playgroup" }
    : post.category === "faq"
      ? { path: "/creative", thTitle: "ต้องการตัวช่วยช่วงหลังเลิกเรียน?", enTitle: "Need help covering the after-school gap?", thAction: "ดู After School Explorer", enAction: "See After School Explorer" }
      : post.category === "club-news-updates"
        ? { path: "/inside", thTitle: "ดูพื้นที่ที่เด็กใช้เวลาจริง", enTitle: "See where children actually spend their time", thAction: "ดูภายในคลับ", enAction: "See inside the club" }
        : { path: "/contact", thTitle: "ยังไม่แน่ใจว่าเซสชันไหนเหมาะ?", enTitle: "Not sure which session fits?", thAction: "ถามทีมงาน", enAction: "Ask the team" };
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "BlogPosting",
      headline: content.title,
      description: content.seoDescription || content.summary,
      image: absoluteUrl(coverUrl),
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      inLanguage: language,
      articleSection: BLOG_CATEGORY_LABELS[post.category][language],
      mainEntityOfPage: canonicalUrl,
      author: { "@type": "Organization", name: "Siamese Cat Creative Club Team", url: `${SITE_URL}${prefix}/about` },
      publisher: {
        "@type": "Organization",
        name: "Siamese Cat Cafe Co., Ltd. (Thailand)",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/main-site/assets/logo-circle.webp` },
      },
    }, {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: language === "th" ? "หน้าหลัก" : "Home", item: `${SITE_URL}${prefix || "/"}` },
        { "@type": "ListItem", position: 2, name: language === "th" ? "บล็อก" : "Blog", item: `${SITE_URL}${prefix}/blog` },
        { "@type": "ListItem", position: 3, name: content.title, item: canonicalUrl },
      ],
    }],
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
            <p className="blog-byline">{language === "th" ? "เขียนและตรวจสอบโดย" : "Written and reviewed by"} <Link href={`${prefix}/about`}>Siamese Cat Creative Club Team</Link></p>
            {post.publishedAt && <time className="blog-published" dateTime={post.publishedAt.toISOString()}>{language === "th" ? "เผยแพร่เมื่อ" : "Published"} {dateFormat.format(post.publishedAt)}</time>}
          </div>
        </header>
        <div className="container blog-cover"><img src={coverUrl} alt={coverAlt} fetchPriority="high" /></div>
        <section className="section compact paper">
          <div className="narrow blog-prose">
            <aside className="card soft-mint">
              <h2>{language === "th" ? "มุมมองจากคลับ" : "From the club"}</h2>
              <p>{language === "th" ? "บทความนี้เชื่อมคำแนะนำเข้ากับกิจวัตรที่เด็กทำได้จริงในพื้นที่ของเรา เช่น เวลาเปลี่ยนผ่านหลังเลิกเรียน การอ่าน การเล่นอิสระ งานสร้างสรรค์ และเวลาสงบ เราแยกข้อสังเกตจากการให้บริการออกจากคำแนะนำด้านสุขภาพหรือพัฒนาการที่ต้องมีแหล่งอ้างอิง" : "This guide connects advice to routines children can actually use in our space: after-school transitions, reading, free play, creative work and quiet time. We keep service observations separate from health or development guidance that requires an authoritative source."}</p>
            </aside>
            <div dangerouslySetInnerHTML={{ __html: renderBlogMarkdown(content.body) }} />
          </div>
        </section>
      </article>

      <section className="section fawn">
        <div className="container">
          <div className="cta-band">
            <div><h2>{language === "th" ? categoryCta.thTitle : categoryCta.enTitle}</h2><p className="muted">{language === "th" ? "ดูข้อมูลจริง ราคา และข้อจำกัดก่อนเลือกเซสชันที่เหมาะกับครอบครัว" : "Review the practical details, prices and limitations before choosing a session."}</p></div>
            <div className="cta-actions"><Link className="btn btn-light" href={`${prefix}${categoryCta.path}`}>{language === "th" ? categoryCta.thAction : categoryCta.enAction}</Link></div>
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
