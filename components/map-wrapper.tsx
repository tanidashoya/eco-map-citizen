"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Point } from "@/types/maps";
import { Loader2 } from "lucide-react";
import { mergePoints } from "@/lib/geo/merge.points";
import { useMemo } from "react";

const Map = dynamic(() => import("./Map"), { ssr: false });

export default function MapWrapper({
  pointsWithImages,
}: {
  pointsWithImages: Point[];
}) {
  //マップの初期位置を管理
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    null,
  );

  const mergedPoints = useMemo(
    () => mergePoints(pointsWithImages),
    [pointsWithImages],
  );

  //マップの初期位置を取得
  useEffect(() => {
    const startTime = Date.now(); // 開始時間を取得

    const defaultCenter: [number, number] =
      mergedPoints.length > 0
        ? [mergedPoints[0].lat, mergedPoints[0].lng]
        : [34.78, 132.86]; // デフォルト座標

    //最低でも1秒待つようにする
    // マップの初期位置を設定する関数(初期位置の座標を渡す)
    const finish = (center: [number, number]) => {
      const elapsed = Date.now() - startTime; // 経過時間を計算
      const remaining = Math.max(1000 - elapsed, 0); // 残り時間を計算

      setTimeout(() => {
        setInitialCenter(center);
      }, remaining);
    };

    //ブラウザがGeolocation APIをサポートしていない場合はデフォルト座標を設定
    //「位置情報機能が使えない環境なら」
    if (!navigator.geolocation) {
      finish(defaultCenter);
      return;
    }

    //ブラウザがGeolocation APIをサポートしている場合は位置情報を取得
    //現在地を取得し、マップの初期位置を設定
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finish([pos.coords.latitude, pos.coords.longitude]); // 現在地の座標を渡す
      },
      () => {
        finish(defaultCenter); // デフォルト座標を渡す（エラーが渡されたらデフォルト座標を設定）
      },
      { timeout: 5000 }, // タイムアウト時間を設定（タイムアウトしたらエラーが渡される）
    );
  }, [mergedPoints]);

  if (!initialCenter) {
    return (
      <div className="flex justify-center items-center h-full gap-2">
        <Loader2 className="animate-spin size-12 text-green-500" />
        <p className="text-lg font-medium animate-pulse">
          マップを読み込み中...
        </p>
      </div>
    );
  }

  return <Map mergedPoints={mergedPoints} initialCenter={initialCenter} />;
}
