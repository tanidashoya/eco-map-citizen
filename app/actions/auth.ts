"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthResult = { success: true } | { success: false; error: string };

/**
 * メール/パスワードでログイン
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      success: false,
      error: "メールアドレスとパスワードを入力してください",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error.message);
    return {
      success: false,
      error: "ログインに失敗しました。認証情報を確認してください。",
    };
  }

  redirect("/admin");
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * 現在のセッションを取得
 */
export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
