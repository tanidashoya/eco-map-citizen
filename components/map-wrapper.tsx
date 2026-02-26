"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { Point } from "@/types/maps";
import { Loader2 } from "lucide-react";
import { mergePoints } from "@/lib/geo/merge.points";
import { useCurrentLocation } from "@/lib/map/use-current-location";
import { cachedCenterAtom } from "@/store/map-store";

const Map = dynamic(() => import("./Map"), { ssr: false });

export default function MapWrapper({
  pointsWithImages,
}: {
  pointsWithImages: Point[];
}) {
  // Jotai atomWithStorageから初期位置キャッシュを取得（ローカルストレージに永続化）
  const [cachedCenter, setCachedCenter] = useAtom(cachedCenterAtom);

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
        ? [mergedPoints[0].latitude, mergedPoints[0].longitude]
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

  //cachedCenterがあればそれを使用し、なければderivedCenterを使用
  const initialCenter = cachedCenter ?? derivedCenter;

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
