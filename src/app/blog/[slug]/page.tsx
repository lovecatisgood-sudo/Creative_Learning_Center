import type { Metadata } from "next";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { getPublishedBlogPost, localizedPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/landing/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPublishedBlogPost(params.slug, "th");
  if (!post) return { title: "ไม่พบบทความ", robots: { index: false, follow: false } };
  const content = localizedPost(post, "th");
  const title = content.seoTitle || `${content.title} | Siamese Cat Creative Club`;
  const description = content.seoDescription || content.summary;
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const languages: Record<string, string> = { th: canonical, "x-default": canonical };
  if (post.publishedEn) languages.en = `${SITE_URL}/EN/blog/${post.slug}`;
  const image = post.coverImageUrl || "/landing/og-siamese-cat-creative-club.jpg";
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: { type: "article", title, description, url: canonical, locale: "th_TH", publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(), images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function ThaiBlogArticlePage({ params }: { params: { slug: string } }) {
  return <BlogArticle language="th" slug={params.slug} />;
}
