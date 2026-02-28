"use client";

// components/camera-capture.tsx
//
// 役割: カメラで撮影 + Geolocation APIで現在地を取得
// 撮影完了後に位置情報を取得し、画像と位置情報を親に返す

import { useRef, useState } from "react";
import { Camera, MapPin, Loader2, CheckCircle, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CameraCaptureProps, CapturedImage, GeoLocation } from "@/types/form";

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------

const MAX_FILE_SIZE_MB = 15;
const ACCEPTED_TYPES = "image/*";
// Geolocation APIのオプション
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true, // 高精度モード（GPS優先）
  timeout: 10000, // 10秒でタイムアウト
  maximumAge: 0, // キャッシュを使わず常に最新の位置を取得
};

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
  // 位置情報を一時的に保持（撮影前に取得、撮影後に使用）
  const pendingLocationRef = useRef<GeoLocation | null>(null);

  // ----------------------------------------------------------------
  // 画像圧縮（Canvas API）
  // ----------------------------------------------------------------

  const MAX_WIDTH = 1280; // 最大幅
  const MAX_HEIGHT = 1280; // 最大高さ
  const JPEG_QUALITY = 0.8; // 圧縮品質（0.0〜1.0）

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        // 元画像のURL解放
        URL.revokeObjectURL(url);

        // リサイズ計算
        let { width, height } = img;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Canvas作成・描画
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context取得失敗"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Blob化
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("圧縮に失敗しました"));
              return;
            }
            // BlobをFileに変換
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"),
              { type: "image/jpeg" },
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          JPEG_QUALITY,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("画像の読み込みに失敗しました"));
      };

      img.src = url;
    });
  };

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
  const handleCaptureClick = async () => {
    // 位置情報を先に取得してからカメラを起動
    const location = await getLocation();
    pendingLocationRef.current = location;
    fileInputRef.current?.click();
  };

  // ファイル選択（撮影完了）時のハンドラ
  // ファイル選択（撮影完了）時のハンドラ
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（圧縮前）
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`ファイルサイズは ${MAX_FILE_SIZE_MB}MB 以内にしてください`);
      return;
    }

    // 撮影前に取得した位置情報を使用
    const location = pendingLocationRef.current;

    // 位置情報が取得できなかった場合は警告
    if (!location) {
      toast.warning("位置情報を取得できませんでした。再度撮影してください。");
    }

    // 画像を圧縮
    let compressedFile: File;
    try {
      compressedFile = await compressImage(file);
      console.log(
        `圧縮: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`,
      );
    } catch (error) {
      console.error("圧縮エラー:", error);
      toast.error("画像の圧縮に失敗しました");
      return;
    }

    // 親コンポーネントにデータを返す
    const capturedData: CapturedImage = {
      previewUrl: "",
      file: compressedFile, // ← 圧縮後のファイル
      location,
      capturedAt: new Date().toISOString(),
    };
    onCapture(capturedData);

    // リセット
    e.target.value = "";
    pendingLocationRef.current = null;
  };

  // 削除ボタンのハンドラ
  const handleRemove = () => {
    onCapture(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        写真 <span className="text-destructive">*</span>
      </Label>

      {capturedImage ? (
        /* 撮影後の確認表示（プレビューなし） */
        <div className="relative w-full overflow-hidden rounded-xl border-2 border-green-500 bg-green-50">
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            {/* 撮影完了アイコン */}
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="size-8" />
              <span className="text-lg font-medium">撮影完了</span>
            </div>

            {/* ファイル情報 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="size-4" />
              <span>
                {(capturedImage.file.size / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>

            {/* 位置情報表示 */}
            {capturedImage.location ? (
              <div className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs text-white">
                <MapPin className="size-3" />
                <span>位置情報取得済み</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs text-white">
                <MapPin className="size-3" />
                <span>位置情報なし</span>
              </div>
            )}

            {/* ボタン群 */}
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={handleCaptureClick}
                disabled={disabled || isGettingLocation}
                className="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
              >
                撮り直す
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="rounded-full bg-red-100 px-4 py-2 text-sm text-red-600 hover:bg-red-200"
              >
                削除
              </button>
            </div>
          </div>
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
      {/* 注意書きを追加 */}
      <p className="text-xs text-muted-foreground text-left ml-1 mt-2">
        撮影がうまくいかない場合は、
        <br />
        他のアプリやブラウザのタブを閉じてから再度お試しください。
      </p>
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
