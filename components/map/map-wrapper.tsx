"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { Point } from "@/types/maps";
import { Loader2 } from "lucide-react";
import { mergePoints } from "@/lib/geo/merge.points";
import { useCurrentLocation } from "@/lib/map/use-current-location";
import { cachedCenterAtom } from "@/store/map-store";

const Map = dynamic(() => import("./index"), { ssr: false });

const SESSION_KEY = "map-session-initialized";

export default function MapWrapper({
  pointsWithImages,
}: {
  pointsWithImages: Point[];
}) {
  // Jotai atomWithStorageから初期位置キャッシュを取得（ローカルストレージに永続化）
  const [cachedCenter, setCachedCenter] = useAtom(cachedCenterAtom);

  // 初回マウントかどうかを判定（セッションストレージで管理）
  const [isFirstMount] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem(SESSION_KEY);
  });

  // 現在地を継続監視で取得（一元管理）
  const { coords: currentLocation, isLoading: isLocationLoading } =
    useCurrentLocation(true);

  //マップに表示するデータを座標点ごとにマージ
  const mergedPoints = useMemo(
    () => mergePoints(pointsWithImages),
    [pointsWithImages],
  );

  // マップの初期位置を導出
  const derivedCenter = useMemo((): [number, number] | null => {
    if (currentLocation) return [currentLocation.lat, currentLocation.lng];
    if (!isLocationLoading) {
      return mergedPoints.length > 0
        ? [mergedPoints[0].lat, mergedPoints[0].lng]
        : [34.78, 132.86];
    }
    return null;
  }, [currentLocation, isLocationLoading, mergedPoints]);

  // 一度確定した値をストアにキャッシュ（ローカルストレージに保存され、リロード時もローディングを出さない）
  useEffect(() => {
    if (derivedCenter && !cachedCenter) {
      setCachedCenter(derivedCenter);
    }
  }, [derivedCenter, cachedCenter, setCachedCenter]);

  // セッションストレージにフラグを設定（初回マウント完了を記録）
  useEffect(() => {
    if (derivedCenter && isFirstMount) {
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  }, [derivedCenter, isFirstMount]);

  // 初回マウント時は現在地を優先、2回目以降はcachedCenterを優先
  const initialCenter = isFirstMount
    ? (derivedCenter ?? cachedCenter)
    : (cachedCenter ?? derivedCenter);

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

  return (
    <Map
      mergedPoints={mergedPoints}
      initialCenter={initialCenter}
      currentLocation={currentLocation}
      isLocationLoading={isLocationLoading}
    />
  );
}
