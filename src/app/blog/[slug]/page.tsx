import type { Metadata } from "next";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { getPublishedBlogPost, localizedPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/landing/site";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug, "th");
  if (!post) return { title: "ไม่พบบทความ", robots: { index: false, follow: false } };
  const content = localizedPost(post, "th");
  const title = content.seoTitle || `${content.title} | Siamese Cat Creative Club`;
  const description = content.seoDescription || content.summary;
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const languages: Record<string, string> = { th: canonical, "x-default": canonical };
  if (post.publishedEn) languages.en = `${SITE_URL}/EN/blog/${post.slug}`;
  const image = post.coverImageUrl || (post.category === "kid-learning-material" ? "/landing/kids-art-and-crayon-creative-studio-1200.webp" : "/landing/supervised-indoor-childrens-playroom-bangkok-1200.webp");
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: { type: "article", title, description, url: canonical, locale: "th_TH", publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(), images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ThaiBlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogArticle language="th" slug={slug} />;
}
