import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, blogPosts } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { parseBlogPostInput } from "@/lib/blog";
import { blogApiError } from "@/lib/blog-api";

export async function GET() {
  try {
    await requireManager();
    const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
    return NextResponse.json({ posts });
  } catch (error) {
    return blogApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const manager = await requireManager();
    const input = parseBlogPostInput(await request.json().catch(() => null));
    const now = new Date();
    const [post] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(blogPosts)
        .values({
          ...input,
          publishedAt: input.publishedTh || input.publishedEn ? now : null,
          updatedAt: now,
        })
        .returning();
      await tx.insert(auditLog).values({
        adminId: manager.id > 0 ? manager.id : null,
        action: "blog_post_created",
        entity: "blog_post",
        entityId: created.id,
        detail: { slug: created.slug, category: created.category },
      });
      return [created];
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return blogApiError(error);
  }
}
