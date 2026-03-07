"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, AuthResult } from "@/app/actions/auth";
import { Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<
    AuthResult | null,
    FormData
  >(async (_prevState, formData) => {
    return await signIn(formData);
  }, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">管理者ログイン</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            管理者アカウントでログインしてください
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          {state && !state.success && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="size-4" />
                メールアドレス
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="size-4" />
                パスワード
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              "ログイン"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
