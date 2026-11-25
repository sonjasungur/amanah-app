import { NextResponse, type NextRequest } from "next/server";
import { robotsHeaderFor } from "@/lib/seo/indexing";

/**
 * Next.js 16 Proxy (formerly Middleware), Node.js runtime, so the switch is read at request time.
 * Only sets the X-Robots-Tag header; access control stays in the pages and API routes.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const robots = robotsHeaderFor(request.nextUrl.pathname);
  if (robots) response.headers.set("X-Robots-Tag", robots);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
