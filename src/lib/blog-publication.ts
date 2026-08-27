import { and, eq, lte } from "drizzle-orm";
import { blogPosts } from "@/db/schema";

type PublishedColumn = typeof blogPosts.publishedTh | typeof blogPosts.publishedEn;

/** A published flag is necessary, but a post only becomes public at its scheduled timestamp. */
export function publishedBlogVisibilityFilter(publishedColumn: PublishedColumn, now = new Date()) {
  return and(eq(publishedColumn, true), lte(blogPosts.publishedAt, now));
}
