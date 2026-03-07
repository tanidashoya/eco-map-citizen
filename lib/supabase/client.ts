import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser 用の Supabase クライアント
 * Storage Upload 専用で使用する
 * DB 操作は Server Component / Server Action で行う
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
