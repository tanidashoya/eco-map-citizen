"use client";

// components/submit-form.tsx
//
// 役割: フォーム全体の状態管理・バリデーション・送信処理
// 画像撮影UIは CameraCapture に委譲

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
import { CameraCapture } from "@/components/camera-capture";
import { CapturedImage } from "@/types/form";
import { ADDRESS_OPTIONS } from "@/lib/constants/prefectures";
import { submitPost, SubmitPostResult } from "@/app/actions/action-submit-post";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Leaf, Mountain } from "lucide-react";

// カテゴリの選択肢
const CATEGORY_OPTIONS = [
  { value: "景観", label: "景観", icon: Mountain },
  { value: "生物", label: "生物", icon: Leaf },
] as const;

export function SubmitForm() {
  // 撮影した画像と位置情報を保持
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(
    null,
  );
  const [category, setCategory] = useState<string>(""); // カテゴリ選択
  const [agreed, setAgreed] = useState(false);
  const [address, setAddress] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // useActionStateでServer Actionの状態を管理
  const [, formAction, isPending] = useActionState<
    SubmitPostResult | null,
    FormData
  >(async (_prevState, formData) => {
    try {
      // クライアント側バリデーション
      if (!category) {
        toast.error("カテゴリを選択してください");
        return { success: false, message: "カテゴリを選択してください" };
      }
      if (!capturedImage) {
        toast.error("写真を撮影してください");
        return { success: false, message: "写真を撮影してください" };
      }
      if (!capturedImage.location) {
        toast.error("位置情報が取得できていません。再度撮影してください。");
        return { success: false, message: "位置情報が取得できていません" };
      }
      if (!agreed) {
        toast.error("利用規約への同意が必要です");
        return { success: false, message: "利用規約への同意が必要です" };
      }

      // デバッグ用：送信データの確認
      console.log("送信データ:", {
        category,
        fileSize: capturedImage.file.size,
        fileName: capturedImage.file.name,
        location: capturedImage.location,
        capturedAt: capturedImage.capturedAt,
      });

      // カテゴリ、画像、位置情報、撮影時間を追加
      formData.append("category", category);
      formData.append("image", capturedImage.file);
      formData.append("latitude", capturedImage.location.lat.toString());
      formData.append("longitude", capturedImage.location.lng.toString());
      formData.append("capturedAt", capturedImage.capturedAt);

      // Server Actionを呼び出し
      const result = await submitPost(formData);

      if (result.success) {
        toast.success(result.message);
        // フォームリセット
        formRef.current?.reset();
        setCapturedImage(null);
        setCategory("");
        setAgreed(false);
        setAddress("");
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (error) {
      console.error("送信エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      toast.error(`送信に失敗しました: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }, null);

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {/* カテゴリ選択（ラジオボタン） */}
      <div className="space-y-3">
        <Label className="text-base font-medium">
          カテゴリ <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={category}
          onValueChange={setCategory}
          disabled={isPending}
          className="flex gap-4"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                category === option.value
                  ? "bg-green-500/10 border-green-500"
                  : "border-border bg-muted/30 hover:bg-muted"
              } ${isPending ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="sr-only"
              />
              <option.icon
                className={`size-5 ${
                  category === option.value
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  category === option.value ? "text-primary" : ""
                }`}
              >
                {option.label}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* カメラ撮影（CameraCaptureに委譲） */}
      <CameraCapture
        capturedImage={capturedImage}
        disabled={isPending}
        onCapture={setCapturedImage}
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
          </Label>
        </div>
      </div>

      {/* 送信ボタン */}
      <Button
        type="submit"
        disabled={
          isPending ||
          !agreed ||
          !category ||
          !capturedImage ||
          !capturedImage.location
        }
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
