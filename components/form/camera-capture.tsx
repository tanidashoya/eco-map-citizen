"use client";

// components/form/camera-capture.tsx
//
// 役割: カメラで撮影 + Geolocation APIで現在地を取得
// watchPositionで位置を常に追跡し、撮影ボタン押下時は同期的にカメラを起動
// （iOS Safariでは非同期処理後のinput.click()がブロックされるため）

import { useRef, useState, useEffect, useSyncExternalStore } from "react";
import {
  Camera,
  MapPin,
  CheckCircle,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CameraCaptureProps,
  CapturedImage,
  GeoLocation,
  LocationStatus,
} from "@/types/form";
import { compressImageLib } from "@/lib/form/compress-image-lib";
import { isInAppBrowser } from "@/lib/form/detect-in-app-browser";
import { LocationStatusBadge } from "@/components/location/location-status-badge";

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------

const MAX_FILE_SIZE_MB = 15;
const ACCEPTED_TYPES = "image/*";
const emptySubscribe = () => () => {}; //👉 空のサブスクライブ関数（何もしない）⇒一度決まったら変わらないので購読不要
const getInAppSnapshot = () => isInAppBrowser();
const getInAppServerSnapshot = () => false;

// ----------------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------------

export function CameraCapture({
  capturedImage,
  disabled = false,
  onCapture,
}: CameraCaptureProps) {
  // カメラ撮影用のファイルインプット要素のref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // watchPositionで追跡中の現在位置
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(
    null,
  );
  // 位置情報の取得状態（初期状態でGeolocation API対応を判定）
  //遅延初期化を使用して、一度確認しておけばいい条件だから、再レンダリングのたびに初期値の再計算をする必要をなくしている。
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => {
    // SSR時はnavigatorが存在しないため"loading"を返す（今はサーバーで実行されているかの条件分岐(サーバーはwindowオブジェクトを持たない)）
    //これは表示のためというよりもサーバー側でnavigaterに触れた場合にエラーが発生するため、サーバー側では"loading"を返すようにしている。
    //  サーバーとブラウザで初期値が異なる可能性はあるが、
    // 現在のUI構造では大きなDOM差分は生じないため実務上問題になりにくい
    if (typeof window === "undefined") return "loading";
    // Geolocation API非対応の場合は"error"
    return navigator.geolocation ? "loading" : "error";
  });
  // watchPositionのID（クリーンアップ用）
  const watchIdRef = useRef<number | null>(null);

  // アプリ内ブラウザ検出（SSR安全: サーバーではfalse、クライアントで実際の値を返す）
  //👉 useSyncExternalStore:（サーバー）とクライアントで値が違う"外部の状態"を、安全に扱うための技術
  /*
  引数	役割
  第1引数 subscribe	外部状態が変わったら再レンダーさせる
  第2引数 getSnapshot	クライアントで現在値を返す
  第3引数 getServerSnapshot	サーバーで現在値を返す（SSR時にサーバー用のスナップショットを明示的に指定しないと、
　　　　　Reactがクライアント用のgetSnapshotを使おうとして整合性が崩れる可能性があるため第三引数を指定））
  */
  const isInApp = useSyncExternalStore(
    emptySubscribe,
    getInAppSnapshot,
    getInAppServerSnapshot,
  );

  // ----------------------------------------------------------------
  // 位置情報の継続的な追跡（watchPosition）
  // 以前はgetcurrentpositionにしていたが非同期処理の中で位置情報を取得する実装にしており、
  // その非同期処理の中でinput.click()でカメラを起動していたが、これがiOS Safariでブロックされるため、
  // watchPositionを使用して位置情報を継続的に追跡するようにした。
  // ----------------------------------------------------------------
  //初回マウント時に位置情報を取得し、現在位置を設定する
  useEffect(() => {
    // Geolocation API非対応の場合は何もしない（初期状態で"error"になっている）
    if (!navigator.geolocation) return;

    // 位置情報の追跡を開始
    //ref は「watchPositionのIDを保存するため」に使っている
    watchIdRef.current = navigator.geolocation.watchPosition(
      // 成功時
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      // エラー時
      (error) => {
        console.error("位置情報エラー:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
        } else {
          setLocationStatus("error");
        }
      },
      // オプション
      {
        enableHighAccuracy: true,
        maximumAge: 3000, // 3秒以内のキャッシュを使用
        timeout: 20000, // 20秒でタイムアウト
      },
    );

    // クリーンアップ: コンポーネントアンマウント時に追跡を停止
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ----------------------------------------------------------------
  // 画像圧縮
  // ----------------------------------------------------------------
  const compressImage = async (file: File): Promise<File> => {
    return await compressImageLib(file);
  };

  // ----------------------------------------------------------------
  // 撮影ボタン押下時のハンドラ（同期関数 - iOS対応のため重要）
  // ----------------------------------------------------------------
  const handleCaptureClick = () => {
    // 撮り直しの場合、先に既存画像への参照を解放（メモリ効率改善）
    // これによりGCが古い画像を解放可能な状態になる
    if (capturedImage) {
      onCapture(null);
    }

    // 位置情報の状態チェック
    if (locationStatus === "denied") {
      toast.error(
        "位置情報の許可が必要です。ブラウザの設定から許可してください。",
      );
      return;
    }
    if (locationStatus === "loading") {
      toast.info("位置情報を取得中です。しばらくお待ちください。");
      return;
    }
    if (locationStatus === "error") {
      toast.error(
        "位置情報を取得できませんでした。ページを再読み込みしてください。",
      );
      return;
    }

    // 同期的にカメラを起動（これが重要！）
    // iOS Safariでは非同期処理後のclick()がUser Gestureとして認識されないため
    fileInputRef.current?.click();
  };

  // ----------------------------------------------------------------
  // ファイル選択（撮影完了）時のハンドラ
  // ----------------------------------------------------------------
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（圧縮前）
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`ファイルサイズは ${MAX_FILE_SIZE_MB}MB 以内にしてください`);
      return;
    }

    // watchPositionで追跡中の位置を使用（APIを呼ばない）
    const location = currentLocation;

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
      file: compressedFile,
      location,
      capturedAt: new Date().toISOString(),
    };
    onCapture(capturedData);

    // リセット
    e.target.value = "";
  };

  // ----------------------------------------------------------------
  // 削除ボタンのハンドラ
  // ----------------------------------------------------------------
  const handleRemove = () => {
    onCapture(null);
  };

  // ボタンを無効化する条件
  const isButtonDisabled =
    disabled || locationStatus === "loading" || locationStatus === "denied";

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        写真 <span className="text-destructive">*</span>
      </Label>

      {/* アプリ内ブラウザ警告 */}
      {isInApp && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">カメラが起動しない場合があります</p>
            <p className="mt-1 text-xs leading-relaxed">
              「︙」メニューから
              <span className="font-medium">「ブラウザで開く」</span>
              を選択してください。
            </p>
          </div>
        </div>
      )}

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
                disabled={isButtonDisabled}
                className="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
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
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleCaptureClick}
            disabled={isButtonDisabled}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-10 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Camera className="size-8" />
            <span className="text-sm">タップして撮影する</span>
            <span className="text-xs opacity-70">
              撮影時に現在地も記録されます
            </span>
          </button>
          {/* 位置情報ステータス表示 */}
          <div className="flex justify-center">
            <LocationStatusBadge status={locationStatus} />
          </div>
        </div>
      )}
      {/* 注意書き */}
      <p className="ml-1 mt-2 text-left text-xs text-muted-foreground">
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
