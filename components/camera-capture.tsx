"use client";

// components/camera-capture.tsx
//
// 役割: カメラで撮影 + Geolocation APIで現在地を取得
// 撮影ボタン押下時に位置情報取得を開始し、撮影完了後に画像と位置情報を親に返す

import { useRef, useState } from "react";
import { Camera, X, MapPin, Loader2, CheckCircle, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CameraCaptureProps, CapturedImage, GeoLocation } from "@/types/form";

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = "image/*";
// Geolocation APIのオプション
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true, // 高精度モード（GPS優先）
  timeout: 10000, // 10秒でタイムアウト
  maximumAge: 0, // キャッシュを使わず常に最新の位置を取得
};
// サムネイル設定（メモリ節約のため小さく）
const THUMBNAIL_MAX_SIZE = 300;

// ----------------------------------------------------------------
// ユーティリティ関数
// ----------------------------------------------------------------

/**
 * プレビュー用の小さいサムネイルを作成（メモリ節約）
 * 失敗した場合はnullを返す
 */
async function createThumbnail(file: File): Promise<string | null> {
  try {
    // Blob URLを作成
    const url = URL.createObjectURL(file);

    // Imageを使って読み込み（createImageBitmapより互換性が高い）
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

    // 元のBlob URLを解放
    URL.revokeObjectURL(url);

    // サムネイルサイズを計算
    let { width, height } = img;
    const scale = Math.min(THUMBNAIL_MAX_SIZE / width, THUMBNAIL_MAX_SIZE / height, 1);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    // 小さいCanvasに描画
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(img, 0, 0, width, height);

    // Data URLを取得（小さいのでBase64でOK）
    const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.6);

    // Canvasのメモリを解放
    canvas.width = 0;
    canvas.height = 0;

    return thumbnailUrl;
  } catch (error) {
    console.warn("サムネイル作成に失敗:", error);
    return null;
  }
}

// ----------------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------------

export function CameraCapture({
  capturedImage,
  disabled = false,
  onCapture,
}: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 位置情報を取得する関数
  const getLocation = (): Promise<GeoLocation | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error("お使いのブラウザは位置情報に対応していません");
        resolve(null);
        return;
      }

      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setIsGettingLocation(false);
          resolve(location);
        },
        (error) => {
          setIsGettingLocation(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error(
                "位置情報の許可が必要です。設定から許可してください。",
              );
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("位置情報を取得できませんでした");
              break;
            case error.TIMEOUT:
              toast.error("位置情報の取得がタイムアウトしました");
              break;
          }
          resolve(null);
        },
        GEO_OPTIONS,
      );
    });
  };

  // 撮影ボタン押下時のハンドラ
  const handleCaptureClick = () => {
    // カメラをすぐに起動（位置情報は撮影直後に取得）
    fileInputRef.current?.click();
  };

  // ファイル選択（撮影完了）時のハンドラ
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`ファイルサイズは ${MAX_FILE_SIZE_MB}MB 以内にしてください`);
      return;
    }

    // 既存プレビューのメモリを解放
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }

    // 撮影直後に位置情報を取得（撮影場所をより正確に記録）
    const location = await getLocation();

    // 位置情報が取得できなかった場合は警告
    if (!location) {
      toast.warning("位置情報を取得できませんでした。再度撮影してください。");
    }

    // プレビュー用の小さいサムネイルを作成（メモリ節約）
    // サムネイル作成に失敗した場合はBlob URLを使用（メモリ消費のリスクあり）
    const thumbnailUrl = await createThumbnail(file);
    const previewUrl = thumbnailUrl ?? URL.createObjectURL(file);

    // 親コンポーネントにデータを返す
    // 画像圧縮はサーバー側（sharp）で行うため、クライアントでは元のファイルを使用
    const capturedData: CapturedImage = {
      previewUrl,
      file,
      location,
      capturedAt: new Date().toISOString(), // 撮影時刻を記録
    };
    onCapture(capturedData);

    // 同じファイルを再選択できるようリセット
    e.target.value = "";
  };

  // 削除ボタンのハンドラ
  const handleRemove = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    onCapture(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        写真 <span className="text-destructive">*</span>
      </Label>

      {capturedImage ? (
        /* 撮影後のプレビュー表示 */
        <div className="relative w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedImage.previewUrl}
            alt="撮影した写真"
            className="aspect-video w-full object-cover"
          />

          {/* 位置情報表示バッジ */}
          {capturedImage.location && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-xs text-white">
              <MapPin className="size-3" />
              <span>位置情報取得済み</span>
            </div>
          )}

          {/* 削除ボタン */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="写真を削除"
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
          >
            <X className="size-4" />
          </button>

          {/* 撮り直しボタン */}
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={disabled || isGettingLocation}
            className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white hover:bg-black/80"
          >
            撮り直す
          </button>
        </div>
      ) : (
        /* 初期状態：撮影ボタン */
        <button
          type="button"
          onClick={handleCaptureClick}
          disabled={disabled || isGettingLocation}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-10 text-muted-foreground transition-colors hover:bg-muted"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="size-8 animate-spin" />
              <span className="text-sm">位置情報を取得中...</span>
            </>
          ) : (
            <>
              <Camera className="size-8" />
              <span className="text-sm">タップして撮影する</span>
              <span className="text-xs opacity-70">
                撮影時に現在地も記録されます
              </span>
            </>
          )}
        </button>
      )}

      {/* 非表示のファイルインプット（カメラ起動用） */}
      {/* capture="environment" で背面カメラを起動 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
