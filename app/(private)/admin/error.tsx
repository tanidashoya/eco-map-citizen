"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * 管理者画面のエラーバウンダリ
 * データ取得失敗時などに表示される
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("マップデータの取得に失敗しました", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-3 text-destructive">
        <AlertTriangle className="size-10" />
        <h2 className="text-xl font-bold">エラーが発生しました</h2>
      </div>

      <p className="text-center text-muted-foreground">
        データの取得に失敗しました。
        <br />
        ネットワーク接続を確認して、再度お試しください。
      </p>

      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="size-4" />
        再読み込み
      </Button>
    </div>
  );
}
