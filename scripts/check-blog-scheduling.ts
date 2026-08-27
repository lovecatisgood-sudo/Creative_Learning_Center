import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { blogPosts } from "../src/db/schema";
import { publishedBlogVisibilityFilter } from "../src/lib/blog-publication";

const dialect = new PgDialect();
const cutoff = new Date("2026-08-28T00:00:00.000Z");
const filter = publishedBlogVisibilityFilter(blogPosts.publishedEn, cutoff);
const query = dialect.sqlToQuery(filter!);

assert.match(query.sql, /published_en/);
assert.match(query.sql, /published_at/);
assert.match(query.sql, /<=/);
assert.deepEqual(query.params, [true, cutoff.toISOString()]);

console.log("Blog scheduling visibility check passed.");
