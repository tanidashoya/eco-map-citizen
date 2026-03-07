import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase セッションの更新処理
 * middleware.ts から呼び出される
 *
 * 役割:
 * 1. Auth トークンのリフレッシュ（getUser()で自動更新）
 * 2. リフレッシュされたトークンをServer Componentsに渡す
 * 3. リフレッシュされたトークンをブラウザに渡す
 */
export async function updateSession(request: NextRequest) {
  //最終的に返すレスポンスオブジェクトを用意
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // リクエストのCookieを更新
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // レスポンスを再作成
          supabaseResponse = NextResponse.next({ request });
          // レスポンスのCookieを更新
          //CookieToSetとはsupabaseが用意するCookieの配列
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() でトークンを検証・リフレッシュ
  // 注意: getSession() は使わない（トークンの再検証が保証されないため）
  //getUser() は、createServerClient に渡した getAll と setAll を内部で使
  await supabase.auth.getUser();

  return supabaseResponse;
}
