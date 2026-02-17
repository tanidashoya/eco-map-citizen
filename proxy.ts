// proxy.ts (Next.js 16: middleware.ts から移行)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  console.log("[proxy] path:", request.nextUrl.pathname);

  const authHeader = request.headers.get("authorization");
  console.log("[proxy] authHeader:", authHeader ? "あり" : "なし");

  if (authHeader) {
    try {
      const [, credentials] = authHeader.split(" ");
      const decoded = atob(credentials);
      const [username, password] = decoded.split(":");

      if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
      ) {
        console.log("[proxy] 認証成功");
        return NextResponse.next();
      }
      console.log("[proxy] 認証失敗: credentials mismatch");
    } catch (e) {
      console.error("[proxy] デコードエラー:", e);
    }
  }

  console.log("[proxy] 401を返却");
  return new NextResponse("認証が必要です", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
