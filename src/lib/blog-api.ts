import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth";
import { BlogValidationError } from "@/lib/blog";

export function blogApiError(error: unknown) {
  if (error instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (error instanceof BlogValidationError) return NextResponse.json({ error: error.message }, { status: 422 });
  if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already in use" }, { status: 409 });
  console.error("Blog API failed", error);
  return NextResponse.json({ error: "Unable to save the post" }, { status: 500 });
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}
