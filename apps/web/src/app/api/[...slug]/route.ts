import type { NextRequest } from "next/server";
import { SERVER_API_URL } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPPED_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
]);

type RouteContext = { params: Promise<{ slug: string[] }> };

async function forward(
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const { slug } = await params;
  const target = new URL(`${SERVER_API_URL}/api/${slug.join("/")}`);
  target.search = req.nextUrl.search;

  const headers = new Headers();
  for (const [key, value] of req.headers) {
    if (!STRIPPED_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "Bad Gateway", message: "The Forge API is unreachable." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers) {
    if (STRIPPED_HEADERS.has(key.toLowerCase())) continue;
    responseHeaders.append(key, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
  forward as HEAD,
  forward as OPTIONS,
};
