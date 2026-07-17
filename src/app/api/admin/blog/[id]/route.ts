import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, blogPosts } from "@/db/schema";
import { requireAdminId } from "@/lib/auth";
import { BlogValidationError, parseBlogPostInput } from "@/lib/blog";
import { blogApiError } from "@/lib/blog-api";

function postId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new BlogValidationError("Invalid post id");
  return id;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminId();
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, postId(params.id))).limit(1);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    return blogApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdminId();
    const id = postId(params.id);
    const input = parseBlogPostInput(await request.json().catch(() => null));
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const now = new Date();
    const [post] = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(blogPosts)
        .set({
          ...input,
          publishedAt: existing.publishedAt ?? (input.publishedTh || input.publishedEn ? now : null),
          updatedAt: now,
        })
        .where(eq(blogPosts.id, id))
        .returning();
      await tx.insert(auditLog).values({
        adminId: adminId > 0 ? adminId : null,
        action: "blog_post_updated",
        entity: "blog_post",
        entityId: id,
        detail: {
          slug: updated.slug,
          category: updated.category,
          publishedTh: updated.publishedTh,
          publishedEn: updated.publishedEn,
        },
      });
      return [updated];
    });
    return NextResponse.json({ post });
  } catch (error) {
    return blogApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdminId();
    const id = postId(params.id);
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    await db.transaction(async (tx) => {
      await tx.insert(auditLog).values({
        adminId: adminId > 0 ? adminId : null,
        action: "blog_post_deleted",
        entity: "blog_post",
        entityId: id,
        detail: { slug: existing.slug, category: existing.category },
      });
      await tx.delete(blogPosts).where(eq(blogPosts.id, id));
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return blogApiError(error);
  }
}
