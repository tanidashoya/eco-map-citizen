"use client";

// components/submit-form.tsx
//
// 役割: フォーム全体の状態管理・バリデーション・送信処理
// 画像UIは ImageUploader に委譲

import { useActionState, useState, useRef } from "react";
import {
  MapPin,
  User,
  MessageSquare,
  Send,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUploader } from "@/components/image-uploader";
import { PreviewImage } from "@/types/form";
import { ADDRESS_OPTIONS } from "@/lib/constants/prefectures";
import { submitPost, SubmitPostResult } from "@/app/actions/action-submit-post";

export function SubmitForm() {
  //DOMで保持できない値を状態として保持するためのuseState
  const [image, setImage] = useState<PreviewImage | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [address, setAddress] = useState("");
  //フォームDOMに直接アクセスするための参照（アンコントロール）
  // ※現在は入力値を状態として保持せずに入力値をDOMが保持している
  // その値をformRef.current?.reset()でリセットする
  const formRef = useRef<HTMLFormElement>(null);

  // useActionStateでServer Actionの状態を管理
  //async以下がformActionの処理内容
  //useActionState は「フォーム送信に関わる非同期処理全体」に対して、状態管理・ローディング追跡・form統合を追加するフックである
  //useActionState< A, B > の
  //A = state の型
  //B = action に渡される引数の型
  //を定義している。 ⇒formActionの実行結果（stateとして保持される値）の型
  const [, formAction, isPending] = useActionState<
    SubmitPostResult | null,
    FormData
  >(async (_prevState, formData) => {
    try {
      // クライアント側バリデーション
      if (!image) {
        toast.error("写真を1枚追加してください");
        return { success: false, message: "写真を1枚追加してください" };
      }
      if (!agreed) {
        toast.error("利用規約への同意が必要です");
        return { success: false, message: "利用規約への同意が必要です" };
      }

      // 画像とタイムスタンプを追加
      formData.append("image", image.file);
      formData.append("timestamp", new Date().toISOString());

      // Server Actionを呼び出し
      const result = await submitPost(formData);

      if (result.success) {
        toast.success(result.message);
        // フォームリセット
        formRef.current?.reset();
        setImage(null);
        setAgreed(false);
        setAddress("");
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (error) {
      // エラーの詳細をコンソールに出力（デバッグ用）
      console.error("フォーム送信エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      toast.error(`送信エラー: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }, null); //useActionStateの初期値（第一引数：実行する関数（この実行する関数に_prevStateとformDataが渡される）、第二引数：初期値）

  // ---- レンダリング ----
  //actionはServer Actionを呼び出すための属性(useActionStateが定義されている場合には第2引数の関数が実行される)
  //入力欄の値をstateではなくDOMが保持しておりその値をformRef.current?.reset()でリセットする
  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {/* 画像アップロード（ImageUploaderに委譲） */}
      <ImageUploader
        image={image}
        disabled={isPending}
        onImageChange={setImage}
      />

      {/* 名前（任意） */}
      <div className="space-y-3">
        <Label
          htmlFor="name"
          className="flex items-center gap-1.5 text-base font-medium"
        >
          <User className="size-5 text-muted-foreground" />
          お名前
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            （任意）
          </span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="例：山田 太郎"
          disabled={isPending}
          maxLength={50}
        />
      </div>

      {/* お住まいの地域（任意） */}
      <div className="space-y-3">
        <Label
          htmlFor="address"
          className="flex items-center gap-1.5 text-base font-medium"
        >
          <MapPin className="size-5 text-muted-foreground" />
          お住まいの地域
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            （任意）
          </span>
        </Label>
        <Select
          name="address"
          value={address}
          onValueChange={setAddress}
          disabled={isPending}
        >
          <SelectTrigger id="address" className="text-base">
            <SelectValue placeholder="都道府県を選択" />
          </SelectTrigger>
          <SelectContent
            side="bottom"
            position="popper"
            className="max-h-80 min-w-45 overflow-y-auto"
          >
            {ADDRESS_OPTIONS.map((addr) => (
              <SelectItem key={addr} value={addr} className="text-base">
                {addr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 生年月日（任意） */}
      <div className="space-y-3">
        <Label
          htmlFor="birthdate"
          className="flex items-center gap-1.5 text-base font-medium"
        >
          <Calendar className="size-5 text-muted-foreground" />
          生年月日
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            （任意）
          </span>
        </Label>
        <Input
          id="birthdate"
          name="birthdate"
          type="date"
          disabled={isPending}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      {/* コメント（任意） */}
      <div className="space-y-3">
        <Label
          htmlFor="comment"
          className="flex items-center gap-1.5 text-base font-medium"
        >
          <MessageSquare className="size-5 text-muted-foreground" />
          この場所について一言
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            （任意）
          </span>
        </Label>
        <Textarea
          id="comment"
          name="comment"
          placeholder="気づいたことや様子を教えてください"
          disabled={isPending}
          rows={5}
          maxLength={200}
          className="resize-none"
        />
      </div>

      {/* 同意チェックボックス（必須） */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            disabled={isPending}
            className="mt-0.5"
          />
          <Label
            htmlFor="agree"
            className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
          >
            投稿された写真・情報は地域の自然環境データとして公開されます。
            個人情報の取り扱いおよび利用規約に同意の上、送信してください。
            {/* TODO: 利用規約ページのリンクを追加する */}
          </Label>
        </div>
      </div>

      {/* 送信ボタン */}
      <Button
        type="submit"
        disabled={isPending || !agreed || !image}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            送信中...
          </>
        ) : (
          <>
            <Send className="mr-2 size-4" />
            投稿する
          </>
        )}
      </Button>
    </form>
  );
}
