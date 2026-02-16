// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("[middleware] path:", request.nextUrl.pathname);

  const authHeader = request.headers.get("authorization");
  console.log("[middleware] authHeader:", authHeader ? "あり" : "なし");

  if (authHeader) {
    try {
      const [, credentials] = authHeader.split(" ");
      const decoded = atob(credentials);
      const [username, password] = decoded.split(":");

      if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        console.log("[middleware] 認証成功");
        return NextResponse.next();
      }
      console.log("[middleware] 認証失敗: credentials mismatch");
    } catch (e) {
      console.error("[middleware] デコードエラー:", e);
    }
  }

  console.log("[middleware] 401を返却");
  return new NextResponse("認証が必要です", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
