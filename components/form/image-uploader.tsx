"use client";

// components/form/image-uploader.tsx
//
// 役割: 画像1枚の選択・プレビュー・削除・撮り直しUIを担当
// 状態は親（submit-form.tsx）が持ち、このコンポーネントはUIのみ

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageUploaderProps } from "@/types/form";

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/heic,image/heif";

// ----------------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------------

export function ImageUploader({
  image,
  disabled = false,
  onImageChange,
}: ImageUploaderProps) {
  //ファイルインプットの参照（画像データ自体はstateで保持しているのでfile input をクリックさせるためにある）
  //このfileInputRefをクリックすると、ファイル選択ダイアログが表示される
  //fileInputRef.current?.click()でプログラムから参照が渡されている要素（ここではinput要素）の click() メソッドを呼び出している
  const fileInputRef = useRef<HTMLInputElement>(null);

  //ファイル選択時のイベントハンドラ（投稿される画像が変更されるときに実行される）
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`ファイルサイズは ${MAX_FILE_SIZE_MB}MB 以内にしてください`);
      return;
    }

    // 既存プレビューのメモリを解放してから新しいURLを生成
    //１．以前作ったプレビュー用URLを破棄する
    //２．新しいファイルからプレビュー用URLを作る
    //URL.revokeObjectURL(image.previewUrl)：以前作ったプレビュー用URLを破棄する
    //URL.createObjectURL(file)：新しいファイルからプレビュー用URLを作る(このFileオブジェクトを、ブラウザ内だけで使える一時URLに変換する)
    if (image) URL.revokeObjectURL(image.previewUrl);
    onImageChange({ previewUrl: URL.createObjectURL(file), file });

    // 同じファイルを再選択できるよう input要素のvalue をリセット（もうファイルは変数fileに格納した後、状態imageに保管したので）
    e.target.value = "";
  };

  //画像削除ボタンのイベントハンドラ
  const handleRemove = () => {
    //１．以前作ったプレビュー用URLを破棄する
    if (image) URL.revokeObjectURL(image.previewUrl);
    //２．投稿される画像をnullにする
    onImageChange(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        写真 <span className="text-destructive">*</span>
      </Label>

      {image ? (
        /* プレビュー表示 */
        <div className="relative w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt="プレビュー"
            className="aspect-video w-full object-cover"
          />
          {/* 削除ボタン */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="画像を削除"
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
          >
            <X className="size-4" />
          </button>
          {/* 撮り直しボタン */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/80"
          >
            撮り直す
          </button>
        </div>
      ) : (
        /* 初期状態：ドロップゾーン風ボタン */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-10 text-muted-foreground transition-colors hover:bg-muted"
        >
          <ImagePlus className="size-8" />
          <span className="text-sm">タップして写真を選ぶ</span>
          <span className="text-xs opacity-70">JPEG / PNG / HEIC</span>
        </button>
      )}

      {/* 非表示のファイルインプット */}
      {/* 👉 hidden は「見えなくする」
          👉 ref は「触れるようにする」
          👉 accept は「ファイルの種類を指定する」
          👉 onChange は「ファイルが選択された時に実行される」 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
