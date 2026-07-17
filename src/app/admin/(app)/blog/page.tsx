import { desc } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { BlogListClient } from "./BlogListClient";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
  return <BlogListClient posts={posts.map((post) => ({ ...post, publishedAt: post.publishedAt?.toISOString() ?? null, updatedAt: post.updatedAt.toISOString() }))} />;
}
