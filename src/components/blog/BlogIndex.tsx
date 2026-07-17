import Link from "next/link";
import { BLOG_CATEGORIES, BLOG_CATEGORY_LABELS, getPublishedBlogPosts, localizedPost, type BlogCategory, type BlogLanguage } from "@/lib/blog";
import { PublicBlogShell } from "./PublicBlogShell";

export async function BlogIndex({ language, category }: { language: BlogLanguage; category?: string }) {
  const selectedCategory = BLOG_CATEGORIES.includes(category as BlogCategory) ? category as BlogCategory : undefined;
  const posts = await getPublishedBlogPosts(language, selectedCategory);
  const prefix = language === "en" ? "/EN" : "";
  const dateFormat = new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", { dateStyle: "long", timeZone: "Asia/Bangkok" });

  return (
    <PublicBlogShell language={language} alternateHref={`${language === "th" ? "/EN" : ""}/blog${selectedCategory ? `?category=${selectedCategory}` : ""}`}>
      <section className="section blog-hero">
        <div className="container blog-hero-inner">
          <div>
            <span className="eyebrow">{language === "th" ? "บทความจากคลับ" : "From the club"}</span>
            <h1>{language === "th" ? "บล็อกสำหรับครอบครัว" : "The family blog"}</h1>
            <p className="kicker">{language === "th" ? "คู่มือสำหรับผู้ปกครอง สื่อการเรียนรู้สำหรับเด็ก ข่าวสารจากคลับ และคำตอบที่ช่วยให้ครอบครัววางแผนได้ง่ายขึ้น" : "Parenting guidance, learning materials, club updates and clear answers to help families plan with confidence."}</p>
          </div>
          <div className="blog-hero-note">
            <strong>Siamese Cat Creative Club</strong>
            <span>{language === "th" ? "เรียนรู้ เล่น และเติบโตไปด้วยกัน" : "Learn, play and grow together"}</span>
          </div>
        </div>
      </section>

      <nav className="blog-categories" aria-label={language === "th" ? "หมวดหมู่บทความ" : "Blog categories"}>
        <div className="container">
          <Link className={!selectedCategory ? "active" : ""} href={`${prefix}/blog`}>{language === "th" ? "ทั้งหมด" : "All"}</Link>
          {BLOG_CATEGORIES.map((item) => <Link key={item} className={selectedCategory === item ? "active" : ""} href={`${prefix}/blog?category=${item}`}>{BLOG_CATEGORY_LABELS[item][language]}</Link>)}
        </div>
      </nav>

      <section className="section paper">
        <div className="container">
          <div className="blog-list-heading">
            <div>
              <span className="eyebrow">{selectedCategory ? BLOG_CATEGORY_LABELS[selectedCategory][language] : language === "th" ? "บทความล่าสุด" : "Latest posts"}</span>
              <h2>{selectedCategory ? BLOG_CATEGORY_LABELS[selectedCategory][language] : language === "th" ? "อ่านเรื่องล่าสุดจากเรา" : "Latest from our team"}</h2>
            </div>
            {selectedCategory === "faq" && <Link className="btn btn-secondary" href={`${prefix}/faq`}>{language === "th" ? "ดู FAQ หลัก" : "View main FAQ"}</Link>}
          </div>

          {posts.length === 0 ? (
            <div className="blog-empty">
              <h3>{language === "th" ? "กำลังเตรียมบทความใหม่" : "New articles are on the way"}</h3>
              <p>{language === "th" ? "ติดตามคำแนะนำและข่าวสารจาก Siamese Cat Creative Club ได้ที่หน้านี้" : "Parenting resources and club updates will be published here."}</p>
              {selectedCategory && <Link className="text-link" href={`${prefix}/blog`}>{language === "th" ? "ดูทุกหมวดหมู่" : "Browse all categories"}</Link>}
            </div>
          ) : (
            <div className="blog-grid">
              {posts.map((post) => {
                const content = localizedPost(post, language);
                return (
                  <article className="blog-card" key={post.id}>
                    {post.coverImageUrl ? <Link className="blog-card-image" href={`${prefix}/blog/${post.slug}`}><img src={post.coverImageUrl} alt={content.coverImageAlt} loading="lazy" decoding="async" /></Link> : <div className={`blog-card-placeholder category-${post.category}`} aria-hidden="true"><span>{BLOG_CATEGORY_LABELS[post.category][language]}</span></div>}
                    <div className="blog-card-content">
                      <div className="blog-card-meta"><span>{BLOG_CATEGORY_LABELS[post.category][language]}</span>{post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{dateFormat.format(post.publishedAt)}</time>}</div>
                      <h3><Link href={`${prefix}/blog/${post.slug}`}>{content.title}</Link></h3>
                      <p>{content.summary}</p>
                      <Link className="text-link" href={`${prefix}/blog/${post.slug}`}>{language === "th" ? "อ่านบทความ" : "Read article"} →</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicBlogShell>
  );
}
