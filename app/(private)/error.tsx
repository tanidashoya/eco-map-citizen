"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * マップページのエラーバウンダリ
 * データ取得失敗時などに表示される
 */
export default function MapError({
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
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-3 text-destructive">
        <AlertTriangle className="size-10" />
        <h2 className="text-xl font-bold">エラーが発生しました</h2>
      </div>

      <p className="text-center text-muted-foreground">
        マップデータの取得に失敗しました。
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
