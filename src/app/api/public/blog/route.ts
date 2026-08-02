import { NextResponse } from "next/server";
import { getPublishedBlogPosts, localizedPost, BLOG_CATEGORY_LABELS, type BlogLanguage } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const language: BlogLanguage = new URL(request.url).searchParams.get("language") === "en" ? "en" : "th";

  try {
    const posts = await getPublishedBlogPosts(language);
    return NextResponse.json(
      {
        posts: posts.map((post) => {
          const content = localizedPost(post, language);
          return {
            slug: post.slug,
            category: post.category,
            categoryLabel: BLOG_CATEGORY_LABELS[post.category][language],
            title: content.title,
            summary: content.summary,
            coverImageUrl: post.coverImageUrl,
            coverImageAlt: content.coverImageAlt,
            publishedAt: post.publishedAt?.toISOString() ?? null,
          };
        }),
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Public blog feed failed", error);
    return NextResponse.json({ error: "Unable to load articles" }, { status: 500 });
  }
}
