import { handleBlogPublishingRequest } from "@/lib/blog-publishing-api";

export async function POST(request: Request) {
  return handleBlogPublishingRequest(request, "th");
}
