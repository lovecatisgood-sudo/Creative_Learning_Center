import { NextResponse } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/lib/auth";

export function adminApiError(error: unknown, fallback = "Request failed") {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  if (isUniqueViolation(error)) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505");
}
