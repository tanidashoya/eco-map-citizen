import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Proxy (旧 Middleware)
 *
 * Supabase Auth トークンの自動リフレッシュを行う
 * これにより、ブラウザを閉じても長期間ログイン状態を維持できる
 *
 * Next.js 16 で middleware → proxy に改名
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

//matcher は 「以下のパス以外」 に proxy を実行する指定
//matcher で除外しているのは 「認証不要だから」 ではなく、「ページのリクエストではないから」
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     * - 画像ファイル (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
