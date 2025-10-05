import { verifySession } from "@/lib/session";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Authorization header is required", { status: 400 });
  }

  const session = authHeader.split(" ")[1];
  try {
    const payload = await verifySession(session);
    if (!payload) {
      return new Response("Invalid session token", { status: 401 });
    }

    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Session verification failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
