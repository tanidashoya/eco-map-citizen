// app/submit/page.tsx
//
// 役割: レイアウトを組んで SubmitForm を置くだけ
// ロジックはすべて submit-form.tsx に閉じている

import { SubmitForm } from "@/components/form/submit-form";
import { ArrowLeft, Leaf } from "lucide-react";
import Link from "next/link";

export default function SubmitPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* ヘッダー：戻るボタン + タイトル */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-lg lg:max-w-2xl items-center gap-3 px-4">
          <Link
            href="/"
            aria-label="マップに戻る"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="size-6" />
            <Leaf className="size-5 text-green-600" />
            <span className="font-semibold">環境マップに戻る</span>
          </Link>
        </div>
      </header>

      {/* メイン：フォームを中央寄せで表示 */}
      <main className="mx-auto max-w-lg lg:max-w-2xl px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-4">自然環境の写真を投稿</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            撮影した自然や生物の写真を投稿してください。
            <br />
            GPS情報付きの写真は地図に自動で反映されます。
            <br />
            ※地図上の反映には１週間程度かかります。
            <br />
            ※私有地や撮影禁止場所の写真投稿はお控えください。
          </p>
        </div>

        {/*
          フォーム本体
          項目: 画像（必須）・名前・お住まいの地域・生年月日・コメント・同意（必須）
          詳細は components/submit-form.tsx を参照
        */}
        <SubmitForm />
      </main>
    </div>
  );
}
